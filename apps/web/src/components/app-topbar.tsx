'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    id: 'pigeonnier',
    label: 'Pigeonnier',
    href: '/pigeonnier',
    icon: <PigeonIcon />,
  },
  {
    id: 'concours',
    label: 'Concours',
    href: '/concours',
    icon: <FlagIcon />,
  },
  {
    id: 'reglages',
    label: 'Réglages',
    href: '/reglages',
    icon: <GearIcon />,
  },
  {
    id: 'aide',
    label: 'Aide',
    href: 'https://wa.me/33600000000',
    icon: <HelpIcon />,
    external: true,
  },
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
    <>
      {/* Topbar — desktop complet, mobile logo + avatar seulement */}
      <header className="cb-topbar">
        <Link href="/pigeonnier" className="cb-topbar__brand" style={{ textDecoration: 'none' }}>
          <PigeonLogoIcon />
          Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
        </Link>

        {/* Nav — masquée sur mobile */}
        <nav className="cb-topbar__nav cb-hide-on-mobile" style={{ marginLeft: 20 }}>
          {NAV_ITEMS.filter((i) => i.id !== 'aide').map((item) => {
            const isCurrent = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                style={{ textDecoration: 'none' }}
              >
                {item.id === 'pigeonnier' ? 'Mon pigeonnier' : item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Aide — masquée sur mobile */}
        <a
          href="https://wa.me/33600000000"
          target="_blank"
          rel="noopener noreferrer"
          className="cb-btn cb-btn--ghost cb-hide-on-mobile"
          style={{ minHeight: 44, padding: '0 14px', fontWeight: 500, fontSize: '0.9375rem' }}
        >
          <HelpIcon />
          Aide
        </a>

        {/* Avatar + déconnexion — visible partout */}
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
            <span className="cb-hide-on-mobile" style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
              {userName ?? 'Éleveur'}
            </span>
          </button>
        </form>
      </header>

      {/* Barre de navigation en bas — mobile uniquement */}
      <nav className="cb-bottomnav" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
          const isExternal = 'external' in item && item.external;
          const isCurrent = !isExternal && pathname.startsWith(item.href);
          if (isExternal) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cb-bottomnav__item"
                data-active="false"
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            );
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              className="cb-bottomnav__item"
              aria-current={isCurrent ? 'page' : undefined}
              data-active={String(isCurrent)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
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

function PigeonIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Mon pigeonnier</title>
      <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
      <circle cx="12" cy="9" r="1" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Concours</title>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Réglages</title>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="24"
      height="24"
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
