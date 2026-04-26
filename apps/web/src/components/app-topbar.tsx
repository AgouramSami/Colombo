'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { id: 'pigeonnier', label: 'Mon pigeonnier', href: '/pigeonnier' },
  { id: 'concours', label: 'Concours', href: '/concours' },
  { id: 'reglages', label: 'Réglages', href: '/reglages' },
] as const;

type Props = {
  userName?: string | null;
};

export function AppTopbar({ userName }: Props) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(/[\s.@]/)
        .filter(Boolean)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('')
    : 'E';

  return (
    <header className="cb-topbar">
      <Link href="/pigeonnier" className="cb-topbar__brand" style={{ textDecoration: 'none' }}>
        <PigeonLogoIcon />
        Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
      </Link>

      <nav className="cb-topbar__nav" style={{ marginLeft: 20 }}>
        {NAV_ITEMS.map((item) => {
          const isCurrent = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <a
        href="https://wa.me/33600000000"
        target="_blank"
        rel="noopener noreferrer"
        className="cb-btn cb-btn--ghost"
        style={{ minHeight: 44, padding: '0 14px', fontWeight: 500, fontSize: '0.9375rem' }}
      >
        <HelpIcon />
        Aide
      </a>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="cb-btn cb-btn--ghost"
          style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, gap: 10 }}
          aria-label="Se déconnecter"
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: 'var(--cb-accent-soft)',
              color: 'var(--cb-accent-soft-ink)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {initials}
          </span>
          <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{userName ?? 'Éleveur'}</span>
        </button>
      </form>
    </header>
  );
}

function PigeonLogoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Colombo</title>
      <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
      <circle cx="12" cy="9" r="1" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Aide</title>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
