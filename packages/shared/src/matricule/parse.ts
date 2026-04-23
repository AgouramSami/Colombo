import { type Matricule, MatriculeSchema } from './schema.js';

const PARSE_RE = /^([A-Z]{2})[\s/._-]*(\d{4,7})[\s/._-]*(\d{2})[\s/._-]*(F)?$/;

export function parseMatricule(input: string): Matricule {
  const upper = input.trim().toUpperCase();
  const match = upper.match(PARSE_RE);
  if (match) {
    const [, country, number, year, female] = match;
    return MatriculeSchema.parse(
      `${country}-${number}-${year}${female ? '-F' : ''}`,
    );
  }
  return MatriculeSchema.parse(upper);
}
