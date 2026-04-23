import { type Matricule, MatriculeSchema } from './schema';

export function parseMatricule(input: string): Matricule {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s/._]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^([A-Z]{2})(\d)/, '$1-$2')
    .replace(/(\d)F$/, '$1-F');
  return MatriculeSchema.parse(cleaned);
}
