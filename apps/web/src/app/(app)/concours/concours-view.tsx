'use client';

import { AppTopbar } from '@/components/app-topbar';
import { useMemo, useState } from 'react';
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function getYear(d: string) {
  return new Date(d).getFullYear();
}

function PlaceBadge({ place, total }: { place: number; total: number | null }) {
  const pct = total ? Math.round((place / total) * 100) : null;
  const color =
    place === 1
      ? 'var(--cb-gold)'
      : place <= 3
        ? 'var(--cb-accent)'
        : place <= 10
          ? 'var(--cb-ink-2)'
          : 'var(--cb-ink-4)';
  const bg =
    place === 1 ? 'var(--cb-gold-soft)' : place <= 3 ? 'var(--cb-accent-soft)' : 'transparent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span
        className="cb-display cb-tabular"
        style={{
          fontSize: '1.375rem',
          color,
          background: bg,
          padding: bg !== 'transparent' ? '2px 8px' : undefined,
          borderRadius: bg !== 'transparent' ? 6 : undefined,
        }}
      >
        {place}
        <sup style={{ fontSize: 11 }}>e</sup>
      </span>
      {pct !== null && <span style={{ fontSize: 11, color: 'var(--cb-ink-4)' }}>top {pct}%</span>}
    </div>
  );
}

type SortCol = 'date' | 'pigeons' | 'place';
type SortDir = 'asc' | 'desc';

