'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type UserMenuProps = {
  userName?: string | null;
  initials: string;
};

export function UserMenu({ userName, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="cb-user-menu" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cb-btn cb-btn--ghost"
        style={{
          width: '100%',
          minHeight: 44,
          justifyContent: 'flex-start',
          padding: '0 12px',
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utilisateur"
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
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span
          style={{
            fontWeight: 500,
            fontSize: '0.9375rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            textAlign: 'left',
          }}
        >
          {userName ?? 'Eleveur'}
        </span>
        <ChevronIcon up={open} />
      </button>

      {open && (
        <div className="cb-user-menu__panel" role="menu">
          <Link
            href="/reglages"
            className="cb-user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <GearIcon />
            Réglages
          </Link>
          <a
            href="https://wa.me/33600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="cb-user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <HelpIcon />
            Aide WhatsApp
          </a>
          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button
              type="submit"
              className="cb-user-menu__item cb-user-menu__item--danger"
              role="menuitem"
              style={{ cursor: 'pointer' }}
            >
              <LogoutIcon />
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: up ? 'rotate(180deg)' : undefined,
        transition: 'transform 0.2s',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function HelpIcon() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
