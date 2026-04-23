import { z } from 'zod';

export const MatriculeSchema = z.string().regex(
  /^[A-Z]{2}-\d{4,7}-\d{2}(-F)?$/,
  'Matricule invalide. Format attendu : FR-123456-26 ou FR-123456-26-F',
);
export type Matricule = z.infer<typeof MatriculeSchema>;
