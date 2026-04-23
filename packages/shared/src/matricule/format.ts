import type { Matricule } from './schema.js';

export function formatMatricule(m: Matricule): string {
  return m.replaceAll('-', ' ');
}
