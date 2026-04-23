import type { Matricule } from './schema.js';

export function isFemale(m: Matricule): boolean {
  return m.endsWith('-F');
}

export function birthYear(m: Matricule): number {
  const yy = Number(m.split('-')[2]);
  return yy <= 29 ? 2000 + yy : 1900 + yy;
}

export function countryIso(m: Matricule): string {
  return m.split('-')[0]!;
}
