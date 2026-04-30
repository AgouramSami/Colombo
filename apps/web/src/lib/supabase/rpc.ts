import { z } from 'zod';

export const PigeonSearchResultSchema = z.object({
  pigeon_matricule: z.string(),
  amateur_display_name: z.string(),
  last_seen_at: z.string(),
  race_count: z.coerce.number(),
});

export type PigeonSearchResult = z.infer<typeof PigeonSearchResultSchema>;
