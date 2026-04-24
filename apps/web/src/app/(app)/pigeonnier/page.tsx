import { createClient } from '@/lib/supabase/server';
import { formatMatricule } from '@colombo/shared';
import { redirect } from 'next/navigation';
import { PigeonnierView } from './pigeonnier-view';

export type PigeonRow = {
  matricule: string;
  displayMatricule: string;
  name: string | null;
  isFemale: boolean;
  yearOfBirth: number;
  color: string | null;
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

export default async function PigeonnierPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { welcome } = await searchParams;

  const { data: lofts } = await supabase.from('lofts').select('id, name').is('deleted_at', null);

  const loftIds = lofts?.map((l) => l.id) ?? [];
  const loftName = lofts?.[0]?.name ?? 'Mon pigeonnier';

  const { data: rawPigeons } = loftIds.length
    ? await supabase
        .from('pigeons')
        .select(
          'matricule, name, is_female, year_of_birth, color, pigeon_results(place, velocity_m_per_min, races(race_date, release_point))',
        )
        .in('loft_id', loftIds)
        .is('deleted_at', null)
    : { data: [] };

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

  return (
    <PigeonnierView
      loftName={loftName}
      pigeons={pigeons}
      stats={stats}
      justOnboarded={welcome === '1'}
      userName={displayName}
    />
  );
}
