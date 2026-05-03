import { time } from '@/lib/perf';
import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import { redirect } from 'next/navigation';
import { PigeonnierView } from './pigeonnier-view';

export type LoftInfo = {
  id: string;
  name: string;
};

export type PigeonRow = {
  matricule: string;
  displayMatricule: string;
  name: string | null;
  isFemale: boolean;
  yearOfBirth: number;
  color: string | null;
  loftId: string;
  raceCount: number;
  bestPlace: number | null;
  avgVelocity: number | null;
  lastRaceName: string | null;
  lastRaceDate: string | null;
  isChampion: boolean;
};

export type PigeonnierStats = {
  total: number;
  champions: number;
  avgVelocity: string;
  totalRaces: number;
};

export default async function PigeonnierPage(props: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  return time('/pigeonnier total', () => loadPigeonnierPage(props));
}

async function loadPigeonnierPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const user = await time('auth.getUser', async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  });
  if (!user) redirect('/login');

  const { welcome } = await searchParams;

  const loftsRaw = await time('  lofts.select', async () => {
    const { data } = await supabase
      .from('lofts')
      .select('id, name')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    return data;
  });

  const lofts: LoftInfo[] = loftsRaw ?? [];
  const loftIds = lofts.map((l) => l.id);

  type RawPigeon = {
    matricule: string;
    name: string | null;
    is_female: boolean;
    year_of_birth: number;
    color: string | null;
    loft_id: string;
    pigeon_results?: unknown;
  };

  const rawPigeons: RawPigeon[] = [];
  const PAGE_SIZE = 1000;
  let pigeonsChunkIdx = 0;
  for (let offset = 0; loftIds.length; offset += PAGE_SIZE) {
    const data = await time(`  pigeons.select+results chunk ${pigeonsChunkIdx}`, async () => {
      const res = await supabase
        .from('pigeons')
        .select(
          'matricule, name, is_female, year_of_birth, color, loft_id, pigeon_results(place, velocity_m_per_min, races(race_date, release_point, distance_min_km, category))',
        )
        .in('loft_id', loftIds)
        .is('deleted_at', null)
        .order('matricule', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      return res.data;
    });
    rawPigeons.push(...(data ?? []));
    pigeonsChunkIdx += 1;
    if (!data || data.length < PAGE_SIZE) break;
  }
  // biome-ignore lint/suspicious/noConsoleLog: instrumentation
  console.log(`[perf:info] /pigeonnier volume — pigeons:${rawPigeons.length}`);

  const pigeons: PigeonRow[] = (rawPigeons ?? []).map((p) => {
    const results = (p.pigeon_results ?? []) as unknown as Array<{
      place: number;
      velocity_m_per_min: string | null;
      races: { race_date: string; release_point: string } | null;
    }>;

    const velocities = results
      .map((r) => Number.parseFloat(r.velocity_m_per_min ?? '0'))
      .filter((v) => v > 0);

    const sorted = [...results].sort(
      (a, b) =>
        new Date(b.races?.race_date ?? 0).getTime() - new Date(a.races?.race_date ?? 0).getTime(),
    );

    const avgVelocity =
      velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : null;

    return {
      matricule: p.matricule,
      displayMatricule: formatMatricule(p.matricule),
      name: p.name,
      isFemale: p.is_female,
      yearOfBirth: p.year_of_birth,
      color: p.color,
      loftId: p.loft_id,
      raceCount: results.length,
      bestPlace: results.length > 0 ? Math.min(...results.map((r) => r.place)) : null,
      avgVelocity,
      lastRaceName: sorted[0]?.races?.release_point ?? null,
      lastRaceDate: sorted[0]?.races?.race_date ?? null,
      isChampion: results.some((r) => r.place === 1),
    };
  });

  const stats: PigeonnierStats = {
    total: pigeons.length,
    champions: pigeons.filter((p) => p.isChampion).length,
    avgVelocity:
      pigeons.length > 0
        ? (pigeons.reduce((s, p) => s + (p.avgVelocity ?? 0), 0) / pigeons.length).toFixed(0)
        : '—',
    totalRaces: pigeons.reduce((s, p) => s + p.raceCount, 0),
  };

  const displayName = user.email?.split('@')[0] ?? 'Éleveur';

  // Dernier concours réel (from DB)
  const allResults = rawPigeons.flatMap(
    (p) =>
      (p.pigeon_results ?? []) as unknown as Array<{
        place: number;
        velocity_m_per_min: string | null;
        races: {
          race_date: string;
          release_point: string;
          distance_min_km: number | null;
          category: string;
        } | null;
      }>,
  );

  const lastRaceEntry = allResults
    .filter((r) => r.races)
    .sort(
      (a, b) =>
        new Date(b.races?.race_date ?? 0).getTime() - new Date(a.races?.race_date ?? 0).getTime(),
    )[0];

  const lastRace = lastRaceEntry?.races
    ? {
        name: lastRaceEntry.races.release_point,
        date: new Date(lastRaceEntry.races.race_date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
        distanceKm: lastRaceEntry.races.distance_min_km,
        category: lastRaceEntry.races.category,
      }
    : null;

  return (
    <PigeonnierView
      lofts={lofts}
      pigeons={pigeons}
      stats={stats}
      justOnboarded={welcome === '1'}
      userName={displayName}
      lastRace={lastRace}
    />
  );
}
