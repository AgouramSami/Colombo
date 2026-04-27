'use client';

import { AppTopbar } from '@/components/app-topbar';
import { useState } from 'react';
import type { Race } from './page';

const CATEGORY_LABELS: Record<string, string> = {
  vitesse: 'Vitesse',
  petit_demi_fond: 'Petit demi-fond',
  demi_fond: 'Demi-fond',
  grand_demi_fond: 'Grand demi-fond',
  fond: 'Fond',
  grand_fond: 'Grand fond',
  jeunes: 'Jeunes',
};

const AGE_LABELS: Record<string, string> = {
  vieux: 'Vieux',
  jeune: 'Jeunes',
};

type Tab = 'mes' | 'tous';

export function ConcoursView({
  userName,
  races,
}: {
  userName: string;
  races: Race[];
}) {
  const [tab, setTab] = useState<Tab>('mes');

  const mesRaces = races.filter((r) => r.your_engaged > 0);
  const displayed = tab === 'mes' ? mesRaces : races;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 52,
    padding: '0 20px',
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--cb-accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
    fontWeight: active ? 700 : 500,
    marginBottom: -1,
    fontSize: '1rem',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
              Saison 2026
            </div>
            <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
              Concours
            </h1>
            <p className="cb-muted" style={{ margin: '6px 0 0', fontSize: '1.0625rem' }}>
              {mesRaces.length} participation{mesRaces.length > 1 ? 's' : ''} · {races.length}{' '}
              concours au total
            </p>
          </div>
          <div
            className="cb-card"
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--cb-accent-soft)',
              border: '1px solid color-mix(in oklab, var(--cb-accent) 20%, transparent)',
            }}
          >
            <SyncIcon />
            <span style={{ fontSize: 14, color: 'var(--cb-accent-soft-ink)', fontWeight: 500 }}>
              Importation automatique active
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--cb-line)',
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            className="cb-btn"
            style={tabStyle(tab === 'mes')}
            onClick={() => setTab('mes')}
          >
            Mes concours
            <span
              className="cb-muted"
              style={{ fontWeight: 500, marginLeft: 8, fontSize: '0.875em' }}
            >
              {mesRaces.length}
            </span>
          </button>
          <button
            type="button"
            className="cb-btn"
            style={tabStyle(tab === 'tous')}
            onClick={() => setTab('tous')}
          >
            Tous les concours
            <span
              className="cb-muted"
              style={{ fontWeight: 500, marginLeft: 8, fontSize: '0.875em' }}
            >
              {races.length}
            </span>
          </button>
        </div>

        {displayed.length === 0 ? (
          <div className="cb-card" style={{ padding: 48, textAlign: 'center' }}>
            {tab === 'mes' ? (
              <>
                <p className="cb-muted" style={{ fontSize: '1.0625rem' }}>
                  Vous n&apos;avez participé à aucun concours pour le moment.
                </p>
                <p className="cb-faint" style={{ marginTop: 8 }}>
                  Vos pigeons apparaîtront ici dès que leurs résultats seront importés.
                </p>
                <button
                  type="button"
                  className="cb-btn cb-btn--soft"
                  style={{ marginTop: 20 }}
                  onClick={() => setTab('tous')}
                >
                  Voir tous les concours disponibles
                </button>
              </>
            ) : (
              <>
                <p className="cb-muted" style={{ fontSize: '1.0625rem' }}>
                  Aucun concours importé pour le moment.
                </p>
                <p className="cb-faint" style={{ marginTop: 8 }}>
                  Les résultats Francolomb sont importés automatiquement toutes les 2 heures.
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <PastList races={displayed} showParticipation={tab === 'mes'} />
          </div>
        )}
      </main>
    </div>
  );
}

function PastList({ races, showParticipation }: { races: Race[]; showParticipation: boolean }) {
  const th: React.CSSProperties = {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  return (
    <div className="cb-card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
        <thead>
          <tr
            style={{
              background: 'var(--cb-bg-sunken)',
              color: 'var(--cb-ink-3)',
              textAlign: 'left',
            }}
          >
            <th style={{ ...th, padding: '14px 22px', minWidth: 90 }}>Date</th>
            <th style={{ ...th, padding: '14px 16px' }}>Concours</th>
            <th style={{ ...th, padding: '14px 16px', textAlign: 'right' }}>Engagés</th>
            {showParticipation && (
              <>
                <th style={{ ...th, padding: '14px 16px', textAlign: 'right' }}>Vos pigeons</th>
                <th style={{ ...th, padding: '14px 16px', textAlign: 'right' }}>Meilleure place</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {races.map((r) => (
            <tr
              key={r.id}
              style={{ borderTop: '1px solid var(--cb-line-2)', height: 64 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--cb-bg-sunken)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <td style={{ padding: '12px 22px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {new Date(r.race_date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                })}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 600 }}>{r.release_point}</div>
                <div className="cb-muted" style={{ fontSize: 12 }}>
                  {CATEGORY_LABELS[r.category] ?? r.category} ·{' '}
                  {AGE_LABELS[r.age_class] ?? r.age_class}
                  {r.distance_min_km ? ` · ${r.distance_min_km} km` : ''}
                </div>
                <div className="cb-faint" style={{ fontSize: 11, marginTop: 2 }}>
                  {r.club_name}
                </div>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }} className="cb-tabular">
                {r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}
              </td>
              {showParticipation && (
                <>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} className="cb-tabular">
                    <span style={{ fontWeight: 600 }}>{r.your_classed}</span>
                    <span className="cb-muted">/{r.your_engaged}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {r.your_best_place ? (
                      <span
                        className="cb-display cb-tabular"
                        style={{
                          fontSize: '1.25rem',
                          color: r.your_best_place <= 3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
                        }}
                      >
                        {r.your_best_place}
                        <sup style={{ fontSize: 12 }}>e</sup>
                      </span>
                    ) : (
                      <span className="cb-faint">—</span>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SyncIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--cb-accent-soft-ink)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Synchronisé</title>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}
