import { requireAdmin } from '@/lib/admin';
import { AdminPagination } from '@/app/admin/admin-pagination';
import { createServiceClient } from '@/lib/supabase/service';

const CAT: Record<string, string> = {
  vitesse: 'Vitesse', petit_demi_fond: 'PDF', demi_fond: 'DF',
  grand_demi_fond: 'GDF', fond: 'Fond', grand_fond: 'GF', jeunes: 'Jeunes',
};

export default async function AdminConcoursPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; limit?: string; q?: string; cat?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params?.page ?? '1'));
  const limit = Math.min(1000, Math.max(1, parseInt(params?.limit ?? '20')));
  const q = (params?.q ?? '').trim();
  const catFilter = params?.cat ?? '';

  const db = createServiceClient();

  // Compte total
  let countQuery = db.from('races').select('*', { count: 'exact', head: true });
  if (q) countQuery = countQuery.ilike('release_point', `%${q}%`);
  if (catFilter) countQuery = countQuery.eq('category', catFilter);
  const { count: total } = await countQuery;

  // Stats globales (indépendantes du filtre)
  const [{ count: totalRacesAll }, { count: totalResults }] = await Promise.all([
    db.from('races').select('*', { count: 'exact', head: true }),
    db.from('pigeon_results').select('*', { count: 'exact', head: true }),
  ]);
  const avgResults = totalRacesAll ? Math.round((totalResults ?? 0) / totalRacesAll) : 0;

  // Page courante
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let dataQuery = db
    .from('races')
    .select('id, race_date, release_point, category, age_class, pigeons_released, distance_min_km, clubs(name)')
    .order('race_date', { ascending: false })
    .range(from, to);
  if (q) dataQuery = dataQuery.ilike('release_point', `%${q}%`);
  if (catFilter) dataQuery = dataQuery.eq('category', catFilter);
  const { data: races } = await dataQuery;

  // Compter les résultats pour ces courses uniquement
  const raceIds = (races ?? []).map((r) => r.id);
  const { data: resultRows } = raceIds.length
    ? await db.from('pigeon_results').select('race_id').in('race_id', raceIds)
    : { data: [] };
  const countByRace = new Map<string, number>();
  for (const r of resultRows ?? []) {
    countByRace.set(r.race_id, (countByRace.get(r.race_id) ?? 0) + 1);
  }

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' };

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Concours</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Courses importées depuis Francolomb</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Courses totales', value: (totalRacesAll ?? 0).toLocaleString('fr-FR') },
          { label: 'Résultats totaux', value: (totalResults ?? 0).toLocaleString('fr-FR') },
          { label: 'Moy. pigeons / course', value: avgResults.toLocaleString('fr-FR') },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <form method="GET" style={{ display: 'flex', gap: 0, flex: 1, minWidth: 200, maxWidth: 320 }}>
          <input name="q" defaultValue={q} placeholder="Rechercher un lieu de lâcher..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 13 }} />
          <button type="submit" style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: 13 }}>
            Chercher
          </button>
          {catFilter && <input type="hidden" name="cat" value={catFilter} />}
        </form>
        <form method="GET" style={{ display: 'flex', gap: 0 }}>
          <select name="cat" defaultValue={catFilter} onChange={(e) => { }} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
            <option value="">Toutes catégories</option>
            {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" style={{ display: 'none' }} />
          {q && <input type="hidden" name="q" value={q} />}
        </form>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Lâcher</th>
                <th style={th}>Catégorie</th>
                <th style={th}>Distance</th>
                <th style={th}>Engagés</th>
                <th style={th}>Résultats</th>
                <th style={th}>Club</th>
              </tr>
            </thead>
            <tbody>
              {(races ?? []).length === 0 ? (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }}>Aucune course trouvée</td></tr>
              ) : (races ?? []).map((r) => {
                const club = r.clubs as unknown as { name: string } | null;
                const results = countByRace.get(r.id) ?? 0;
                return (
                  <tr key={r.id} className="admin-tr">
                    <td style={{ ...td, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {new Date(r.race_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ ...td, fontWeight: 500 }}>{r.release_point}</td>
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                        {CAT[r.category] ?? r.category}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#94a3b8' }}>{r.distance_min_km ? `${r.distance_min_km} km` : '—'}</td>
                    <td style={{ ...td, color: '#64748b' }}>{r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}</td>
                    <td style={td}>
                      <span style={{ fontWeight: results > 0 ? 700 : 400, color: results > 0 ? '#6366f1' : '#cbd5e1' }}>
                        {results > 0 ? results.toLocaleString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: 12 }}>{club?.name ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination total={total ?? 0} page={page} limit={limit} />
        <style>{`.admin-tr:hover td { background: #f8fafc; }`}</style>
      </div>
    </main>
  );
}
