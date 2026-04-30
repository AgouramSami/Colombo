import { requireAdmin } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

const PLAN_LABEL: Record<string, string> = { free: 'Gratuit', eleveur: 'Éleveur', club: 'Club' };

export default async function AdminUsersPage() {
  await requireAdmin();
  const db = createServiceClient();

  const { data: users } = await db
    .from('users')
    .select('id, email, display_name, plan, is_admin, onboarded_at, created_at')
    .order('created_at', { ascending: false });

  // Compter les pigeons par user via lofts
  const { data: loftCounts } = await db
    .from('lofts')
    .select('user_id, id')
    .is('deleted_at', null);

  const { data: pigeonCounts } = await db
    .from('pigeons')
    .select('loft_id');

  const loftsByUser = new Map<string, string[]>();
  for (const l of loftCounts ?? []) {
    const arr = loftsByUser.get(l.user_id) ?? [];
    arr.push(l.id);
    loftsByUser.set(l.user_id, arr);
  }

  const pigeonsByLoft = new Map<string, number>();
  for (const p of pigeonCounts ?? []) {
    if (p.loft_id) pigeonsByLoft.set(p.loft_id, (pigeonsByLoft.get(p.loft_id) ?? 0) + 1);
  }

  const getPigeonCount = (userId: string) =>
    (loftsByUser.get(userId) ?? []).reduce((s, lid) => s + (pigeonsByLoft.get(lid) ?? 0), 0);

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc',
  };
  const td: React.CSSProperties = { padding: '13px 16px', fontSize: 14, color: '#334155', borderBottom: '1px solid #f1f5f9' };

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Utilisateurs</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          {users?.length ?? 0} compte{(users?.length ?? 0) > 1 ? 's' : ''} enregistré{(users?.length ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={th}>Utilisateur</th>
                <th style={th}>Plan</th>
                <th style={th}>Pigeons</th>
                <th style={th}>Onboardé</th>
                <th style={th}>Inscrit le</th>
                <th style={th}>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => {
                const pigeons = getPigeonCount(u.id);
                return (
                  <tr key={u.id} style={{ transition: 'background .1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.display_name ?? '—'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{u.email}</div>
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: u.plan === 'eleveur' ? '#ede9fe' : u.plan === 'club' ? '#dcfce7' : '#f1f5f9',
                        color: u.plan === 'eleveur' ? '#5b21b6' : u.plan === 'club' ? '#166534' : '#64748b',
                      }}>
                        {PLAN_LABEL[u.plan] ?? u.plan}
                      </span>
                    </td>
                    <td style={{ ...td, fontWeight: pigeons > 0 ? 600 : 400, color: pigeons > 0 ? '#0f172a' : '#cbd5e1' }}>
                      {pigeons}
                    </td>
                    <td style={td}>
                      {u.onboarded_at ? (
                        <span style={{ color: '#16a34a', fontWeight: 500, fontSize: 13 }}>✓ Oui</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 13 }}>Non</span>
                      )}
                    </td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={td}>
                      {u.is_admin ? (
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: '#fef3c7', color: '#92400e',
                        }}>Admin</span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>Éleveur</span>
                      )}
                    </td>
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
