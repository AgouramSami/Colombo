'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function AdminPagination({
  total,
  page,
  limit,
}: {
  total: number;
  page: number;
  limit: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}` as '/');
  }

  function setLimit(l: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', String(l));
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}` as '/');
  }

  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 6,
    background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '0 6px',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        {total === 0 ? 'Aucun résultat' : `${from}–${to} sur ${total.toLocaleString('fr-FR')} résultat${total > 1 ? 's' : ''}`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          Afficher
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, background: '#fff', cursor: 'pointer' }}
          >
            {[20, 50, 100, 200, 500, 1000].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          par page
        </div>

        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />

        {/* Pagination */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            style={{ ...btnBase, color: page <= 1 ? '#cbd5e1' : '#334155', cursor: page <= 1 ? 'default' : 'pointer' }}
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} style={{ ...btnBase, border: 'none', background: 'none', color: '#94a3b8', cursor: 'default' }}>…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p as number)}
                style={{
                  ...btnBase,
                  background: p === page ? '#6366f1' : '#fff',
                  color: p === page ? '#fff' : '#334155',
                  borderColor: p === page ? '#6366f1' : '#e2e8f0',
                  fontWeight: p === page ? 700 : 400,
                }}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            style={{ ...btnBase, color: page >= totalPages ? '#cbd5e1' : '#334155', cursor: page >= totalPages ? 'default' : 'pointer' }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
