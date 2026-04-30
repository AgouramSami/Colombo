import { AdminPagination } from '@/app/admin/admin-pagination';
import { requireAdmin } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

export default async function AdminScraperPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; limit?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page ?? '1'));
  const limit = Math.min(1000, Math.max(1, parseInt(params?.limit ?? '20')));
  const statusFilter = params?.status ?? '';

  const db = createServiceClient();

  // Compte total PDFs (avec filtre optionnel)
  let pdfCountQuery = db.from('race_pdfs').select('*', { count: 'exact', head: true });
  if (statusFilter) pdfCountQuery = statusFilter === 'success'
    ? pdfCountQuery.eq('parse_status', 'success')
    : pdfCountQuery.neq('parse_status', 'success');
  const { count: pdfTotal } = await pdfCountQuery;

  const [
    { count: pagesCrawled },
    { count: totalPdfs },
    { count: pdfsSuccess },
    { count: pdfsFailed },
    { count: totalRaces },
    { count: totalPigeons },
    { data: recentPdfs },
  ] = await Promise.all([
    db.from('crawled_result_pages').select('*', { count: 'exact', head: true }),
    db.from('race_pdfs').select('*', { count: 'exact', head: true }),
    db.from('race_pdfs').select('*', { count: 'exact', head: true }).eq('parse_status', 'success'),
    db.from('race_pdfs').select('*', { count: 'exact', head: true }).neq('parse_status', 'success'),
    db.from('races').select('*', { count: 'exact', head: true }),
    db.from('pigeons').select('*', { count: 'exact', head: true }),
    (() => {
      let q = db.from('race_pdfs')
        .select('id, pdf_url, pdf_title, parse_status, parse_method, parsed_at, races(race_date, release_point, category)')
        .order('parsed_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (statusFilter === 'success') q = q.eq('parse_status', 'success');
      else if (statusFilter === 'failed') q = q.neq('parse_status', 'success');
      return q;
    })(),
  ]);

  const successRate = totalPdfs ? Math.round(((pdfsSuccess ?? 0) / totalPdfs) * 100) : 0;

  const lastRun = recentPdfs?.[0]?.parsed_at
    ? new Date(recentPdfs[0].parsed_at).toLocaleString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' };

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Scraper</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          Statut de l&apos;import Francolomb — dernier run : {lastRun}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Pages crawlées', value: (pagesCrawled ?? 0).toLocaleString('fr-FR'), color: '#0f172a' },
          { label: 'PDFs traités', value: pdfsSuccess ?? 0, color: '#16a34a' },
          { label: 'PDFs échoués', value: pdfsFailed ?? 0, color: (pdfsFailed ?? 0) > 0 ? '#dc2626' : '#94a3b8' },
          { label: 'Taux succès', value: `${successRate}%`, color: successRate >= 80 ? '#16a34a' : '#f59e0b' },
          { label: 'Courses en DB', value: (totalRaces ?? 0).toLocaleString('fr-FR'), color: '#6366f1' },
          { label: 'Pigeons en DB', value: (totalPigeons ?? 0).toLocaleString('fr-FR'), color: '#0f172a' },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '1.625rem', fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Taux de parsing</span>
          <span style={{ fontSize: 14, color: '#64748b' }}>{pdfsSuccess ?? 0} / {totalPdfs ?? 0} PDFs</span>
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${successRate}%`,
            background: successRate >= 80 ? '#16a34a' : '#f59e0b',
            borderRadius: 999, transition: 'width .5s',
          }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          {successRate}% de succès · {pdfsFailed ?? 0} échec{(pdfsFailed ?? 0) > 1 ? 's' : ''} en quarantaine
        </div>
      </div>

      {/* Derniers PDFs */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>PDFs importés</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={th}>PDF</th>
                <th style={th}>Course</th>
                <th style={th}>Méthode</th>
                <th style={th}>Statut</th>
                <th style={th}>Parsé le</th>
              </tr>
            </thead>
            <tbody>
              {(recentPdfs ?? []).map((p) => {
                const race = p.races as unknown as { race_date: string; release_point: string } | null;
                const filename = p.pdf_url.split('/').pop() ?? p.pdf_url;
                const isSuccess = p.parse_status === 'success';
                return (
                  <tr key={p.id} className="admin-tr">
                    <td style={td}>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.pdf_title ?? filename}
                      </div>
                    </td>
                    <td style={td}>
                      {race ? (
                        <span style={{ fontSize: 12 }}>
                          {new Date(race.race_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })} · {race.release_point}
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                        {p.parse_method ?? '—'}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: isSuccess ? '#dcfce7' : '#fee2e2',
                        color: isSuccess ? '#166534' : '#991b1b',
                      }}>
                        {isSuccess ? 'OK' : p.parse_status}
                      </span>
                    </td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {p.parsed_at ? new Date(p.parsed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminPagination total={pdfTotal ?? 0} page={page} limit={limit} />
      </div>
      <style>{`.admin-tr:hover td { background: #f8fafc; }`}</style>
    </main>
  );
}
