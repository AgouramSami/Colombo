'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { href: '/admin/dashboard' | '/admin/utilisateurs' | '/admin/concours' | '/admin/scraper'; label: string; icon: React.ReactNode }[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><title>Dashboard</title><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    ),
  },
  {
    href: '/admin/utilisateurs',
    label: 'Utilisateurs',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><title>Utilisateurs</title><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    href: '/admin/concours',
    label: 'Concours',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><title>Concours</title><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    ),
  },
  {
    href: '/admin/scraper',
    label: 'Scraper',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><title>Scraper</title><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '16px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>
        Navigation
      </div>
      {NAV.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
              background: isActive ? 'rgba(255,255,255,.1)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              marginBottom: 2,
              transition: 'background .15s, color .15s',
            }}
            className="admin-nav-link"
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}

      <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '16px 8px' }} />

      <Link
        href="/dashboard"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8,
          color: 'rgba(255,255,255,.4)', textDecoration: 'none',
          fontSize: 13, marginBottom: 2,
          transition: 'color .15s',
        }}
        className="admin-nav-link"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><title>App</title><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        Retour à l&apos;app
      </Link>

      <style>{`
        .admin-nav-link:hover {
          background: rgba(255,255,255,.08) !important;
          color: #fff !important;
        }
      `}</style>
    </nav>
  );
}
