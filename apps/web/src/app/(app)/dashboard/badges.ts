export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeTone = 'default' | 'accent' | 'gold';

export type BadgeDefinition = {
  id: string;
  name: string;
  rarity: BadgeRarity;
  tone: BadgeTone;
  icon: string;
  points: number;
  hint: string;
};

export type ObjectiveDefinition = {
  id: string;
  label: string;
  target: number;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-podium',
    name: 'Premier Podium',
    rarity: 'common',
    tone: 'gold',
    icon: 'badge-podium',
    points: 50,
    hint: 'Obtenir au moins une place 1-2-3',
  },
  {
    id: 'season-regular',
    name: 'Régularité Saison',
    rarity: 'rare',
    tone: 'accent',
    icon: 'badge-regularity',
    points: 80,
    hint: 'Participer à 5 concours sur la période',
  },
  {
    id: 'speed-master',
    name: 'Maître Vitesse',
    rarity: 'rare',
    tone: 'default',
    icon: 'badge-speed',
    points: 100,
    hint: 'Atteindre 1300 m/min de moyenne',
  },
  {
    id: 'top-10-hunter',
    name: 'Chasseur Top 10',
    rarity: 'epic',
    tone: 'accent',
    icon: 'badge-top10',
    points: 140,
    hint: 'Cumuler 5 résultats dans le top 10',
  },
  {
    id: 'consistency-pro',
    name: 'Pro de la Constance',
    rarity: 'epic',
    tone: 'default',
    icon: 'badge-consistency',
    points: 140,
    hint: 'Atteindre 35% de taux de prix',
  },
  {
    id: 'legendary-year',
    name: 'Légende (placeholder)',
    rarity: 'legendary',
    tone: 'gold',
    icon: 'badge-legendary',
    points: 250,
    hint: 'Badge placeholder à designer',
  },
];

export const OBJECTIVE_DEFINITIONS: ObjectiveDefinition[] = [
  { id: 'goal-races', label: 'Disputer 8 concours', target: 8 },
  { id: 'goal-top10', label: 'Atteindre 10 top 10', target: 10 },
  { id: 'goal-podiums', label: 'Obtenir 3 podiums', target: 3 },
];

export function rarityLabel(rarity: BadgeRarity): string {
  if (rarity === 'common') return 'Commun';
  if (rarity === 'rare') return 'Rare';
  if (rarity === 'epic') return 'Épique';
  return 'Légendaire';
}

