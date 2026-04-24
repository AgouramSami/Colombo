'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PigeonRow, PigeonnierStats } from './page';

type Filter = 'all' | 'champions' | 'female' | 'male';
type View = 'cards' | 'table';

export function PigeonnierView({
  loftName,
  pigeons,
  stats,
  justOnboarded,
}: {
  loftName: string;
  pigeons: PigeonRow[];
  stats: PigeonnierStats;
  justOnboarded: boolean;
}) {
  const [showBanner, setShowBanner] = useState(justOnboarded);
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('cards');

  const filtered = useMemo(() => {
    if (filter === 'champions') return pigeons.filter((p) => p.isChampion);
    if (filter === 'female') return pigeons.filter((p) => p.isFemale);
    if (filter === 'male') return pigeons.filter((p) => !p.isFemale);
    return pigeons;
  }, [pigeons, filter]);

  const leaders = useMemo(
    () =>
      [...pigeons]
        .filter((p) => p.avgVelocity !== null)
        .sort((a, b) => (b.avgVelocity ?? 0) - (a.avgVelocity ?? 0))
        .slice(0, 3),
    [pigeons],
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      {/* Topbar */}
      <header className="cb-topbar">
        <a href="/pigeonnier" className="cb-topbar__brand">
          <PigeonIcon /> Colombo
        </a>
        <div style={{ flex: 1 }} />
        <nav className="cb-topbar__nav">
          <a href="/pigeonnier" data-current="true">
            Pigeonnier
          </a>
        </nav>
        <form action="/auth/signout" method="post">
          <button type="submit" className="cb-btn cb-btn--ghost" style={{ minHeight: 44 }}>
            Se déconnecter
          </button>
        </form>
      </header>

      {showBanner && (
        <div
          className="cb-fade"
          style={{
            background: 'var(--cb-positive-soft)',
            color: 'var(--cb-positive)',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid color-mix(in oklab, var(--cb-positive) 30%, transparent)',
          }}
        >
          <CheckIcon />
          <span style={{ flex: 1, fontWeight: 500 }}>
            Bienvenue dans votre pigeonnier. Cliquez sur un pigeon pour voir sa fiche complète.
          </span>
          <button
            type="button"
            className="cb-btn cb-btn--link"
            onClick={() => setShowBanner(false)}
            style={{ color: 'var(--cb-positive)', minHeight: 'auto' }}
          >
            Fermer
          </button>
        </div>
      )}

      <main
        style={{ maxWidth: 1440, margin: '0 auto', padding: '32px clamp(16px, 4vw, 48px) 80px' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
              {loftName}
            </div>
            <h1
              className="cb-display"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', margin: 0 }}
            >
              Votre pigeonnier
              <span className="cb-muted" style={{ fontWeight: 400, marginLeft: 14 }}>
                · {stats.total} pigeon{stats.total > 1 ? 's' : ''}
              </span>
            </h1>
          </div>
          <Link href="/pigeonnier/ajouter" className="cb-btn cb-btn--primary">
            <PlusIcon /> Ajouter un pigeon
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Pigeons actifs"
            value={stats.total}
            hint="dans votre colombier"
            tone="default"
          />
          <StatCard
            label="Champions"
            value={stats.champions}
            hint="≥ 1 victoire en concours"
            tone="gold"
          />
          <StatCard
            label="Vitesse moyenne"
            value={stats.avgVelocity}
            suffix="m/min"
            hint="toutes distances confondues"
            tone="accent"
          />
          <StatCard
            label="Concours courus"
            value={stats.totalRaces}
            hint="cumul saison"
            tone="default"
          />
        </div>

        {/* 2 colonnes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 340px)',
            gap: 24,
          }}
          className="cb-main-grid"
        >
          {/* Pigeons */}
          <section>
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 16,
                alignItems: 'center',
              }}
            >
              <FilterPills filter={filter} onChange={setFilter} />
              <div style={{ flex: 1 }} />
              <ViewToggle view={view} onChange={setView} />
            </div>

            {pigeons.length === 0 ? (
              <div className="cb-card" style={{ padding: 48, textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', color: 'var(--cb-ink-3)' }}>
                  Votre pigeonnier est vide pour le moment.
                </p>
                <p style={{ color: 'var(--cb-ink-4)', marginTop: 8 }}>
                  Vos pigeons apparaîtront ici une fois vos résultats importés.
                </p>
              </div>
            ) : view === 'cards' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 14,
                }}
              >
                {filtered.map((p) => (
                  <PigeonCard key={p.matricule} pigeon={p} />
                ))}
              </div>
            ) : (
              <PigeonTable pigeons={filtered} />
            )}
          </section>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {leaders.length > 0 && (
              <div className="cb-card" style={{ padding: 20 }}>
                <div className="cb-eyebrow" style={{ marginBottom: 12 }}>
                  Meilleurs voyageurs
                </div>
                {leaders.map((p, i) => (
                  <Link
                    key={p.matricule}
                    href={`/pigeonnier/${p.matricule}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--cb-line-2)',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      className="cb-display cb-tabular"
                      style={{ fontSize: 22, color: 'var(--cb-ink-4)', width: 26 }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {p.name ?? p.displayMatricule}
                      </div>
                      <div className="cb-matricule cb-faint" style={{ fontSize: 11 }}>
                        {p.displayMatricule}
                      </div>
                    </div>
                    <span className="cb-tabular" style={{ fontWeight: 700 }}>
                      {p.avgVelocity?.toFixed(0)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div
              className="cb-card"
              style={{
                padding: 20,
                background: 'var(--cb-accent-soft)',
                border: '1px solid color-mix(in oklab, var(--cb-accent) 20%, transparent)',
              }}
            >
              <div
                style={{
                  color: 'var(--cb-accent-soft-ink)',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 8,
                }}
              >
                Importation automatique
              </div>
              <div
                className="cb-display"
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--cb-accent-soft-ink)',
                  marginBottom: 4,
                }}
              >
                Résultats Francolomb
              </div>
              <p
                style={{
                  color: 'var(--cb-accent-soft-ink)',
                  fontSize: 14,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Vos résultats de concours sont récupérés automatiquement depuis Francolomb.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        @media (max-width: 980px) { .cb-main-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint: string;
  tone: 'default' | 'gold' | 'accent';
}) {
  const styles = {
    gold: { bg: 'var(--cb-gold-soft)', ink: 'var(--cb-gold)' },
    accent: { bg: 'var(--cb-accent-soft)', ink: 'var(--cb-accent-soft-ink)' },
    default: { bg: 'var(--cb-bg-sunken)', ink: 'var(--cb-ink-2)' },
  }[tone];

  return (
    <div
      className="cb-card"
      style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: styles.bg,
          color: styles.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {tone === 'gold' ? (
          <TrophyIcon />
        ) : tone === 'accent' ? (
          <ChartIcon />
        ) : (
          <PigeonIcon size={22} />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="cb-eyebrow" style={{ marginBottom: 4 }}>
          {label}
        </div>
        <div className="cb-display cb-tabular" style={{ fontSize: '2rem', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          {suffix && (
            <span className="cb-muted" style={{ fontSize: 12, fontWeight: 500, marginLeft: 6 }}>
              {suffix}
            </span>
          )}
        </div>
        <div className="cb-faint" style={{ fontSize: 13, marginTop: 4 }}>
          {hint}
        </div>
      </div>
    </div>
  );
}

function FilterPills({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'champions', label: 'Champions' },
    { id: 'female', label: 'Femelles' },
    { id: 'male', label: 'Mâles' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        background: 'var(--cb-bg-elev)',
        padding: 4,
        borderRadius: 999,
        border: '1px solid var(--cb-line)',
      }}
    >
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className="cb-btn"
          style={{
            minHeight: 40,
            padding: '0 16px',
            border: 'none',
            background: filter === f.id ? 'var(--cb-ink)' : 'transparent',
            color: filter === f.id ? 'var(--cb-bg-elev)' : 'var(--cb-ink-3)',
            fontSize: 15,
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {(['cards', 'table'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="cb-btn cb-btn--ghost"
          style={{
            minHeight: 44,
            padding: '0 12px',
            background: view === v ? 'var(--cb-bg-sunken)' : 'transparent',
          }}
          aria-label={v === 'cards' ? 'Vue cartes' : 'Vue tableau'}
        >
          {v === 'cards' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <title>Vue cartes</title>
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" />
              <rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <title>Vue tableau</title>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function PigeonCard({ pigeon }: { pigeon: PigeonRow }) {
  return (
    <Link
      href={`/pigeonnier/${pigeon.matricule}`}
      className="cb-card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 200,
        cursor: 'pointer',
        textDecoration: 'none',
        transition:
          'transform var(--cb-dur) var(--cb-ease), box-shadow var(--cb-dur) var(--cb-ease)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--cb-shadow)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--cb-shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            flexShrink: 0,
            background: pigeon.isFemale
              ? 'color-mix(in oklab, #c2185b 15%, var(--cb-bg-sunken))'
              : 'color-mix(in oklab, var(--cb-accent) 15%, var(--cb-bg-sunken))',
            color: pigeon.isFemale ? '#c2185b' : 'var(--cb-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {pigeon.isFemale ? 'F' : 'M'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cb-matricule" style={{ fontWeight: 700, fontSize: '.9375rem' }}>
            {pigeon.displayMatricule}
          </div>
          <div
            style={{
              fontFamily: 'var(--cb-font-display)',
              fontSize: '1.125rem',
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {pigeon.name ?? (
              <span className="cb-muted" style={{ fontWeight: 400, fontStyle: 'italic' }}>
                Sans nom
              </span>
            )}
          </div>
        </div>
        {pigeon.isChampion && (
          <span className="cb-badge cb-badge--gold">
            <TrophyIcon size={12} />
          </span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          borderTop: '1px solid var(--cb-line-2)',
          paddingTop: 12,
        }}
      >
        <div>
          <div
            className="cb-muted"
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            Concours
          </div>
          <div className="cb-tabular" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
            {pigeon.raceCount}
          </div>
        </div>
        {pigeon.avgVelocity && (
          <div>
            <div
              className="cb-muted"
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              Vitesse moy.
            </div>
            <div className="cb-tabular" style={{ fontWeight: 700, fontSize: '1.125rem' }}>
              {pigeon.avgVelocity.toFixed(0)}
              <span className="cb-muted" style={{ fontSize: 11, marginLeft: 3 }}>
                m/min
              </span>
            </div>
          </div>
        )}
      </div>

      {pigeon.lastRaceName && (
        <div className="cb-faint" style={{ fontSize: 12 }}>
          Dernier : {pigeon.lastRaceName}
        </div>
      )}
    </Link>
  );
}

function PigeonTable({ pigeons }: { pigeons: PigeonRow[] }) {
  const th: React.CSSProperties = {
    padding: '12px 16px',
    fontWeight: 600,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
  };
  const td: React.CSSProperties = { padding: '12px 16px' };
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
            <th style={th}>Matricule</th>
            <th style={th}>Nom</th>
            <th style={{ ...th, textAlign: 'center' }}>Sexe</th>
            <th style={{ ...th, textAlign: 'right' }}>Concours</th>
            <th style={{ ...th, textAlign: 'right' }}>Meill. place</th>
            <th style={{ ...th, textAlign: 'right' }}>Vitesse moy.</th>
            <th style={th}>Dernier concours</th>
          </tr>
        </thead>
        <tbody>
          {pigeons.map((p, i) => (
            <tr
              key={p.matricule}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--cb-line-2)',
                height: 56,
                cursor: 'pointer',
              }}
              onClick={() => {
                window.location.href = `/pigeonnier/${p.matricule}`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') window.location.href = `/pigeonnier/${p.matricule}`;
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--cb-bg-sunken)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <td style={td}>
                <span className="cb-matricule" style={{ fontWeight: 600 }}>
                  {p.displayMatricule}
                </span>
              </td>
              <td style={td}>
                {p.name ?? <span className="cb-faint">—</span>}
                {p.isChampion && (
                  <TrophyIcon
                    size={14}
                    style={{ color: 'var(--cb-gold)', marginLeft: 6, verticalAlign: 'middle' }}
                  />
                )}
              </td>
              <td style={{ ...td, textAlign: 'center' }}>
                <span
                  style={{ fontWeight: 700, color: p.isFemale ? '#c2185b' : 'var(--cb-accent)' }}
                >
                  {p.isFemale ? 'F' : 'M'}
                </span>
              </td>
              <td style={{ ...td, textAlign: 'right' }} className="cb-tabular">
                {p.raceCount}
              </td>
              <td style={{ ...td, textAlign: 'right' }} className="cb-tabular">
                {p.bestPlace ?? '—'}
              </td>
              <td style={{ ...td, textAlign: 'right' }} className="cb-tabular">
                {p.avgVelocity?.toFixed(1) ?? '—'}
              </td>
              <td style={{ ...td, color: 'var(--cb-ink-3)' }}>{p.lastRaceName ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PigeonIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Pigeon</title>
      <path d="M16 7c1.1 0 2 .9 2 2v2l2 1-2 1v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2L4 12l2-1V9c0-1.1.9-2 2-2h8z" />
      <circle cx="12" cy="9" r="1" />
    </svg>
  );
}
function TrophyIcon({ size = 22, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Trophee</title>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}
function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Statistiques</title>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Ajouter</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <title>Valide</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
