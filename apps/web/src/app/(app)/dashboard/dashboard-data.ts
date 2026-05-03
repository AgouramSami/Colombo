import { CATEGORY_LABELS } from '@/lib/colombo-race-labels';
import { buildMonthlyPerformanceSeries } from '@/lib/performance-series';
import { calendarYearPeriodLabel } from '@/lib/period-labels';
import { type EmbeddedRace, singleRace } from '@/lib/pigeon-result-race';
import { loadUserPigeonResults } from '@/lib/user-race-results';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  OBJECTIVE_DEFINITIONS,
  type ObjectiveDefinition,
} from './badges';

export type DashboardSearchParams = {
  periode?: string | string[];
  type?: string | string[];
  age?: string | string[];
};

export type LatestContest = {
  place: number;
  releasePoint: string;
  raceDate: string;
  categoryLabel: string;
  topPercent: number | null;
};

export type TopPigeon = {
  matricule: string;
  name: string | null;
  avg_velocity: number;
  race_count: number;
};

export type BadgeInventoryItem = BadgeDefinition & {
  unlocked: boolean;
  unlockedAt: string | null;
};

export type ObjectiveItem = ObjectiveDefinition & {
  current: number;
};

export type DashboardData = {
  displayName: string;
  periodLabel: string;
  selectedPeriod: 'season' | '12m';
  totalPigeons: number;
  periodResultsCount: number;
  tauxDePrix: number | null;
  prevTauxDePrix: number | null;
  avgVelocity: number | null;
  performanceSeries: { label: string; value: number }[];
  latestContest: LatestContest | null;
  topPigeons: TopPigeon[];
  badgeInventory: BadgeInventoryItem[];
  objectives: ObjectiveItem[];
  unlockedBadges: number;
  badgePoints: number;
  totalBadges: number;
  newlyUnlockedBadgeNames: string[];
};

export async function loadDashboardData(
  supabase: SupabaseClient,
  userId: string,
  fallbackName: string,
  params: DashboardSearchParams | undefined,
): Promise<DashboardData> {
  type RaceRef = EmbeddedRace | null;

  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();
  const displayName = userData?.display_name ?? fallbackName;

  const { myPigeons, allResults } = await loadUserPigeonResults(supabase);
  const myMatricules = new Set(myPigeons.map((p) => p.matricule));
  const totalPigeons = myPigeons.length;

  const sortedResults = [...(allResults ?? [])].sort((a, b) => {
    const da = singleRace(a.races)?.race_date ?? '';
    const db = singleRace(b.races)?.race_date ?? '';
    return db.localeCompare(da);
  });

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

  const prevPlaces = previousPeriodResults.map((r) => r.place).filter((p) => p > 0);
  const prevTauxDePrix =
    previousPeriodResults.length > 0
      ? Math.round((prevPlaces.length / previousPeriodResults.length) * 100)
      : null;

  const performanceSeries = buildMonthlyPerformanceSeries(periodResults, 6);

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
    .eq('user_id', userId);
  const persistedBadges = (persistedBadgesRaw ?? []) as Array<{
    badge_id: string;
    unlocked_at: string;
  }>;
  const persistedBadgeMap = new Map(persistedBadges.map((b) => [b.badge_id, b.unlocked_at]));

  const newlyUnlockedRows = BADGE_DEFINITIONS.filter(
    (b) => computedBadgeUnlocks.has(b.id) && !persistedBadgeMap.has(b.id),
  ).map((b) => ({
    user_id: userId,
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

  const badgeInventory: BadgeInventoryItem[] = BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: persistedBadgeMap.has(badge.id) || computedBadgeUnlocks.has(badge.id),
    unlockedAt: persistedBadgeMap.get(badge.id) ?? null,
  }));

  const objectives: ObjectiveItem[] = OBJECTIVE_DEFINITIONS.map((goal) => ({
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

  const topPigeons: TopPigeon[] = [];
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

  const latestRow = recentResults[0];
  const latestRace = latestRow ? singleRace(latestRow.races) : null;
  const latestEngaged = latestRow?.n_engagement ?? null;
  const latestContest: LatestContest | null =
    latestRow && latestRace
      ? {
          place: latestRow.place,
          releasePoint: latestRace.release_point,
          raceDate: latestRace.race_date,
          categoryLabel: CATEGORY_LABELS[latestRace.category] ?? latestRace.category,
          topPercent:
            latestEngaged && latestEngaged > 0
              ? Math.max(1, Math.round((latestRow.place / latestEngaged) * 100))
              : null,
        }
      : null;

  return {
    displayName,
    periodLabel,
    selectedPeriod,
    totalPigeons,
    periodResultsCount: periodResults.length,
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
    totalBadges: BADGE_DEFINITIONS.length,
    newlyUnlockedBadgeNames,
  };
}
