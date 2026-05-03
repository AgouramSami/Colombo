'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { UserMenu } from './user-menu';

type Props = {
  userName?: string | null;
};

export function AppTopbar({ userName }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const className = 'cb-has-desktop-sidebar';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, []);

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
      {/* Sidebar — desktop uniquement, masquée sur mobile */}
      <aside className="cb-sidebar cb-sidebar--desktop" aria-label="Navigation principale">
        <Link href="/pigeonnier" className="cb-topbar__brand" style={{ textDecoration: 'none' }}>
          <PigeonLogoIcon />
          Colombo<span style={{ color: 'var(--cb-accent)', marginLeft: 1 }}>&apos;</span>
        </Link>

        <nav className="cb-sidebar__nav">
          <Link
            href="/dashboard"
            data-current={String(isActive('/dashboard'))}
            style={{ textDecoration: 'none' }}
          >
            Tableau de bord
          </Link>
          <Link
            href="/pigeonnier"
            data-current={String(isActive('/pigeonnier'))}
            style={{ textDecoration: 'none' }}
          >
            Mon Pigeonnier
          </Link>
          <Link
            href="/concours"
            data-current={String(isActive('/concours'))}
            style={{ textDecoration: 'none' }}
          >
            Palmar&egrave;s &amp; Concours
          </Link>
          <Link
            href="/performance"
            data-current={String(pathname.startsWith('/performance'))}
            style={{ textDecoration: 'none' }}
          >
            Analyses
          </Link>
        </nav>

        <div style={{ flex: 1 }} />

        <UserMenu userName={userName} initials={initials} />
      </aside>

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

        <Link
          href="/concours"
          className="cb-bottomnav__item"
          data-active={String(isActive('/concours'))}
        >
          <FlagIcon active={isActive('/concours')} />
          <span>Concours</span>
        </Link>

        <Link
          href="/performance"
          className="cb-bottomnav__item"
          data-active={String(pathname.startsWith('/performance'))}
        >
          <ChartIcon active={pathname.startsWith('/performance')} />
          <span>Analyses</span>
        </Link>

        <Link
          href="/reglages"
          className="cb-bottomnav__item"
          data-active={String(isActive('/reglages'))}
        >
          <span className="cb-bottomnav__profile-disc">{initials}</span>
          <span>Profil</span>
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

function ChartIcon({ active }: { active: boolean }) {
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
      <title>Analyses</title>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
