import { LinePerformanceChart } from '@/components/performance-charts';
import { PeriodPill } from '@/components/period-pill';
import { AppTopbar } from '@/components/app-topbar';
import { EmptyState } from '@/components/empty-state';
import { KpiCard } from '@/components/kpi-card';
import { WeatherCard } from '@/components/weather-card';
import { CATEGORY_LABELS } from '@/lib/colombo-race-labels';
import { calendarYearPeriodLabel } from '@/lib/period-labels';
import { singleRace, type EmbeddedRace } from '@/lib/pigeon-result-race';
import { buildMonthlyPerformanceSeries } from '@/lib/performance-series';
import { createClient } from '@/lib/supabase/server';
import { loadUserPigeonResults } from '@/lib/user-race-results';
import { formatMatricule } from '@colombo/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BADGE_DEFINITIONS, OBJECTIVE_DEFINITIONS, rarityLabel } from './badges';
import { DashboardNewBadgeToast } from './dashboard-new-badge-toast';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    periode?: string | string[];
    type?: string | string[];
    age?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const userName = user.email?.split('@')[0] ?? 'Éleveur';
  const firstName = userName.split('.')[0] ?? userName;

  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const displayName = userData?.display_name ?? firstName;

  const { myPigeons, allResults } = await loadUserPigeonResults(supabase);
  const myMatricules = new Set(myPigeons.map((p) => p.matricule));
  const totalPigeons = myPigeons.length;

  type RaceRef = EmbeddedRace | null;

  // Tri par date descendante (pas de tri SQL sur table étrangère — fait en JS)
  const sortedResults = [...(allResults ?? [])].sort((a, b) => {
    const da = singleRace(a.races)?.race_date ?? '';
    const db = singleRace(b.races)?.race_date ?? '';
    return db.localeCompare(da);
  });

  const championsTotal = (allResults ?? []).filter((r) => r.place === 1).length;

  const currentYear = new Date().getFullYear();
  const seasonStart = `${currentYear}-01-01`;
  const periodParam = Array.isArray(params?.periode) ? params?.periode[0] : params?.periode;
  const selectedPeriod: 'season' | '12m' = periodParam === '12m' ? '12m' : 'season';
  const categoryParam = Array.isArray(params?.type) ? params?.type[0] : params?.type;
  const selectedCategory =
    typeof categoryParam === 'string' && categoryParam in CATEGORY_LABELS ? categoryParam : 'all';
  const ageParam = Array.isArray(params?.age) ? params?.age[0] : params?.age;
  const selectedAge: 'all' | 'vieux' | 'jeune' =
    ageParam === 'vieux' || ageParam === 'jeune' ? ageParam : 'all';
  const rollingStart = new Date();
  rollingStart.setMonth(rollingStart.getMonth() - 11);
  rollingStart.setDate(1);
  const rollingStartStr = rollingStart.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const periodStart = selectedPeriod === '12m' ? rollingStartStr : seasonStart;
  const periodLabel =
    selectedPeriod === '12m' ? '12 derniers mois' : calendarYearPeriodLabel(currentYear);
  const { data: upcomingRacesRaw } = await supabase
    .from('races')
    .select('race_date, release_point, category, age_class, distance_min_km')
    .gte('race_date', todayStr)
    .order('race_date', { ascending: true })
    .limit(5);
  const upcomingRaces = (upcomingRacesRaw ?? []) as Array<{
    race_date: string;
    release_point: string;
    category: string;
    age_class: 'vieux' | 'jeune';
    distance_min_km: number | null;
  }>;

  const raceMatchesFilters = (race: RaceRef) => {
    if (!race) return false;
    const categoryOk = selectedCategory === 'all' || race.category === selectedCategory;
    const ageOk = selectedAge === 'all' || race.age_class === selectedAge;
    return categoryOk && ageOk;
  };

  const periodResults = sortedResults.filter((r) => {
    const race = singleRace(r.races);
    return (
      race &&
      race.race_date >= periodStart &&
      race.race_date <= todayStr &&
      raceMatchesFilters(race)
    );
  });
  const previousPeriodRange =
    selectedPeriod === '12m'
      ? (() => {
          const prevEnd = new Date(rollingStart);
          prevEnd.setDate(prevEnd.getDate() - 1);
          const prevStart = new Date(rollingStart);
          prevStart.setFullYear(prevStart.getFullYear() - 1);
          return {
            start: prevStart.toISOString().slice(0, 10),
            end: prevEnd.toISOString().slice(0, 10),
          };
        })()
      : (() => {
          const prevStart = `${currentYear - 1}-01-01`;
          const prevEnd = new Date(today);
          prevEnd.setFullYear(prevEnd.getFullYear() - 1);
          return {
            start: prevStart,
            end: prevEnd.toISOString().slice(0, 10),
          };
        })();
  const previousPeriodResults = sortedResults.filter((r) => {
    const race = singleRace(r.races);
    if (!race || !raceMatchesFilters(race)) return false;
    return race.race_date >= previousPeriodRange.start && race.race_date <= previousPeriodRange.end;
  });
  const recentResults = periodResults.slice(0, 5);
  const periodPlaces = periodResults.map((r) => r.place).filter((p) => p > 0);
  const bestPlaceSeason = periodPlaces.length > 0 ? Math.min(...periodPlaces) : null;
  const tauxDePrix =
    periodResults.length > 0
      ? Math.round((periodPlaces.length / periodResults.length) * 100)
      : null;

  const velocities = recentResults
    .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
    .filter((v) => v > 0);
  const avgVelocity =
    velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : null;

  const seasonRaceIds = new Set(
    periodResults
      .map((r) => singleRace(r.races)?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  const seasonUniqueRaces = seasonRaceIds.size;
  const podiumCount = periodResults.filter((r) => r.place > 0 && r.place <= 3).length;
  const topTenCount = periodResults.filter((r) => r.place > 0 && r.place <= 10).length;
  const podiumRate =
    periodResults.length > 0 ? Math.round((podiumCount / periodResults.length) * 100) : null;
  const topTenRate =
    periodResults.length > 0 ? Math.round((topTenCount / periodResults.length) * 100) : null;
  const avgPlaceSeason =
    periodPlaces.length > 0
      ? Math.round(
          (periodPlaces.reduce((sum, place) => sum + place, 0) / periodPlaces.length) * 10,
        ) / 10
      : null;
  const prevPlaces = previousPeriodResults.map((r) => r.place).filter((p) => p > 0);
  const prevTauxDePrix =
    previousPeriodResults.length > 0
      ? Math.round((prevPlaces.length / previousPeriodResults.length) * 100)
      : null;
  const prevPodiumRate =
    previousPeriodResults.length > 0
      ? Math.round(
          (previousPeriodResults.filter((r) => r.place > 0 && r.place <= 3).length /
            previousPeriodResults.length) *
            100,
        )
      : null;
  const prevTopTenRate =
    previousPeriodResults.length > 0
      ? Math.round(
          (previousPeriodResults.filter((r) => r.place > 0 && r.place <= 10).length /
            previousPeriodResults.length) *
            100,
        )
      : null;
  const prevVelocities = previousPeriodResults
    .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
    .filter((v) => v > 0);
  const prevAvgVelocity =
    prevVelocities.length > 0
      ? prevVelocities.reduce((sum, v) => sum + v, 0) / prevVelocities.length
      : null;

  const performanceSeries = buildMonthlyPerformanceSeries(periodResults, 6);

  const categoryMap = new Map<string, number>();
  for (const r of periodResults) {
    const category = singleRace(r.races)?.category;
    if (!category) continue;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
  }
  const categorySeries = [...categoryMap.entries()]
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const placeDistribution = [
    { label: '1-3', value: periodResults.filter((r) => r.place > 0 && r.place <= 3).length },
    { label: '4-10', value: periodResults.filter((r) => r.place >= 4 && r.place <= 10).length },
    { label: '11-50', value: periodResults.filter((r) => r.place >= 11 && r.place <= 50).length },
    { label: '51+', value: periodResults.filter((r) => r.place >= 51).length },
  ];
  const computedBadgeUnlocks = new Set(
    BADGE_DEFINITIONS.filter(
      (badge) =>
        (badge.id === 'first-podium' && podiumCount > 0) ||
        (badge.id === 'season-regular' && seasonUniqueRaces >= 5) ||
        (badge.id === 'speed-master' && avgVelocity !== null && avgVelocity >= 1300) ||
        (badge.id === 'top-10-hunter' && topTenCount >= 5) ||
        (badge.id === 'consistency-pro' && tauxDePrix !== null && tauxDePrix >= 35),
    ).map((b) => b.id),
  );
  const { data: persistedBadgesRaw } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', user.id);
  const persistedBadges = (persistedBadgesRaw ?? []) as Array<{
    badge_id: string;
    unlocked_at: string;
  }>;
  const persistedBadgeMap = new Map(persistedBadges.map((b) => [b.badge_id, b.unlocked_at]));
  const newlyUnlockedRows = BADGE_DEFINITIONS.filter(
    (b) => computedBadgeUnlocks.has(b.id) && !persistedBadgeMap.has(b.id),
  ).map((b) => ({
    user_id: user.id,
    badge_id: b.id,
    points_awarded: b.points,
    source: 'dashboard_auto_v1',
  }));
  if (newlyUnlockedRows.length > 0) {
    await supabase.from('user_badges').upsert(newlyUnlockedRows, {
      onConflict: 'user_id,badge_id',
      ignoreDuplicates: true,
    });
  }
  const newlyUnlockedBadgeNames = BADGE_DEFINITIONS.filter((b) =>
    newlyUnlockedRows.some((row) => row.badge_id === b.id),
  ).map((b) => b.name);
  const badgeInventory = BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: persistedBadgeMap.has(badge.id) || computedBadgeUnlocks.has(badge.id),
    unlockedAt: persistedBadgeMap.get(badge.id) ?? null,
  }));
  const objectives = OBJECTIVE_DEFINITIONS.map((goal) => ({
    ...goal,
    current:
      goal.id === 'goal-races'
        ? seasonUniqueRaces
        : goal.id === 'goal-top10'
          ? topTenCount
          : podiumCount,
  }));
  const unlockedBadges = badgeInventory.filter((b) => b.unlocked).length;
  const badgePoints = badgeInventory
    .filter((b) => b.unlocked)
    .reduce((sum, b) => sum + b.points, 0);

  // Top 3 pigeons par vitesse moyenne
  const topPigeons: {
    matricule: string;
    name: string | null;
    avg_velocity: number;
    race_count: number;
  }[] = [];
  if (myMatricules.size > 0) {
    const grouped: Record<string, number[]> = {};
    for (const r of allResults ?? []) {
      const v = Number.parseFloat(r.velocity_m_per_min ?? '0');
      if (v > 0) {
        const key = r.pigeon_matricule;
        if (!grouped[key]) grouped[key] = [];
        (grouped[key] as number[]).push(v);
      }
    }
    const sorted = Object.entries(grouped)
      .map(([mat, vs]) => ({
        matricule: mat,
        name: (myPigeons ?? []).find((p) => p.matricule === mat)?.name ?? null,
        avg_velocity: vs.reduce((a, b) => a + b) / vs.length,
        race_count: vs.length,
      }))
      .sort((a, b) => b.avg_velocity - a.avg_velocity)
      .slice(0, 3);
    topPigeons.push(...sorted);
  }
  const latestContest = recentResults[0];
  const latestContestRace = latestContest ? singleRace(latestContest.races) : null;
  const latestContestEngaged = latestContest?.n_engagement ?? null;
  const latestContestTop =
    latestContest && latestContestEngaged && latestContestEngaged > 0
      ? Math.max(1, Math.round((latestContest.place / latestContestEngaged) * 100))
      : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cb-bg)' }}>
      <AppTopbar userName={userName} />

      <main
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px, 4vw, 40px) 80px' }}
      >
        <DashboardNewBadgeToast badgeNames={newlyUnlockedBadgeNames} />

        <div style={{ marginBottom: 20 }}>
          <h1 className="cb-display" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
            Tableau de bord
          </h1>
          <p className="cb-faint" style={{ margin: '6px 0 0', fontSize: 14 }}>
            {displayName} · {periodLabel}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              marginTop: 14,
            }}
          >
            <span className="cb-faint" style={{ fontSize: 12 }}>
              Période
            </span>
            <PeriodPill href="/dashboard?periode=season" active={selectedPeriod === 'season'}>
              Année civile (janv.–déc.)
            </PeriodPill>
            <PeriodPill href="/dashboard?periode=12m" active={selectedPeriod === '12m'}>
              12 derniers mois
            </PeriodPill>
            <Link
              href={`/performance?periode=${selectedPeriod}`}
              className="cb-period-pill"
              style={{ marginLeft: 'auto' }}
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
          <KpiCard
            label="Résultats année civile"
            value={periodResults.length}
            icon={<StatsIcon />}
          />
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
              {latestContest && latestContestRace ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {latestContestRace.release_point}
                  </div>
                  <div className="cb-faint" style={{ fontSize: 12, marginTop: 2 }}>
                    {new Date(latestContestRace.race_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                    })}{' '}
                    · {CATEGORY_LABELS[latestContestRace.category] ?? latestContestRace.category}
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
                        {latestContestTop ? `${latestContestTop}%` : '—'}
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href="/pigeonnier" className="cb-btn cb-btn--ghost" style={{ minHeight: 40 }}>
            Voir mon pigeonnier &rarr;
          </Link>
          <Link href="/performance" className="cb-btn cb-btn--ghost" style={{ minHeight: 40 }}>
            Analyses détaillées &rarr;
          </Link>
        </div>
      </main>

      <style>{`
        @media (max-width: 720px) {
          .cb-dashboard-grid { grid-template-columns: 1fr !important; }
          .cb-insights-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .cb-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .cb-result-row:hover { background: var(--cb-bg-sunken); }
        .cb-period-pill {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid var(--cb-line);
          padding: 0 14px;
          text-decoration: none;
          color: var(--cb-ink-2);
          font-size: 0.9rem;
          font-weight: 600;
          background: var(--cb-bg-elev);
        }
        .cb-period-pill[data-active="true"] {
          color: var(--cb-accent);
          border-color: color-mix(in srgb, var(--cb-accent) 45%, white);
          background: var(--cb-accent-soft);
        }
      `}</style>
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

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Ajouter</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
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
    >
      <title>Pigeonnier</title>
      <path d="M3 11 12 4l9 7M5 10v10h14V10" />
    </svg>
  );
}

function FlagIcon() {
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
      <title>Concours</title>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
