import type { Matricule } from './schema';

export function formatMatricule(m: Matricule): string {
  return m.replaceAll('-', ' ');
}
