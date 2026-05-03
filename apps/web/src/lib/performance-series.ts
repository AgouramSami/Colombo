/**
 * Séries mensuelles pour les graphiques « performance ».
 * Les dates utilisées sont celles du concours (races.race_date), pas la date d’import.
 */

import { singleRace } from '@/lib/pigeon-result-race';

export type ResultWithRaceDate = {
  place: number;
  races?: unknown;
};

/** Buckets par mois calendaire (YYYY-MM), puis les `maxMonths` derniers mois ayant au moins un résultat. */
export function buildMonthlyPerformanceSeries(
  periodResults: ResultWithRaceDate[],
  maxMonths: number,
): { label: string; value: number }[] {
  const buckets = new Map<string, { total: number; top10: number }>();
  for (const r of periodResults) {
    const rd = singleRace(r.races)?.race_date;
    if (!rd) continue;
    const key = rd.slice(0, 7);
    const cur = buckets.get(key) ?? { total: 0, top10: 0 };
    cur.total += 1;
    if (r.place > 0 && r.place <= 10) cur.top10 += 1;
    buckets.set(key, cur);
  }
  const sortedKeys = [...buckets.keys()].sort();
  const keys = sortedKeys.slice(-Math.max(1, maxMonths));
  return keys.map((monthKey) => {
    const [y, m] = monthKey.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const raw = date.toLocaleDateString('fr-FR', { month: 'short' });
    const label = raw[0]?.toUpperCase() + raw.slice(1);
    const { total, top10 } = buckets.get(monthKey)!;
    const value = total > 0 ? Math.round((top10 / total) * 100) : 0;
    return { label, value };
  });
}

/** Nombre de résultats par mois (mêmes mois que la série top 10 % si mêmes entrées et maxMonths). */
export function buildMonthlyVolumeSeries(
  periodResults: ResultWithRaceDate[],
  maxMonths: number,
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();
  for (const r of periodResults) {
    const rd = singleRace(r.races)?.race_date;
    if (!rd) continue;
    const key = rd.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const sortedKeys = [...buckets.keys()].sort();
  const keys = sortedKeys.slice(-Math.max(1, maxMonths));
  return keys.map((monthKey) => {
    const [y, m] = monthKey.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const raw = date.toLocaleDateString('fr-FR', { month: 'short' });
    const label = raw[0]?.toUpperCase() + raw.slice(1);
    return { label, value: buckets.get(monthKey) ?? 0 };
  });
}
