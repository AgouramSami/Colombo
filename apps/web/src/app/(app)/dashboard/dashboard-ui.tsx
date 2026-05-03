import { EmptyState } from '@/components/empty-state';
import { KpiCard } from '@/components/kpi-card';
import { LinePerformanceChart } from '@/components/performance-charts';
import { PeriodPill } from '@/components/period-pill';
import { WeatherCard } from '@/components/weather-card';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { rarityLabel } from './badges';
import type { BadgeInventoryItem, DashboardData, ObjectiveItem } from './dashboard-data';

export function DashboardUI({ data }: { data: DashboardData }) {
  const {
    displayName,
    periodLabel,
    selectedPeriod,
    currentYear,
    totalPigeons,
    periodResultsCount,
    tauxDePrix,
    prevTauxDePrix,
    avgVelocity,
    performanceSeries,
    latestContest,
    topPigeons,
    badgeInventory,
    objectives,
    unlockedBadges,
    badgePoints,
    totalBadges,
  } = data;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
          Tableau de bord
        </h1>
        <p className="cb-faint" style={{ margin: '6px 0 0', fontSize: 14 }}>
          {displayName} · {periodLabel}
        </p>
        <div className="cb-filter-toolbar" style={{ marginTop: 14 }}>
          <div className="cb-chips">
            <PeriodPill href="/dashboard?periode=current" active={selectedPeriod === 'current'}>
              Saison {currentYear}
            </PeriodPill>
            <PeriodPill href="/dashboard?periode=previous" active={selectedPeriod === 'previous'}>
              Saison {currentYear - 1}
            </PeriodPill>
            <PeriodPill href="/dashboard?periode=career" active={selectedPeriod === 'career'}>
              Carrière
            </PeriodPill>
          </div>
          <div className="cb-filter-toolbar__spacer" />
          <Link
            href={`/performance?periode=${selectedPeriod}`}
            className="cb-chip"
            style={{ color: 'var(--cb-accent)' }}
          >
            Analyses détaillées →
          </Link>
        </div>
      </div>

      <div
        className="cb-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <KpiCard label="Total pigeons" value={totalPigeons} icon={<LoftIcon />} />
        <KpiCard label="Résultats année civile" value={periodResultsCount} icon={<StatsIcon />} />
        <KpiCard
          label="Taux de prix"
          value={tauxDePrix !== null ? `${tauxDePrix}%` : '—'}
          tone={tauxDePrix !== null && tauxDePrix >= 30 ? 'accent' : undefined}
          trend={computeTrend(tauxDePrix ?? 0, prevTauxDePrix)}
          icon={<TargetIcon />}
        />
        <KpiCard
          label="Vitesse moyenne"
          value={avgVelocity ? avgVelocity.toFixed(0) : '—'}
          suffix={avgVelocity ? 'm/min' : undefined}
          icon={<BoltIcon />}
        />
      </div>

      <WeatherCard className="cb-weather-card" />

      <div
        className="cb-insights-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
          gap: 12,
          marginTop: 12,
          marginBottom: 28,
        }}
      >
        <div className="cb-card" style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 10,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="cb-section-title" style={{ marginBottom: 0 }}>
                Évolution des performances
              </div>
              <span className="cb-faint" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                Mois avec au moins un résultat · date du concours, pas l&apos;import
              </span>
            </div>
            <span className="cb-faint" style={{ fontSize: 12 }}>
              Objectif top 10 : 30%
            </span>
          </div>
          <LinePerformanceChart data={performanceSeries} target={30} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cb-card" style={{ padding: 16 }}>
            <div className="cb-section-title" style={{ marginBottom: 4 }}>
              Dernier concours
            </div>
            {latestContest ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{latestContest.releasePoint}</div>
                <div className="cb-faint" style={{ fontSize: 12, marginTop: 2 }}>
                  {new Date(latestContest.raceDate).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                  })}{' '}
                  · {latestContest.categoryLabel}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <div>
                    <div className="cb-faint" style={{ fontSize: 11 }}>
                      Place
                    </div>
                    <div className="cb-display cb-tabular" style={{ fontSize: '1.6rem' }}>
                      {latestContest.place}
                    </div>
                  </div>
                  <div>
                    <div className="cb-faint" style={{ fontSize: 11 }}>
                      Top
                    </div>
                    <div
                      className="cb-display cb-tabular"
                      style={{ fontSize: '1.6rem', color: 'var(--cb-positive)' }}
                    >
                      {latestContest.topPercent ? `${latestContest.topPercent}%` : '—'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                size="compact"
                title="Aucun concours récent"
                description="Importez vos résultats pour voir votre dernier lâcher ici."
              />
            )}
            <Link
              href="/concours"
              className="cb-btn cb-btn--ghost"
              style={{ width: '100%', marginTop: 12, minHeight: 40 }}
            >
              Voir les résultats
            </Link>
          </div>

          <div className="cb-card" style={{ padding: 16 }}>
            <div className="cb-section-title" style={{ marginBottom: 8 }}>
              Champions du moment
            </div>
            {topPigeons.length === 0 ? (
              <EmptyState
                size="compact"
                title="Aucun champion disponible"
                description="Vos meilleurs voyageurs apparaîtront ici après vos premiers résultats."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topPigeons.slice(0, 3).map((p, idx) => (
                  <Link
                    key={p.matricule}
                    href={`/pigeonnier/${p.matricule}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      background: 'var(--cb-bg-sunken)',
                    }}
                  >
                    <span
                      className="cb-display cb-tabular"
                      style={{ width: 22, color: 'var(--cb-ink-4)', fontSize: 20 }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name ?? formatMatricule(p.matricule)}
                      </div>
                      <div className="cb-faint cb-matricule" style={{ fontSize: 11 }}>
                        {formatMatricule(p.matricule)}
                      </div>
                    </div>
                    <span className="cb-tabular" style={{ fontWeight: 700, fontSize: 13 }}>
                      {p.avg_velocity.toFixed(0)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="cb-card" style={{ padding: 20, marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div>
            <div className="cb-eyebrow">Trophées</div>
            <h2 className="cb-display" style={{ fontSize: '1.25rem', margin: '4px 0 0' }}>
              Badges &amp; objectifs
            </h2>
          </div>
          <div className="cb-faint" style={{ fontSize: 13 }}>
            {unlockedBadges}/{totalBadges} badges · {badgePoints} pts
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {badgeInventory.map((badge) => (
            <BadgeTile key={badge.id} badge={badge} />
          ))}
        </div>

        <div className="cb-eyebrow" style={{ marginBottom: 8 }}>
          Objectifs en cours
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objectives.map((objective) => (
            <ObjectiveBar key={objective.id} objective={objective} />
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <Link href="/pigeonnier" className="cb-btn cb-btn--ghost" style={{ minHeight: 40 }}>
          Voir mon pigeonnier &rarr;
        </Link>
        <Link href="/performance" className="cb-btn cb-btn--ghost" style={{ minHeight: 40 }}>
          Analyses détaillées &rarr;
        </Link>
      </div>
    </main>
  );
}

function BadgeTile({ badge }: { badge: BadgeInventoryItem }) {
  const toneBg =
    badge.tone === 'gold'
      ? 'var(--cb-gold-soft)'
      : badge.tone === 'accent'
        ? 'var(--cb-accent-soft)'
        : 'var(--cb-bg-sunken)';
  const toneInk =
    badge.tone === 'gold'
      ? 'var(--cb-gold)'
      : badge.tone === 'accent'
        ? 'var(--cb-accent-soft-ink)'
        : 'var(--cb-ink-2)';

  return (
    <div
      className="cb-card"
      style={{
        padding: 14,
        background: 'var(--cb-bg-elev)',
        opacity: badge.unlocked ? 1 : 0.45,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textAlign: 'center',
      }}
      title={badge.hint}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: toneBg,
          color: toneInk,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
        }}
      >
        <BadgeIcon icon={badge.icon} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{badge.name}</div>
      <div className="cb-faint" style={{ fontSize: 11 }}>
        {rarityLabel(badge.rarity)} · {badge.points} pts
      </div>
    </div>
  );
}

function ObjectiveBar({ objective }: { objective: ObjectiveItem }) {
  const ratio = Math.max(0, Math.min(1, objective.current / objective.target));
  const percent = Math.round(ratio * 100);
  const reached = objective.current >= objective.target;
  const fillColor = reached ? 'var(--cb-positive)' : 'var(--cb-accent)';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 600 }}>{objective.label}</span>
        <span className="cb-tabular cb-muted">
          {Math.min(objective.current, objective.target)}/{objective.target} · {percent}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--cb-bg-sunken)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: fillColor,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function computeTrend(
  current: number,
  previous: number | null,
  inverse = false,
): { text: string; tone: 'up' | 'down' | 'flat' } | undefined {
  if (previous === null || Number.isNaN(previous)) return undefined;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return { text: '= stable vs période précédente', tone: 'flat' };
  const isUp = inverse ? delta < 0 : delta > 0;
  const sign = delta > 0 ? '+' : '';
  return {
    text: `${sign}${delta} vs période précédente`,
    tone: isUp ? 'up' : 'down',
  };
}

function BadgeIcon({ icon }: { icon: string }) {
  if (icon === 'badge-podium') return <PodiumIcon />;
  if (icon === 'badge-regularity') return <RankIcon />;
  if (icon === 'badge-speed') return <BoltIcon />;
  if (icon === 'badge-top10') return <TargetIcon />;
  if (icon === 'badge-consistency') return <StatsIcon />;
  return <TrophyIcon />;
}

function StatsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Stats</title>
      <path d="M4 19V9M12 19V5M20 19v-7" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Trophée</title>
      <path d="M8 4h8v3a4 4 0 0 1-8 0zM6 7H4a2 2 0 0 0 2 2M18 7h2a2 2 0 0 1-2 2M12 11v4M9 19h6" />
    </svg>
  );
}

function PodiumIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Podium</title>
      <path d="M4 20h16M7 20v-5h4v5M13 20v-8h4v8" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Cible</title>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Classement</title>
      <path d="M7 17V7M12 17V4M17 17v-9" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Vitesse</title>
      <path d="M13 2 4 14h7l-1 8 10-13h-7z" />
    </svg>
  );
}

function LoftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <title>Pigeonnier</title>
      <path d="M3 11 12 4l9 7M5 10v10h14V10" />
    </svg>
  );
}
