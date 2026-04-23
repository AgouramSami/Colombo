import type { Matricule } from './schema';

export function isFemale(m: Matricule): boolean {
  return m.endsWith('-F');
}

export function countryIso(m: Matricule): string {
  return m.slice(0, 2);
}

export function birthYear(m: Matricule): number {
  const base = isFemale(m) ? m.slice(0, -2) : m;
  const yy = Number(base.slice(-2));
  return yy <= 29 ? 2000 + yy : 1900 + yy;
}
