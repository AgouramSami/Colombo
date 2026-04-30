import { requireAdmin } from '@/lib/admin';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AdminNav } from './admin-nav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin();

  const initial = (profile?.display_name ?? profile?.email ?? 'A')[0]?.toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
            }}>C</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Colombo</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>Back-office</div>
            </div>
          </Link>
        </div>

        {/* Nav (Client Component — usePathname + hover) */}
        <AdminNav />

        {/* User info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.display_name ?? 'Admin'}
              </div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>Administrateur</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div style={{ flex: 1, marginLeft: 240, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
