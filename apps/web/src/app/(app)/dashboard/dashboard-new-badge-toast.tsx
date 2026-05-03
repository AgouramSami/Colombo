'use client';

import { useEffect, useState } from 'react';

/** Toast gamification badges — composant client seul (pas de dynamic) pour éviter bugs Webpack. */
export function DashboardNewBadgeToast({ badgeNames }: { badgeNames: string[] }) {
  const [visible, setVisible] = useState(false);
  const serialized = badgeNames.join('\u001f');

  useEffect(() => {
    if (badgeNames.length === 0) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 5200);
    return () => window.clearTimeout(timer);
  }, [serialized, badgeNames.length]);

  if (!visible || badgeNames.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 70,
        width: 'min(360px, calc(100vw - 24px))',
        background: 'var(--cb-bg-elev)',
        border: '1px solid color-mix(in srgb, var(--cb-accent) 30%, var(--cb-line))',
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cb-accent)' }}>
            Nouveau badge débloqué
          </div>
          <div className="cb-faint" style={{ marginTop: 4, fontSize: 12.5 }}>
            {badgeNames.join(' · ')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fermer la notification"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--cb-ink-4)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
