import type { SupabaseClient } from '@supabase/supabase-js';

export type MyPigeonRow = { matricule: string; name: string | null };

export type PigeonResultRow = {
  id: string;
  place: number;
  n_engagement: number | null;
  velocity_m_per_min: string | null;
  pigeon_matricule: string;
  /** Relation Supabase : objet ou tableau selon la forme de la requête */
  races?: unknown;
};

const PAGE_SIZE = 1000;
const MATRICULES_CHUNK_SIZE = 500;

/** Charge tous les pigeon_results de l’utilisateur connecté (pagination interne). */
export async function loadUserPigeonResults(
  supabase: SupabaseClient,
): Promise<{ myPigeons: MyPigeonRow[]; allResults: PigeonResultRow[] }> {
  const { data: lofts } = await supabase.from('lofts').select('id').is('deleted_at', null);
  const loftIds = (lofts ?? []).map((l) => l.id);

  const myPigeons: MyPigeonRow[] = [];
  for (let offset = 0; loftIds.length; offset += PAGE_SIZE) {
    const { data } = await supabase
      .from('pigeons')
      .select('matricule, name')
      .in('loft_id', loftIds)
      .is('deleted_at', null)
      .order('matricule', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    myPigeons.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const myMatricules = new Set(myPigeons.map((p) => p.matricule));
  const myMatriculesArray = [...myMatricules];

  const allResults: PigeonResultRow[] = [];
  for (let i = 0; i < myMatriculesArray.length; i += MATRICULES_CHUNK_SIZE) {
    const chunk = myMatriculesArray.slice(i, i + MATRICULES_CHUNK_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data } = await supabase
        .from('pigeon_results')
        .select(
          'id, place, n_engagement, velocity_m_per_min, pigeon_matricule, races(id, race_date, release_point, category, age_class)',
        )
        .in('pigeon_matricule', chunk)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      allResults.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }

  return { myPigeons, allResults };
}
