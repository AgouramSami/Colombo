import { requireAdmin } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

const CAT: Record<string, string> = {
  vitesse: 'Vitesse', petit_demi_fond: 'PDF', demi_fond: 'DF',
  grand_demi_fond: 'GDF', fond: 'Fond', grand_fond: 'GF', jeunes: 'Jeunes',
};

export default async function AdminConcoursPage() {
  await requireAdmin();
  const db = createServiceClient();

  const { data: races } = await db
    .from('races')
    .select('id, race_date, release_point, category, age_class, pigeons_released, distance_min_km, distance_max_km, clubs(name)')
    .order('race_date', { ascending: false })
    .limit(200);

  const raceIds = (races ?? []).map((r) => r.id);
  const { data: resultCounts } = raceIds.length
    ? await db.from('pigeon_results').select('race_id').in('race_id', raceIds)
    : { data: [] };

  const countByRace = new Map<string, number>();
  for (const r of resultCounts ?? []) {
    countByRace.set(r.race_id, (countByRace.get(r.race_id) ?? 0) + 1);
  }

  // Stats globales
  const totalRaces = races?.length ?? 0;
  const totalResults = [...countByRace.values()].reduce((s, v) => s + v, 0);
  const avgResults = totalRaces > 0 ? Math.round(totalResults / totalRaces) : 0;

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc',
  };
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' };

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Concours</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Courses importées depuis Francolomb</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Courses importées', value: totalRaces.toLocaleString('fr-FR') },
          { label: 'Résultats totaux', value: totalResults.toLocaleString('fr-FR') },
          { label: 'Moy. pigeons / course', value: avgResults.toLocaleString('fr-FR') },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0f172a' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
          Affichage des 200 dernières courses
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
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
              {(races ?? []).map((r) => {
                const club = r.clubs as unknown as { name: string } | null;
                const results = countByRace.get(r.id) ?? 0;
                return (
                  <tr key={r.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td style={{ ...td, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {new Date(r.race_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ ...td, fontWeight: 500 }}>{r.release_point}</td>
                    <td style={td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: '#f1f5f9', color: '#475569',
                      }}>
                        {CAT[r.category] ?? r.category}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#94a3b8' }}>
                      {r.distance_min_km ? `${r.distance_min_km} km` : '—'}
                    </td>
                    <td style={{ ...td, color: '#64748b' }}>
                      {r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}
                    </td>
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
      </div>
    </main>
  );
}
