'use client';

import { AppTopbar } from '@/components/app-topbar';
import { EmptyState } from '@/components/empty-state';
import { KpiCard } from '@/components/kpi-card';
import { PlaceBadge } from '@/components/place-badge';
import { AGE_LABELS, CATEGORY_LABELS } from '@/lib/colombo-race-labels';
import { useMemo, useState } from 'react';
import type { Race } from './page';

// (note) On n'affiche plus que les concours où l'utilisateur a participé côté backend.

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

type SortCol = 'date' | 'pigeons' | 'place';
type SortDir = 'asc' | 'desc';

export function ConcoursView({ userName, races }: { userName: string; races: Race[] }) {
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Sécurité UX: on déduplique par id pour éviter d'afficher deux fois un même concours.
  const uniqueRaces = useMemo(() => {
    const map = new Map<string, Race>();
    for (const r of races) {
      if (!map.has(r.id)) map.set(r.id, r);
    }
    return [...map.values()];
  }, [races]);

  const allYears = useMemo(
    () => [...new Set(uniqueRaces.map((r) => getYear(r.race_date)))].sort((a, b) => b - a),
    [uniqueRaces],
  );

  const categories = useMemo(
    () => [...new Set(uniqueRaces.map((r) => r.category))].filter(Boolean),
    [uniqueRaces],
  );

  const displayed = useMemo(() => {
    let list = uniqueRaces;
    if (yearFilter) list = list.filter((r) => getYear(r.race_date) === yearFilter);
    if (catFilter) list = list.filter((r) => r.category === catFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) => r.release_point.toLowerCase().includes(q) || r.club_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [uniqueRaces, yearFilter, catFilter, searchQuery]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir(col === 'date' ? 'desc' : 'asc');
    }
  }

  const hasActiveFilters = yearFilter !== null || catFilter !== null || searchQuery !== '';

  function resetFilters() {
    setYearFilter(null);
    setCatFilter(null);
    setSearchQuery('');
  }

  // Stats "Mes concours"
  const stats = useMemo(() => {
    const participated = uniqueRaces;
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
  }, [uniqueRaces]);
  // (participations uniquement) donc pas besoin d'onglet.

  // Trier puis grouper par année
  const grouped = useMemo(() => {
    const sorted = [...displayed].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'date') return dir * a.race_date.localeCompare(b.race_date);
      if (sortCol === 'pigeons')
        return dir * ((a.pigeons_released ?? 0) - (b.pigeons_released ?? 0));
      if (sortCol === 'place')
        return dir * ((a.your_best_place ?? 9999) - (b.your_best_place ?? 9999));
      return 0;
    });
    const map = new Map<number, Race[]>();
    for (const r of sorted) {
      const y = getYear(r.race_date);
      if (!map.has(y)) map.set(y, []);
      const bucket = map.get(y);
      if (bucket) bucket.push(r);
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
            Palmar&egrave;s
          </div>
          <div
            className="cb-concours-hero"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
              Palmar&egrave;s &amp; Concours
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

        {/* Stats banner — niveau palmarès (or/accent) + niveau stats */}
        {uniqueRaces.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <KpiCard
              label="Victoires"
              value={stats.victories}
              tone={stats.victories > 0 ? 'gold' : undefined}
            />
            <KpiCard
              label="Podiums"
              value={stats.podiums}
              tone={stats.podiums > 0 ? 'accent' : undefined}
            />
            {stats.bestPlace && (
              <KpiCard
                label="Meilleure place"
                value={`${stats.bestPlace}e`}
                tone={stats.bestPlace <= 3 ? 'gold' : undefined}
              />
            )}
            <KpiCard label="Participations" value={uniqueRaces.length} />
            {stats.classRate !== null && (
              <KpiCard label="Taux class&eacute;" value={`${stats.classRate}%`} />
            )}
            {stats.avgVel && (
              <KpiCard label="Vitesse moy." value={stats.avgVel.toFixed(0)} suffix="m/min" />
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="cb-filterbar">
          <div className="cb-search">
            <span className="cb-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un concours, un lieu, un club…"
              className="cb-search__input"
              aria-label="Rechercher dans les concours"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="cb-search__clear"
                aria-label="Effacer la recherche"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {allYears.length > 1 && (
            <div className="cb-filter-group">
              <span className="cb-filter-group__label">Saison</span>
              <div className="cb-chips">
                {allYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className="cb-chip"
                    data-active={yearFilter === y}
                    onClick={() => setYearFilter(yearFilter === y ? null : y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="cb-filter-group">
              <span className="cb-filter-group__label">Catégorie</span>
              <div className="cb-chips">
                {categories.map((cat) => {
                  const count = uniqueRaces.filter((r) => r.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className="cb-chip"
                      data-active={catFilter === cat}
                      onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                      <span className="cb-chip__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="cb-filter-toolbar">
            <span className="cb-faint" style={{ fontSize: 13 }}>
              {displayed.length} concours{hasActiveFilters ? ' · filtres actifs' : ''}
            </span>
            <div className="cb-filter-toolbar__spacer" />
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="cb-reset-btn">
                Réinitialiser ×
              </button>
            )}
          </div>
        </div>

        {/* Contenu */}
        {displayed.length === 0 && hasActiveFilters ? (
          <div className="cb-card">
            <EmptyState
              size="compact"
              title="Aucun concours ne correspond à votre recherche"
              action={{ label: 'Réinitialiser les filtres', onClick: resetFilters }}
            />
          </div>
        ) : displayed.length === 0 ? (
          <div className="cb-card">
            <EmptyState
              title="Aucun résultat importé"
              description="Vos concours Francolomb apparaîtront ici. L'import est automatique toutes les 2 heures."
            />
          </div>
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
                  <RaceTable
                    races={yearRaces}
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                </div>
                {/* Mobile cards */}
                <div className="cb-concours-cards" style={{ flexDirection: 'column', gap: 10 }}>
                  {yearRaces.map((r) => (
                    <RaceCard key={r.id} race={r} />
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

function SearchIcon() {
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
      <title>Rechercher</title>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Effacer</title>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function RaceTable({
  races,
  sortCol,
  sortDir,
  onSort,
}: {
  races: Race[];
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

  const arrow = (col: SortCol) => (sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const onHeaderKeyDown =
    (col: SortCol) => (e: React.KeyboardEvent<HTMLTableHeaderCellElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSort(col);
      }
    };

  return (
    <div className="cb-card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--cb-bg-sunken)', textAlign: 'left' }}>
            <th
              style={{ ...th, padding: '12px 20px', minWidth: 90 }}
              onClick={() => onSort('date')}
              onKeyDown={onHeaderKeyDown('date')}
            >
              Date{arrow('date')}
            </th>
            <th style={{ ...th, padding: '12px 16px', cursor: 'default' }}>Concours</th>
            <th
              style={{ ...th, padding: '12px 16px', textAlign: 'right' }}
              onClick={() => onSort('pigeons')}
              onKeyDown={onHeaderKeyDown('pigeons')}
            >
              Engagés{arrow('pigeons')}
            </th>
            <th style={{ ...th, padding: '12px 16px', textAlign: 'right', cursor: 'default' }}>
              Vos pigeons
            </th>
            <th style={{ ...th, padding: '12px 16px', textAlign: 'right', cursor: 'default' }}>
              Vitesse moy.
            </th>
            <th
              style={{ ...th, padding: '12px 16px', textAlign: 'right' }}
              onClick={() => onSort('place')}
              onKeyDown={onHeaderKeyDown('place')}
            >
              Meilleure place{arrow('place')}
            </th>
          </tr>
        </thead>
        <tbody>
          {races.map((r) => {
            const isPodium =
              r.your_best_place !== null &&
              r.your_best_place !== undefined &&
              r.your_best_place <= 3;
            return (
              <tr
                key={r.id}
                className={isPodium ? 'cb-row--podium' : undefined}
                style={{ borderTop: '1px solid var(--cb-line-2)', height: 60 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isPodium
                    ? ''
                    : 'var(--cb-bg-sunken)';
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
}: {
  race: Race;
}) {
  const isTop3 =
    r.your_best_place !== null && r.your_best_place !== undefined && r.your_best_place <= 3;
  const pct =
    r.your_best_place && r.pigeons_released
      ? Math.round((r.your_best_place / r.pigeons_released) * 100)
      : null;

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
        {r.your_best_place ? (
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
