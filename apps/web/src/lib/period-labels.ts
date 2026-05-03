/** Année civile : du 1ᵉʳ janvier au 31 décembre (les stats s’arrêtent à aujourd’hui pour l’année en cours). */

export function calendarYearPeriodLabel(year: number): string {
  return `Année ${year} (janv. – déc.)`;
}
