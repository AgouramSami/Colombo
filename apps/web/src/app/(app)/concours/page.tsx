import { time } from '@/lib/perf';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConcoursView } from './concours-view';

export type Race = {
  id: string;
  race_date: string;
  release_point: string;
  category: string;
  age_class: string;
  pigeons_released: number | null;
  distance_min_km: number | null;
  distance_max_km: number | null;
  club_name: string;
  your_engaged: number;
  your_classed: number;
  your_best_place: number | null;
  your_avg_velocity: number | null;
  your_velocities: number[];
};

export default async function ConcoursPage() {
  return time('/concours total', () => loadConcoursPage());
}

async function loadConcoursPage() {
  const supabase = await createClient();
  const user = await time('auth.getUser', async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  });
  if (!user) redirect('/login');

  const displayName = user.email?.split('@')[0] ?? 'Éleveur';

  const lofts = await time('  lofts.select', async () => {
    const { data } = await supabase.from('lofts').select('id').is('deleted_at', null);
    return data ?? [];
  });

  const loftIds = lofts.map((l) => l.id);

  type UserPigeonRow = { matricule: string };
  const PAGE_SIZE = 1000;
  const userPigeons: UserPigeonRow[] = [];
  let pigeonsChunkIdx = 0;
  for (let offset = 0; loftIds.length; offset += PAGE_SIZE) {
    const data = await time(`  pigeons.select chunk ${pigeonsChunkIdx}`, async () => {
      const res = await supabase
        .from('pigeons')
        .select('matricule')
        .in('loft_id', loftIds)
        .is('deleted_at', null)
        .order('matricule', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      return res.data;
    });
    userPigeons.push(...(data ?? []));
    pigeonsChunkIdx += 1;
    if (!data || data.length < PAGE_SIZE) break;
  }

  const userMatricules = userPigeons.map((p) => p.matricule);

  // Résultats de l'utilisateur (filtré uniquement par matricule pour éviter URL >8KB)
  type UserResultRow = {
    id: string;
    race_id: string;
    place: number;
    pigeon_matricule: string;
    velocity_m_per_min: string | null;
  };

  const userResults: UserResultRow[] = [];
  const MATRICULES_CHUNK_SIZE = 500;
  let resultsChunkIdx = 0;
  for (let i = 0; i < userMatricules.length; i += MATRICULES_CHUNK_SIZE) {
    const chunk = userMatricules.slice(i, i + MATRICULES_CHUNK_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const data = await time(`  pigeon_results.select chunk ${resultsChunkIdx}`, async () => {
        const res = await supabase
          .from('pigeon_results')
          .select('id, race_id, place, pigeon_matricule, velocity_m_per_min')
          .in('pigeon_matricule', chunk)
          .order('id', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        return res.data;
      });
      userResults.push(...(data ?? []));
      resultsChunkIdx += 1;
      if (!data || data.length < PAGE_SIZE) break;
    }
  }

  // Aggreger par course
  const resultsByRace = new Map<string, { places: number[]; velocities: number[] }>();
  for (const r of userResults ?? []) {
    const existing = resultsByRace.get(r.race_id);
    const vel = r.velocity_m_per_min ? Number.parseFloat(r.velocity_m_per_min) : null;
    if (existing) {
      existing.places.push(r.place);
      if (vel && vel > 0) existing.velocities.push(vel);
    } else {
      resultsByRace.set(r.race_id, {
        places: [r.place],
        velocities: vel && vel > 0 ? [vel] : [],
      });
    }
  }

  // Charger uniquement les concours où l'utilisateur a participé
  type RawRaceRow = {
    id: string;
    race_date: string;
    release_point: string;
    category: string;
    age_class: string;
    pigeons_released: number | null;
    distance_min_km: number | null;
    distance_max_km: number | null;
    clubs?: unknown;
  };

  const participatingRaceIds = [...resultsByRace.keys()];
  const rawRaces: RawRaceRow[] = [];
  const RACE_IDS_CHUNK_SIZE = 500;
  let racesChunkIdx = 0;
  for (let i = 0; i < participatingRaceIds.length; i += RACE_IDS_CHUNK_SIZE) {
    const idChunk = participatingRaceIds.slice(i, i + RACE_IDS_CHUNK_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const data = await time(`  races.select chunk ${racesChunkIdx}`, async () => {
        const res = await supabase
          .from('races')
          .select(
            'id, race_date, release_point, category, age_class, pigeons_released, distance_min_km, distance_max_km, clubs(name)',
          )
          .in('id', idChunk)
          .order('race_date', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        return res.data;
      });
      rawRaces.push(...(data ?? []));
      racesChunkIdx += 1;
      if (!data || data.length < PAGE_SIZE) break;
    }
  }
  // biome-ignore lint/suspicious/noConsoleLog: instrumentation
  console.log(
    `[perf:info] /concours volume — pigeons:${userPigeons.length} results:${userResults.length} races:${rawRaces.length}`,
  );

  // Garantir un ordre global même si les races viennent de plusieurs chunks.
  rawRaces.sort((a, b) => {
    const da = new Date(a.race_date).getTime();
    const db = new Date(b.race_date).getTime();
    return db !== da ? db - da : b.id.localeCompare(a.id);
  });

  const races: Race[] = rawRaces.map((r) => {
    const club = r.clubs as unknown as { name: string } | null;
    const raceResults = resultsByRace.get(r.id);
    const places = raceResults?.places ?? [];
    const velocities = raceResults?.velocities ?? [];
    const avgVelocity =
      velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : null;
    return {
      id: r.id,
      race_date: r.race_date,
      release_point: r.release_point,
      category: r.category,
      age_class: r.age_class,
      pigeons_released: r.pigeons_released,
      distance_min_km: r.distance_min_km,
      distance_max_km: r.distance_max_km,
      club_name: club?.name ?? '—',
      your_engaged: places.length,
      your_classed: places.filter((p) => p > 0).length,
      your_best_place: places.length > 0 ? Math.min(...places) : null,
      your_avg_velocity: avgVelocity,
      your_velocities: velocities,
    };
  });

  return <ConcoursView userName={displayName} races={races} />;
}
