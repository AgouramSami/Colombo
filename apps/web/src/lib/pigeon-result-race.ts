/** Ligne `races` jointe à `pigeon_results` (objet ou tableau selon Supabase). */
export type EmbeddedRace = {
  id?: string;
  race_date: string;
  release_point: string;
  category: string;
  age_class: 'vieux' | 'jeune';
};

export function singleRace(races: unknown): EmbeddedRace | null {
  if (!races) return null;
  if (Array.isArray(races)) return (races[0] ?? null) as EmbeddedRace | null;
  return races as EmbeddedRace;
}
