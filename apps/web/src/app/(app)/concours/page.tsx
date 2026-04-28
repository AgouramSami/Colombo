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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const displayName = user.email?.split('@')[0] ?? 'Éleveur';

  // Matricules de l'utilisateur
  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null);

  const loftIds = lofts?.map((l) => l.id) ?? [];

  const { data: userPigeons } = loftIds.length
    ? await supabase
        .from('pigeons')
        .select('matricule')
        .in('loft_id', loftIds)
        .is('deleted_at', null)
    : { data: [] };

  const userMatricules = (userPigeons ?? []).map((p) => p.matricule);

  // Toutes les courses avec le club
  const { data: rawRaces } = await supabase
    .from('races')
    .select(
      'id, race_date, release_point, category, age_class, pigeons_released, distance_min_km, distance_max_km, clubs(name)',
    )
    .order('race_date', { ascending: false });

  // Résultats de l'utilisateur par course
  const raceIds = (rawRaces ?? []).map((r) => r.id);
  const { data: userResults } =
    raceIds.length && userMatricules.length
      ? await supabase
          .from('pigeon_results')
          .select('race_id, place, pigeon_matricule, velocity_m_per_min')
          .in('race_id', raceIds)
          .in('pigeon_matricule', userMatricules)
      : { data: [] };

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

  const races: Race[] = (rawRaces ?? []).map((r) => {
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
