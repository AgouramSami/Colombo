import { requireAdmin } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

function KpiCard({
  label,
  value,
  sub,
  accent,
}: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: '#94a3b8',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: accent ? 'var(--cb-accent, #6366f1)' : '#0f172a',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const db = createServiceClient();

  const [
    { count: totalUsers },
    { count: totalPigeons },
    { count: totalRaces },
    { count: totalPdfs },
    { count: pdfsSuccess },
    { count: pagesCrawled },
    { count: newUsersWeek },
    { data: recentUsers },
    { data: recentRaces },
    { data: lastPdf },
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('pigeons').select('*', { count: 'exact', head: true }),
    db.from('races').select('*', { count: 'exact', head: true }),
    db.from('race_pdfs').select('*', { count: 'exact', head: true }),
    db.from('race_pdfs').select('*', { count: 'exact', head: true }).eq('parse_status', 'success'),
    db.from('crawled_result_pages').select('*', { count: 'exact', head: true }),
    db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    db
      .from('users')
      .select('id, email, display_name, plan, is_admin, created_at, onboarded_at')
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('races')
      .select('id, race_date, release_point, category, pigeons_released')
      .order('race_date', { ascending: false })
      .limit(5),
    db
      .from('race_pdfs')
      .select('parsed_at, parse_status')
      .order('parsed_at', { ascending: false })
      .limit(1),
  ]);

  const lastParsed = lastPdf?.[0]?.parsed_at
    ? new Date(lastPdf[0].parsed_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const th: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
  };

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          Vue d&apos;ensemble de la plateforme Colombo
        </p>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <KpiCard
          label="Utilisateurs"
          value={totalUsers ?? 0}
          sub={`+${newUsersWeek ?? 0} cette semaine`}
        />
        <KpiCard label="Pigeons" value={(totalPigeons ?? 0).toLocaleString('fr-FR')} />
        <KpiCard label="Concours" value={(totalRaces ?? 0).toLocaleString('fr-FR')} />
        <KpiCard
          label="PDFs traités"
          value={pdfsSuccess ?? 0}
          sub={`${totalPdfs ?? 0} total`}
          accent
        />
        <KpiCard label="Pages crawlées" value={(pagesCrawled ?? 0).toLocaleString('fr-FR')} />
        <KpiCard label="Dernier import" value={lastParsed} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Derniers utilisateurs */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
              Dernières inscriptions
            </span>
            <a
              href="/admin/utilisateurs"
              style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}
            >
              Voir tout →
            </a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Plan</th>
                <th style={th}>Inscrit</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).map((u) => (
                <tr key={u.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{u.display_name ?? '—'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: u.is_admin
                          ? '#fef3c7'
                          : u.plan === 'eleveur'
                            ? '#ede9fe'
                            : '#f1f5f9',
                        color: u.is_admin
                          ? '#92400e'
                          : u.plan === 'eleveur'
                            ? '#5b21b6'
                            : '#64748b',
                      }}
                    >
                      {u.is_admin ? 'Admin' : u.plan}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#94a3b8', fontSize: 12 }}>
                    {new Date(u.created_at ?? '').toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Derniers concours */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
              Derniers concours importés
            </span>
            <a
              href="/admin/concours"
              style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}
            >
              Voir tout →
            </a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Lâcher</th>
                <th style={th}>Engagés</th>
              </tr>
            </thead>
            <tbody>
              {(recentRaces ?? []).map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {new Date(r.race_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </td>
                  <td style={td}>{r.release_point}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>
                    {r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
