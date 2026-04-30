import { requireAdmin } from '@/lib/admin';
import { fetchAllRows } from '@/lib/supabase/paginate';
import { createServiceClient } from '@/lib/supabase/service';
import { type UserRow, UsersManager } from './users-manager';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; limit?: string; q?: string; plan?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params?.page ?? '1'));
  const limit = Math.min(1000, Math.max(1, parseInt(params?.limit ?? '20')));
  const q = (params?.q ?? '').trim();
  const planFilter = params?.plan ?? '';

  const db = createServiceClient();

  // Compte total (avec filtres)
  let countQuery = db.from('users').select('*', { count: 'exact', head: true });
  if (q) countQuery = countQuery.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (planFilter) countQuery = countQuery.eq('plan', planFilter);
  const { count: total } = await countQuery;

  // Page courante
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let dataQuery = db
    .from('users')
    .select('id, email, display_name, plan, is_admin, onboarded_at, created_at')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (q) dataQuery = dataQuery.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (planFilter) dataQuery = dataQuery.eq('plan', planFilter);
  const { data: rawUsers } = await dataQuery;

  // Compter les pigeons pour les users de cette page
  const userIds = (rawUsers ?? []).map((u) => u.id);
  type LoftRow = { user_id: string; id: string };
  type PigeonRow = { loft_id: string | null };

  const [loftCounts, pigeonCounts] = userIds.length
    ? await Promise.all([
        fetchAllRows<LoftRow>((f, t) => db.from('lofts').select('user_id, id').is('deleted_at', null).in('user_id', userIds).range(f, t)),
        fetchAllRows<PigeonRow>((f, t) => db.from('pigeons').select('loft_id').range(f, t)),
      ])
    : [[], []];

  const loftsByUser = new Map<string, string[]>();
  for (const l of loftCounts) {
    const arr = loftsByUser.get(l.user_id) ?? [];
    arr.push(l.id);
    loftsByUser.set(l.user_id, arr);
  }
  const pigeonsByLoft = new Map<string, number>();
  for (const p of pigeonCounts) {
    if (p.loft_id) pigeonsByLoft.set(p.loft_id, (pigeonsByLoft.get(p.loft_id) ?? 0) + 1);
  }

  const users: UserRow[] = (rawUsers ?? []).map((u) => ({
    ...u,
    pigeon_count: (loftsByUser.get(u.id) ?? []).reduce((s, lid) => s + (pigeonsByLoft.get(lid) ?? 0), 0),
  }));

  return (
    <main style={{ padding: '32px 36px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Utilisateurs</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {(total ?? 0).toLocaleString('fr-FR')} compte{(total ?? 0) > 1 ? 's' : ''} enregistré{(total ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <UsersManager
        users={users}
        total={total ?? 0}
        page={page}
        limit={limit}
        q={q}
        planFilter={planFilter}
      />
    </main>
  );
}
