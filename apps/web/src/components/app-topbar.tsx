'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <>
      {/* Topbar — desktop uniquement, masquée sur mobile */}
      <header className="cb-topbar cb-topbar--desktop">
        <Link href="/pigeonnier" className="cb-topbar__brand" style={{ textDecoration: 'none' }}>
          <PigeonLogoIcon />
          Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
        </Link>

        <nav className="cb-topbar__nav" style={{ marginLeft: 20 }}>
          <Link
            href="/dashboard"
            data-current={String(isActive('/dashboard'))}
            style={{ textDecoration: 'none' }}
          >
            Accueil
          </Link>
          <Link
            href="/pigeonnier"
            data-current={String(isActive('/pigeonnier'))}
            style={{ textDecoration: 'none' }}
          >
            Pigeonnier
          </Link>
          <Link
            href="/concours"
            data-current={String(isActive('/concours'))}
            style={{ textDecoration: 'none' }}
          >
            Concours
          </Link>
          <Link
            href="/reglages"
            data-current={String(isActive('/reglages'))}
            style={{ textDecoration: 'none' }}
          >
            Réglages
          </Link>
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

      {/* Bottom nav — mobile uniquement */}
      <nav className="cb-bottomnav" aria-label="Navigation">
        <Link
          href="/dashboard"
          className="cb-bottomnav__item"
          data-active={String(isActive('/dashboard'))}
        >
          <HomeIcon active={isActive('/dashboard')} />
          <span>Accueil</span>
        </Link>

        <Link
          href="/pigeonnier"
          className="cb-bottomnav__item"
          data-active={String(isActive('/pigeonnier'))}
        >
          <PigeonIcon active={isActive('/pigeonnier')} />
          <span>Pigeonnier</span>
        </Link>

        {/* Bouton + central */}
        <Link
          href="/pigeonnier/ajouter"
          className="cb-bottomnav__fab"
          aria-label="Ajouter un pigeon"
        >
          <PlusIcon />
        </Link>

        <Link
          href="/concours"
          className="cb-bottomnav__item"
          data-active={String(isActive('/concours'))}
        >
          <FlagIcon active={isActive('/concours')} />
          <span>Concours</span>
        </Link>

        <Link
          href="/reglages"
          className="cb-bottomnav__item"
          data-active={String(isActive('/reglages'))}
        >
          <GearIcon active={isActive('/reglages')} />
          <span>Réglages</span>
        </Link>
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

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? 'var(--cb-accent)' : 'none'}
      stroke={active ? 'var(--cb-accent)' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Accueil</title>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PigeonIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? 'var(--cb-accent)' : 'none'}
      stroke={active ? 'var(--cb-accent)' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Pigeonnier</title>
      <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
      <circle cx="12" cy="9" r="1" fill={active ? 'var(--cb-bg-elev)' : 'currentColor'} />
    </svg>
  );
}

function FlagIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? 'var(--cb-accent)' : 'none'}
      stroke={active ? 'var(--cb-accent)' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Concours</title>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" stroke={active ? 'var(--cb-accent)' : 'currentColor'} />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? 'var(--cb-accent)' : 'currentColor'}
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

function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Ajouter un pigeon</title>
      <path d="M12 5v14M5 12h14" />
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