export function ConcoursView({ userName, races }: { userName: string; races: Race[] }) {
  const [tab, setTab] = useState<Tab>('mes');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const mesRaces = useMemo(() => races.filter((r) => r.your_engaged > 0), [races]);

  const allYears = useMemo(
    () => [...new Set(races.map((r) => getYear(r.race_date)))].sort((a, b) => b - a),
    [races],
  );

  const mesYears = useMemo(
    () => [...new Set(mesRaces.map((r) => getYear(r.race_date)))].sort((a, b) => b - a),
    [mesRaces],
  );

  const years = tab === 'mes' ? mesYears : allYears;

  const categories = useMemo(
    () => [...new Set(races.map((r) => r.category))].filter(Boolean),
    [races],
  );

  const baseList = tab === 'mes' ? mesRaces : races;
  const displayed = useMemo(() => {
    let list = baseList;
    if (yearFilter) list = list.filter((r) => getYear(r.race_date) === yearFilter);
    if (catFilter) list = list.filter((r) => r.category === catFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.release_point.toLowerCase().includes(q) ||
          r.club_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [baseList, yearFilter, catFilter, searchQuery]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir(col === 'date' ? 'desc' : 'asc'); }
  }

  const hasActiveFilters = yearFilter !== null || catFilter !== null || searchQuery !== '';

  function resetFilters() {
    setYearFilter(null);
    setCatFilter(null);
    setSearchQuery('');
  }

  // Stats "Mes concours"
  const stats = useMemo(() => {
    const participated = mesRaces;
    const victories = participated.filter((r) => r.your_best_place === 1).length;
    const podiums = participated.filter(
      (r) => r.your_best_place !== null && r.your_best_place <= 3,
    ).length;
    const bestPlace = participated.length
      ? Math.min(...participated.map((r) => r.your_best_place ?? 9999).filter((p) => p < 9999))
      : null;
    const totalEngaged = participated.reduce((s, r) => s + r.your_engaged, 0);
    const totalClassed = participated.reduce((s, r) => s + r.your_classed, 0);
    const classRate = totalEngaged > 0 ? Math.round((totalClassed / totalEngaged) * 100) : null;
    const allVelocities = participated.flatMap((r) => r.your_velocities);
    const avgVel =
      allVelocities.length > 0
        ? allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length
        : null;
    return { victories, podiums, bestPlace, totalEngaged, totalClassed, classRate, avgVel };
  }, [mesRaces]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    minHeight: 48,
    padding: '0 20px',
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--cb-accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--cb-ink)' : 'var(--cb-ink-3)',
    fontWeight: active ? 700 : 500,
    marginBottom: -1,
    fontSize: '1rem',
  });

  // Trier puis grouper par année
  const grouped = useMemo(() => {
    const sorted = [...displayed].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'date') return dir * a.race_date.localeCompare(b.race_date);
      if (sortCol === 'pigeons') return dir * ((a.pigeons_released ?? 0) - (b.pigeons_released ?? 0));
      if (sortCol === 'place') return dir * ((a.your_best_place ?? 9999) - (b.your_best_place ?? 9999));
      return 0;
    });
    const map = new Map<number, Race[]>();
    for (const r of sorted) {
      const y = getYear(r.race_date);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(r);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [displayed, sortCol, sortDir]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div className="cb-eyebrow" style={{ marginBottom: 6 }}>
            Saison {new Date().getFullYear()}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
              Concours
            </h1>
            <div
              className="cb-card"
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--cb-accent-soft)',
                border: '1px solid color-mix(in oklab, var(--cb-accent) 20%, transparent)',
              }}
            >
              <SyncIcon />
              <span style={{ fontSize: 13, color: 'var(--cb-accent-soft-ink)', fontWeight: 500 }}>
                Import auto · toutes les 2h
              </span>
            </div>
          </div>
        </div>

        {/* Stats banner — Mes concours uniquement */}
        {tab === 'mes' && mesRaces.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <StatKpi label="Participations" value={mesRaces.length} />
            <StatKpi label="Victoires" value={stats.victories} accent={stats.victories > 0} />
            <StatKpi label="Podiums" value={stats.podiums} accent={stats.podiums > 0} />
            {stats.bestPlace && (
              <StatKpi
                label="Meilleure place"
                value={`${stats.bestPlace}e`}
                accent={stats.bestPlace <= 3}
              />
            )}
            {stats.classRate !== null && (
              <StatKpi label="Taux classé" value={`${stats.classRate}%`} />
            )}
            {stats.avgVel && (
              <StatKpi label="Vitesse moy." value={stats.avgVel.toFixed(0)} suffix="m/min" />
            )}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{ display: 'flex', borderBottom: '1px solid var(--cb-line)', marginBottom: 18 }}
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

        {/* Recherche */}
        <div className="cb-search-wrap" style={{ marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <title>Rechercher</title>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un concours ou un club..."
            className="cb-input cb-input--search"
            style={{ width: '100%', fontSize: 15 }}
          />
        </div>

        {/* Filtres */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 10,
            overflowX: 'auto',
            paddingBottom: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Années */}
          {years.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  className="cb-btn"
                  onClick={() => setYearFilter(yearFilter === y ? null : y)}
                  style={pillStyle(yearFilter === y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Séparateur */}
          {years.length > 1 && categories.length > 0 && (
            <div style={{ width: 1, background: 'var(--cb-line)', margin: '4px 2px' }} />
          )}

          {/* Catégories */}
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className="cb-btn"
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              style={pillStyle(catFilter === cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              className="cb-btn cb-btn--ghost"
              onClick={resetFilters}
              style={{ minHeight: 32, padding: '0 12px', fontSize: 13, borderRadius: 999 }}
            >
              Réinitialiser ×
            </button>
          )}
        </div>

        {/* Compteur */}
        <p className="cb-faint" style={{ fontSize: 13, marginBottom: 14 }}>
          {displayed.length} concours{hasActiveFilters ? ' · filtre actif' : ''}
        </p>

        {/* Contenu */}
        {displayed.length === 0 && hasActiveFilters ? (
          <div className="cb-card" style={{ padding: 40, textAlign: 'center' }}>
            <p className="cb-muted" style={{ fontSize: '1.0625rem' }}>
              Aucun concours ne correspond à votre recherche.
            </p>
            <button
              type="button"
              className="cb-btn cb-btn--soft"
              onClick={resetFilters}
              style={{ marginTop: 16 }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState tab={tab} onShowAll={() => setTab('tous')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(([year, yearRaces]) => (
              <div key={year}>
                {grouped.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      className="cb-display"
                      style={{ fontSize: '1.25rem', color: 'var(--cb-ink-3)', flexShrink: 0 }}
                    >
                      {year}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--cb-line-2)' }} />
                    <span className="cb-faint" style={{ fontSize: 13, flexShrink: 0 }}>
                      {yearRaces.length} concours
                    </span>
                  </div>
                )}
                {/* Desktop table */}
                <div className="cb-concours-table">
                  <RaceTable races={yearRaces} showParticipation={tab === 'mes'} showParticipatedBadge={tab === 'tous'} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                </div>
                {/* Mobile cards */}
                <div
                  className="cb-concours-cards"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {yearRaces.map((r) => (
                    <RaceCard key={r.id} race={r} showParticipation={tab === 'mes'} showParticipatedBadge={tab === 'tous'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    flexShrink: 0,
    minHeight: 32,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    background: active ? 'var(--cb-accent)' : 'var(--cb-bg-elev)',
    color: active ? 'var(--cb-accent-ink)' : 'var(--cb-ink-2)',
    border: `1.5px solid ${active ? 'var(--cb-accent)' : 'var(--cb-line)'}`,
  };
}

function StatKpi({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div className="cb-card" style={{ padding: '14px 16px' }}>
      <div className="cb-eyebrow" style={{ marginBottom: 4, fontSize: 11 }}>
        {label}
      </div>
      <div
        className="cb-display cb-tabular"
        style={{
          fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)',
          color: accent ? 'var(--cb-accent)' : 'var(--cb-ink)',
          lineHeight: 1,
        }}
      >
        {value}
        {suffix && (
          <span className="cb-muted" style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RaceTable({
  races,
  showParticipation,
  showParticipatedBadge,
  sortCol,
  sortDir,
  onSort,
}: {
  races: Race[];
  showParticipation: boolean;
  showParticipatedBadge: boolean;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
}) {
  const th: React.CSSProperties = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: 'var(--cb-ink-3)',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const arrow = (col: SortCol) =>
    sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="cb-card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--cb-bg-sunken)', textAlign: 'left' }}>
            <th style={{ ...th, padding: '12px 20px', minWidth: 90 }} onClick={() => onSort('date')}>
              Date{arrow('date')}
            </th>
            <th style={{ ...th, padding: '12px 16px', cursor: 'default' }}>Concours</th>
            <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }} onClick={() => onSort('pigeons')}>
              Engagés{arrow('pigeons')}
            </th>
            {showParticipatedBadge && (
              <th style={{ ...th, padding: '12px 16px', textAlign: 'center', cursor: 'default' }}>
                Participation
              </th>
            )}
            {showParticipation && (
              <>
                <th style={{ ...th, padding: '12px 16px', textAlign: 'right', cursor: 'default' }}>Vos pigeons</th>
                <th style={{ ...th, padding: '12px 16px', textAlign: 'right', cursor: 'default' }}>Vitesse moy.</th>
                <th style={{ ...th, padding: '12px 16px', textAlign: 'right' }} onClick={() => onSort('place')}>
                  Meilleure place{arrow('place')}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {races.map((r) => {
            const participated = r.your_engaged > 0;
            return (
              <tr
                key={r.id}
                style={{ borderTop: '1px solid var(--cb-line-2)', height: 60 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--cb-bg-sunken)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '';
                }}
              >
                <td
                  style={{
                    padding: '10px 20px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    fontSize: 13,
                  }}
                >
                  {formatDate(r.race_date)}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{r.release_point}</div>
                  <div className="cb-muted" style={{ fontSize: 12 }}>
                    {CATEGORY_LABELS[r.category] ?? r.category} ·{' '}
                    {AGE_LABELS[r.age_class] ?? r.age_class}
                    {r.distance_min_km ? ` · ${r.distance_min_km} km` : ''}
                  </div>
                  <div className="cb-faint" style={{ fontSize: 11, marginTop: 1 }}>
                    {r.club_name}
                  </div>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                  {r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}
                </td>
                {showParticipatedBadge && (
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    {participated ? (
                      <span
                        className="cb-badge cb-badge--positive"
                        style={{ fontSize: 11 }}
                        title={`${r.your_engaged} pigeon${r.your_engaged > 1 ? 's' : ''} engagé${r.your_engaged > 1 ? 's' : ''}`}
                      >
                        {r.your_best_place ? `${r.your_best_place}e` : 'Participé'}
                      </span>
                    ) : (
                      <span className="cb-faint" style={{ fontSize: 12 }}>—</span>
                    )}
                  </td>
                )}
                {showParticipation && (
                  <>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }} className="cb-tabular">
                      <span style={{ fontWeight: 600 }}>{r.your_classed}</span>
                      <span className="cb-muted">/{r.your_engaged}</span>
                    </td>
                    <td
                      style={{ padding: '10px 16px', textAlign: 'right' }}
                      className="cb-tabular cb-muted"
                    >
                      {r.your_avg_velocity
                        ? `${Math.round(r.your_avg_velocity).toLocaleString('fr-FR')} m/min`
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      {r.your_best_place ? (
                        <PlaceBadge place={r.your_best_place} total={r.pigeons_released} />
                      ) : (
                        <span className="cb-faint">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RaceCard({
  race: r,
  showParticipation,
  showParticipatedBadge,
}: {
  race: Race;
  showParticipation: boolean;
  showParticipatedBadge: boolean;
}) {
  const isTop3 =
    r.your_best_place !== null && r.your_best_place !== undefined && r.your_best_place <= 3;
  const pct =
    r.your_best_place && r.pigeons_released
      ? Math.round((r.your_best_place / r.pigeons_released) * 100)
      : null;
  const participated = r.your_engaged > 0;

  return (
    <div className="cb-card" style={{ padding: '16px 18px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className="cb-badge">{formatDate(r.race_date)}</span>
            <span className="cb-badge">{CATEGORY_LABELS[r.category] ?? r.category}</span>
            {showParticipatedBadge && participated && (
              <span className="cb-badge cb-badge--positive" style={{ fontSize: 11 }}>
                {r.your_best_place ? `${r.your_best_place}e place` : 'Participé'}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 2 }}>
            {r.release_point}
          </div>
          <div className="cb-muted" style={{ fontSize: 13 }}>
            {AGE_LABELS[r.age_class] ?? r.age_class}
            {r.distance_min_km ? ` · ${r.distance_min_km} km` : ''}
            {r.club_name ? ` · ${r.club_name}` : ''}
          </div>
        </div>
        {showParticipation && r.your_best_place ? (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: isTop3 ? 'var(--cb-accent-soft)' : 'var(--cb-bg-sunken)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="cb-display cb-tabular"
                style={{
                  fontSize: '1.375rem',
                  color: isTop3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
                }}
              >
                {r.your_best_place}
              </span>
            </div>
            {pct !== null && (
              <div className="cb-faint" style={{ fontSize: 11, marginTop: 3 }}>
                top {pct}%
              </div>
            )}
          </div>
        ) : null}
      </div>

      {showParticipation && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--cb-line-2)',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            fontSize: 13,
          }}
        >
          <span className="cb-muted">
            Engagés :{' '}
            <strong style={{ color: 'var(--cb-ink)' }}>
              {r.pigeons_released?.toLocaleString('fr-FR') ?? '—'}
            </strong>
          </span>
          <span className="cb-muted">
            Vos pigeons :{' '}
            <strong style={{ color: 'var(--cb-ink)' }}>
              {r.your_classed}/{r.your_engaged}
            </strong>
          </span>
          {r.your_avg_velocity && (
            <span className="cb-muted">
              Vitesse :{' '}
              <strong style={{ color: 'var(--cb-ink)' }}>
                {r.your_avg_velocity.toFixed(0)} m/min
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab, onShowAll }: { tab: Tab; onShowAll: () => void }) {
  return (
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
            onClick={onShowAll}
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
  );
}

function SyncIcon() {
  return (
    <svg
      width="14"
      height="14"
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
