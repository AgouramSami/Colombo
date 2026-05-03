'use client';

import { AppTopbar } from '@/components/app-topbar';
import { EmptyState } from '@/components/empty-state';
import { KpiCard } from '@/components/kpi-card';
import { PigeonAddFab } from '@/components/pigeon-add-fab';
import { CATEGORY_LABELS } from '@/lib/colombo-race-labels';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LoftInfo, PigeonRow, PigeonnierStats } from './page';

type Filter = 'all' | 'champions' | 'female' | 'male';
type SortKey = 'raceCount' | 'avgVelocity' | 'bestPlace' | 'name' | 'year';
type SortDir = 'asc' | 'desc';
type View = 'cards' | 'table';

type LastRace = {
  name: string;
  date: string;
  distanceKm: number | null;
  category: string;
} | null;

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: 'raceCount', label: 'Concours', defaultDir: 'desc' },
  { key: 'avgVelocity', label: 'Vitesse moy.', defaultDir: 'desc' },
  { key: 'bestPlace', label: 'Meilleure place', defaultDir: 'asc' },
  { key: 'name', label: 'Nom', defaultDir: 'asc' },
  { key: 'year', label: 'Année', defaultDir: 'desc' },
];
const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

export function PigeonnierView({
  lofts,
  pigeons,
  stats,
  justOnboarded,
  userName,
  lastRace,
}: {
  lofts: LoftInfo[];
  pigeons: PigeonRow[];
  stats: PigeonnierStats;
  justOnboarded: boolean;
  userName: string;
  lastRace: LastRace;
}) {
  const [showBanner, setShowBanner] = useState(justOnboarded);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('raceCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<View>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [activeLoftId, setActiveLoftId] = useState<string | null>(
    lofts.length === 1 ? (lofts[0]?.id ?? null) : null,
  );

  const loftName =
    lofts.find((l) => l.id === activeLoftId)?.name ??
    (lofts.length === 1 ? (lofts[0]?.name ?? 'Mon pigeonnier') : 'Tous les pigeonniers');

  function handleSortKey(key: SortKey) {
    const opt = SORT_OPTIONS.find((o) => o.key === key);
    setSortKey(key);
    setSortDir(opt?.defaultDir ?? 'desc');
  }

  function toggleDir() {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  const leaders = useMemo(
    () =>
      [...pigeons]
        .filter((p) => p.avgVelocity !== null)
        .sort((a, b) => (b.avgVelocity ?? 0) - (a.avgVelocity ?? 0))
        .slice(0, 3),
    [pigeons],
  );

  const sorted = useMemo(() => {
    let base = activeLoftId ? pigeons.filter((p) => p.loftId === activeLoftId) : [...pigeons];
    if (filter === 'champions') base = base.filter((p) => p.isChampion);
    else if (filter === 'female') base = base.filter((p) => p.isFemale);
    else if (filter === 'male') base = base.filter((p) => !p.isFemale);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(q) ||
          p.matricule.toLowerCase().includes(q) ||
          p.displayMatricule.toLowerCase().includes(q),
      );
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    return base.sort((a, b) => {
      switch (sortKey) {
        case 'raceCount':
          return dir * (a.raceCount - b.raceCount);
        case 'avgVelocity':
          return dir * ((a.avgVelocity ?? 0) - (b.avgVelocity ?? 0));
        case 'bestPlace':
          return dir * ((a.bestPlace ?? 9999) - (b.bestPlace ?? 9999));
        case 'name':
          return dir * (a.name ?? a.matricule).localeCompare(b.name ?? b.matricule, 'fr');
        case 'year':
          return dir * (a.yearOfBirth - b.yearOfBirth);
      }
    });
  }, [pigeons, activeLoftId, filter, searchQuery, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return sorted.slice(start, start + limit);
  }, [sorted, currentPage, limit]);

  useEffect(() => {
    setPage(1);
  }, [activeLoftId, filter, searchQuery, sortKey, sortDir]);

  const enrichedStats = useMemo(() => {
    const withVelocity = pigeons.filter((p) => p.avgVelocity !== null);
    const bestVelocity =
      withVelocity.length > 0
        ? Math.max(...withVelocity.map((p) => p.avgVelocity ?? 0)).toFixed(0)
        : '—';
    const bestPlace =
      pigeons.filter((p) => p.bestPlace !== null).length > 0
        ? Math.min(...pigeons.filter((p) => p.bestPlace !== null).map((p) => p.bestPlace ?? 9999))
        : null;
    return { bestVelocity, bestPlace };
  }, [pigeons]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />
      <PigeonAddFab />

      {showBanner && (
        <div
          style={{
            background: 'var(--cb-positive-soft)',
            color: 'var(--cb-positive)',
            padding: '14px clamp(16px, 4vw, 28px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid color-mix(in oklab, var(--cb-positive) 30%, transparent)',
          }}
        >
          <CheckIcon />
          <span style={{ flex: 1, fontWeight: 500, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            Bienvenue dans votre pigeonnier. Cliquez sur un pigeon pour voir sa fiche.
          </span>
          <button
            type="button"
            className="cb-btn cb-btn--link"
            onClick={() => setShowBanner(false)}
            style={{ color: 'var(--cb-positive)', minHeight: 'auto', flexShrink: 0 }}
          >
            Fermer
          </button>
        </div>
      )}

      <main
        style={{ maxWidth: 1440, margin: '0 auto', padding: '24px clamp(12px, 4vw, 48px) 80px' }}
      >
        {/* Header */}
        <div
          className="cb-page-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="cb-eyebrow" style={{ marginBottom: 4 }}>
              Pigeonnier
            </div>
            <h1
              className="cb-display"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', margin: 0 }}
            >
              {loftName}
              <span
                className="cb-muted"
                style={{ fontWeight: 400, marginLeft: 12, fontSize: '0.6em' }}
              >
                · {sorted.length} pigeon{sorted.length > 1 ? 's' : ''}
              </span>
            </h1>
          </div>
          <Link
            href="/pigeonnier/ajouter"
            className="cb-btn cb-btn--primary cb-pigeonnier-header-action"
            style={{ flexShrink: 0 }}
          >
            <PlusIcon /> Ajouter
          </Link>
        </div>

        {/* Onglets pigeonniers — visibles seulement si plusieurs lofts */}
        {lofts.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <div className="cb-eyebrow" style={{ marginBottom: 8 }}>
              Equipe
            </div>
            <div className="cb-chips">
              <button
                type="button"
                className="cb-chip"
                data-active={activeLoftId === null}
                onClick={() => setActiveLoftId(null)}
              >
                Toutes les équipes
                <span className="cb-chip__count">{pigeons.length}</span>
              </button>
              {lofts.map((loft) => {
                const count = pigeons.filter((p) => p.loftId === loft.id).length;
                const isActive = activeLoftId === loft.id;
                return (
                  <button
                    key={loft.id}
                    type="button"
                    className="cb-chip"
                    data-active={isActive}
                    onClick={() => setActiveLoftId(loft.id)}
                  >
                    {loft.name}
                    <span className="cb-chip__count">{count}</span>
                  </button>
                );
              })}
              <Link
                href="/reglages/pigeonnier"
                className="cb-chip"
                style={{ color: 'var(--cb-accent)' }}
              >
                + Gérer
              </Link>
            </div>
          </div>
        )}

        {/* Stats — 2 lignes de 3 sur desktop, 2 col sur mobile */}
        <div
          className="cb-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <KpiCard
            label="Pigeons"
            value={stats.total}
            hint="dans le colombier"
            tone="default"
            icon={<PigeonIcon size={20} />}
          />
          <KpiCard
            label="Champions"
            value={stats.champions}
            hint="au moins 1 victoire"
            tone="gold"
            icon={<TrophyIcon />}
          />
          <KpiCard
            label="Concours"
            value={stats.totalRaces}
            hint="cumul"
            tone="default"
            icon={<FlagIcon />}
          />
          <KpiCard
            label="Vitesse moy."
            value={stats.avgVelocity}
            suffix="m/min"
            hint="tous pigeons"
            tone="accent"
            icon={<ChartIcon />}
          />
          <KpiCard
            label="Vitesse max."
            value={enrichedStats.bestVelocity}
            suffix="m/min"
            hint="meilleur pigeon"
            tone="accent"
            icon={<ChartIcon />}
          />
          <KpiCard
            label="Meill. place"
            value={enrichedStats.bestPlace ?? '—'}
            hint="tous concours"
            tone="gold"
            icon={<TrophyIcon />}
          />
        </div>

        {/* 2 colonnes */}
        <div
          className="cb-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 320px)',
            gap: 24,
          }}
        >
          {/* Pigeons */}
          <section>
            <div className="cb-filterbar">
              <div className="cb-search">
                <span className="cb-search__icon" aria-hidden="true">
                  <SearchIconBar />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un pigeon par nom ou matricule…"
                  className="cb-search__input"
                  aria-label="Rechercher dans le pigeonnier"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="cb-search__clear"
                    aria-label="Effacer la recherche"
                  >
                    <CloseIconBar />
                  </button>
                )}
              </div>

              <div className="cb-chips">
                {(
                  [
                    { id: 'all', label: 'Tous', count: pigeons.length },
                    {
                      id: 'champions',
                      label: 'Champions',
                      count: pigeons.filter((p) => p.isChampion).length,
                    },
                    {
                      id: 'female',
                      label: 'Femelles',
                      count: pigeons.filter((p) => p.isFemale).length,
                    },
                    {
                      id: 'male',
                      label: 'Mâles',
                      count: pigeons.filter((p) => !p.isFemale).length,
                    },
                  ] as { id: Filter; label: string; count: number }[]
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className="cb-chip"
                    data-active={filter === f.id}
                  >
                    {f.label}
                    <span className="cb-chip__count">{f.count}</span>
                  </button>
                ))}
              </div>

              <div className="cb-filter-toolbar">
                <span className="cb-faint" style={{ fontSize: 13 }}>
                  {sorted.length} pigeon{sorted.length > 1 ? 's' : ''}
                  {filter !== 'all' || searchQuery ? ' · filtre actif' : ''}
                </span>
                <div className="cb-filter-toolbar__spacer" />
                <select
                  value={sortKey}
                  onChange={(e) => handleSortKey(e.target.value as SortKey)}
                  className="cb-chip"
                  style={{ paddingRight: 14, cursor: 'pointer' }}
                  aria-label="Trier par"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      Trier · {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleDir}
                  className="cb-chip"
                  aria-label={sortDir === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
                  style={{ width: 36, padding: 0, justifyContent: 'center' }}
                >
                  {sortDir === 'desc' ? <SortDescIcon /> : <SortAscIcon />}
                </button>
                <ViewToggle view={view} onChange={setView} />
                {(filter !== 'all' || searchQuery !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('all');
                      setSearchQuery('');
                    }}
                    className="cb-reset-btn"
                  >
                    Effacer ×
                  </button>
                )}
              </div>
            </div>

            {pigeons.length === 0 ? (
              <div className="cb-card">
                <EmptyState
                  title="Votre pigeonnier est vide"
                  description="Vos pigeons apparaîtront ici une fois vos résultats importés."
                  action={{ label: 'Importer des résultats', href: '/concours' }}
                />
              </div>
            ) : sorted.length === 0 ? (
              <div className="cb-card">
                <EmptyState
                  size="compact"
                  title="Aucun pigeon ne correspond à vos filtres"
                  action={{
                    label: 'Réinitialiser les filtres',
                    onClick: () => {
                      setFilter('all');
                      setSearchQuery('');
                      setPage(1);
                    },
                  }}
                />
              </div>
            ) : view === 'cards' ? (
              <div
                className="cb-pigeon-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 12,
                }}
              >
                {paginated.map((p) => (
                  <PigeonCard key={p.matricule} pigeon={p} />
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <PigeonTable pigeons={paginated} />
              </div>
            )}

            {sorted.length > 0 && (
              <PigeonnierPagination
                total={sorted.length}
                page={currentPage}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(next) => {
                  setLimit(next);
                  setPage(1);
                }}
              />
            )}
          </section>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Dernier concours */}
            <div className="cb-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span
                  className="cb-muted"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  Dernier concours
                </span>
                <span className="cb-muted" style={{ fontSize: 12 }}>
                  {lastRace?.date ?? ''}
                </span>
              </div>
              <div className="cb-display" style={{ fontSize: '1.25rem', marginBottom: 2 }}>
                {lastRace?.name ?? '—'}
              </div>
              <div className="cb-muted" style={{ fontSize: 14, marginBottom: 14 }}>
                {lastRace
                  ? `${lastRace.distanceKm ? `${lastRace.distanceKm} km · ` : ''}${CATEGORY_LABELS[lastRace.category] ?? lastRace.category ?? ''}`
                  : 'Aucun résultat importé'}
              </div>
              {pigeons.length > 0 && (
                <div style={{ borderTop: '1px solid var(--cb-line-2)', paddingTop: 12 }}>
                  {[...pigeons]
                    .filter((p) => p.bestPlace !== null)
                    .sort((a, b) => (a.bestPlace ?? 999) - (b.bestPlace ?? 999))
                    .slice(0, 3)
                    .map((p, i) => (
                      <div
                        key={p.matricule}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 0',
                          borderTop: i === 0 ? 'none' : '1px solid var(--cb-line-2)',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 999,
                            background: i === 0 ? 'var(--cb-gold-soft)' : 'var(--cb-bg-sunken)',
                            color: i === 0 ? 'var(--cb-gold)' : 'var(--cb-ink-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {p.bestPlace}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name ?? p.displayMatricule}
                          </div>
                          <div className="cb-faint cb-matricule" style={{ fontSize: 11 }}>
                            {p.displayMatricule}
                          </div>
                        </div>
                        {p.avgVelocity && (
                          <div
                            className="cb-tabular"
                            style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}
                          >
                            {p.avgVelocity.toFixed(0)}
                            <span className="cb-faint" style={{ fontSize: 11, marginLeft: 2 }}>
                              m/min
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
              <Link
                href="/concours"
                className="cb-btn cb-btn--soft"
                style={{ width: '100%', marginTop: pigeons.length > 0 ? 14 : 0 }}
              >
                Voir tous les r&eacute;sultats <ArrowRightIcon />
              </Link>
            </div>

            {/* Meilleurs voyageurs */}
            {leaders.length > 0 && (
              <div className="cb-card" style={{ padding: 20 }}>
                <div
                  className="cb-muted"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    marginBottom: 10,
                  }}
                >
                  Meilleurs voyageurs — saison
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
                      style={{ fontSize: 22, color: 'var(--cb-ink-4)', width: 26, flexShrink: 0 }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name ?? p.displayMatricule}
                      </div>
                      <div className="cb-matricule cb-faint" style={{ fontSize: 11 }}>
                        {p.displayMatricule}
                      </div>
                    </div>
                    <div style={{ minWidth: 76, textAlign: 'right', flexShrink: 0 }}>
                      <span className="cb-tabular" style={{ fontWeight: 700 }}>
                        {p.avgVelocity?.toFixed(0)}{' '}
                        <span className="cb-faint" style={{ fontSize: 11 }}>
                          m/min
                        </span>
                      </span>
                      <div
                        style={{
                          height: 4,
                          marginTop: 5,
                          borderRadius: 999,
                          background: 'var(--cb-bg-sunken)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(10, ((p.avgVelocity ?? 0) / (leaders[0]?.avgVelocity ?? 1)) * 100)}%`,
                            height: '100%',
                            background: 'var(--cb-accent)',
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>

      <style>{`
        /* Masquer la scrollbar des pills sur mobile */
        .cb-pills { scrollbar-width: none; }
        .cb-pills::-webkit-scrollbar { display: none; }

        /* Desktop */
        @media (min-width: 981px) {
          .cb-main-grid { grid-template-columns: minmax(0, 2fr) minmax(260px, 320px) !important; }
        }

        /* Tablette */
        @media (max-width: 980px) {
          .cb-main-grid { grid-template-columns: 1fr !important; }
          .cb-main-grid > aside { order: -1; }
          .cb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .cb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .cb-pigeon-grid { grid-template-columns: 1fr !important; }
          .cb-toolbar { gap: 6px !important; }

          /* Cards compactes en mode liste sur mobile */
          .cb-pigeon-card { flex-direction: row !important; align-items: center !important; padding: 12px 14px !important; gap: 12px !important; }
          .cb-pigeon-card .cb-pigeon-stats { display: none !important; }
          .cb-pigeon-card .cb-pigeon-last { display: none !important; }
          .cb-pigeon-card .cb-pigeon-compact-stats { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function PigeonCard({ pigeon }: { pigeon: PigeonRow }) {
  return (
    <Link
      href={`/pigeonnier/${pigeon.matricule}`}
      className="cb-card cb-pigeon-card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
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
            fontSize: 16,
          }}
        >
          {pigeon.isFemale ? 'F' : 'M'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="cb-matricule"
            style={{
              fontWeight: 700,
              fontSize: '.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pigeon.displayMatricule}
          </div>
          <div
            style={{
              fontFamily: 'var(--cb-font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
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

      <div
        className="cb-pigeon-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          borderTop: '1px solid var(--cb-line-2)',
          paddingTop: 10,
        }}
      >
        <MiniStat label="Concours" value={String(pigeon.raceCount)} />
        <MiniStat label="Meill. place" value={pigeon.bestPlace ? `${pigeon.bestPlace}e` : '—'} />
        <MiniStat
          label="Vit. moy."
          value={pigeon.avgVelocity ? pigeon.avgVelocity.toFixed(0) : '—'}
        />
      </div>

      {pigeon.lastRaceName && (
        <div className="cb-pigeon-last cb-faint" style={{ fontSize: 12 }}>
          Dernier : {pigeon.lastRaceName}
        </div>
      )}

      {/* Stats compactes visibles uniquement en mode liste mobile */}
      <div
        className="cb-pigeon-compact-stats"
        style={{ display: 'none', textAlign: 'right', flexShrink: 0 }}
      >
        {pigeon.bestPlace && (
          <div
            className="cb-display cb-tabular"
            style={{
              fontSize: '1.25rem',
              color: pigeon.bestPlace <= 3 ? 'var(--cb-accent)' : 'var(--cb-ink)',
            }}
          >
            {pigeon.bestPlace}
            <sup style={{ fontSize: 10 }}>e</sup>
          </div>
        )}
        <div className="cb-faint" style={{ fontSize: 11 }}>
          {pigeon.raceCount} conc.
        </div>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="cb-muted"
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        {label}
      </div>
      <div className="cb-tabular" style={{ fontWeight: 700, fontSize: '1rem' }}>
        {value}
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {(['cards', 'table'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="cb-chip"
          data-active={view === v}
          aria-label={v === 'cards' ? 'Vue cartes' : 'Vue tableau'}
          style={{ width: 36, padding: 0, justifyContent: 'center' }}
        >
          {v === 'cards' ? <GridIcon /> : <ListIcon />}
        </button>
      ))}
    </div>
  );
}

function PigeonTable({ pigeons }: { pigeons: PigeonRow[] }) {
  const th: React.CSSProperties = {
    padding: '10px 14px',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    whiteSpace: 'nowrap',
  };
  const td: React.CSSProperties = { padding: '10px 14px' };
  return (
    <div className="cb-card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
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
            <th style={{ ...th, textAlign: 'center' }}>S</th>
            <th style={{ ...th, textAlign: 'right' }}>Conc.</th>
            <th style={{ ...th, textAlign: 'right' }}>Meill.</th>
            <th style={{ ...th, textAlign: 'right' }}>Vit. moy.</th>
            <th style={th}>Dernier</th>
          </tr>
        </thead>
        <tbody>
          {pigeons.map((p, i) => (
            <tr
              key={p.matricule}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--cb-line-2)',
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
                <span className="cb-matricule" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {p.displayMatricule}
                </span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                {p.name ?? <span className="cb-faint">—</span>}
                {p.isChampion && (
                  <TrophyIcon
                    size={12}
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
              <td style={{ ...td, color: 'var(--cb-ink-3)', whiteSpace: 'nowrap' }}>
                {p.lastRaceName ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PigeonnierPagination({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);
  const pages: Array<number | '…'> = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  let ellipsisCount = 0;

  return (
    <div
      className="cb-card"
      style={{
        marginTop: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div className="cb-faint" style={{ fontSize: 13 }}>
        {total === 0 ? 'Aucun résultat' : `${from}–${to} sur ${total.toLocaleString('fr-FR')}`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="cb-faint" style={{ fontSize: 13 }}>
            Afficher
          </span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="cb-input"
            style={{ minHeight: 34, padding: '0 10px', fontSize: 13, width: 80 }}
            aria-label="Nombre de pigeons par page"
          >
            {PAGE_SIZE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="cb-faint" style={{ fontSize: 13 }}>
            / page
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className="cb-btn cb-btn--ghost"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{ minHeight: 34, minWidth: 34, padding: 0 }}
            aria-label="Page précédente"
          >
            ‹
          </button>
          {pages.map((p) =>
            p === '…' ? (
              <span
                key={`ellipsis-${++ellipsisCount}`}
                className="cb-faint"
                style={{
                  minWidth: 34,
                  minHeight: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="cb-btn"
                onClick={() => onPageChange(p)}
                style={{
                  minHeight: 34,
                  minWidth: 34,
                  padding: 0,
                  borderRadius: 8,
                  border: `1px solid ${p === page ? 'var(--cb-accent)' : 'var(--cb-line)'}`,
                  background: p === page ? 'var(--cb-accent)' : 'var(--cb-bg-elev)',
                  color: p === page ? '#fff' : 'var(--cb-ink-2)',
                  fontWeight: p === page ? 700 : 500,
                }}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className="cb-btn cb-btn--ghost"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{ minHeight: 34, minWidth: 34, padding: 0 }}
            aria-label="Page suivante"
          >
            ›
          </button>
        </div>
      </div>
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
function TrophyIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
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
function ChartIcon({ size = 20 }: { size?: number }) {
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
function FlagIcon() {
  return (
    <svg
      width="20"
      height="20"
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
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
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
      width="18"
      height="18"
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
function ArrowRightIcon() {
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
    >
      <title>Voir</title>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function SortDescIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Décroissant</title>
      <path d="M3 6h18M3 12h12M3 18h6" />
      <path d="M19 12v8m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}
function SortAscIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Croissant</title>
      <path d="M3 18h18M3 12h12M3 6h6" />
      <path d="M19 4v8m0-8l-3 3m3-3l3 3" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  );
}
function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Vue liste</title>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function SearchIconBar() {
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

function CloseIconBar() {
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
