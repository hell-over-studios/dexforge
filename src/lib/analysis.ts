/**
 * Team-analysis data layer (T3.1, v0.3.0): game-accurate defensive profile.
 * Pure functions over each game's OWN `typeChart` (never a modern static
 * chart): Red/Blue has its 15x17 Gen-I quirks, Gold/Silver and Emerald gain
 * Steel/Dark. The UI consumes this module only.
 */
import type { GameData, LocalizedText, TypeChart } from './data-schema';

/** canonical attacker ordering for table rows (reduced to per-game keys by consumers) */
export const TYPE_ORDER = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type TypeSlug = (typeof TYPE_ORDER)[number];

export interface TeamMemberInput {
  id: number;
  name: LocalizedText;
  /** game-accurate type slugs (1-2 entries) */
  types: string[];
}

/** multiplier of `attack` against a member with `defendTypes` (product, capped at 4x) */
export function effectiveness(chart: TypeChart, attack: string, defendTypes: string[]): number {
  let m = 1;
  for (const def of defendTypes) {
    m *= chart[attack]?.[def] ?? 1;
    if (m === 0) break;
  }
  return Math.min(m, 4);
}

export interface MemberProfile {
  id: number;
  name: LocalizedText;
  types: string[];
  /** attacking-type slug -> multiplier against THIS member (rows: per-game attacker set) */
  multipliers: Record<string, number>;
}

export interface PerAttack {
  attack: TypeSlug | string;
  /** multiplier per team member, same order as @see TeamProfile.members */
  perMember: number[];
}

export interface TeamProfile {
  /** attacker rows in canonical order, but only the per-game attacking types */
  attacks: string[];
  members: MemberProfile[];
  rows: PerAttack[];
}

/**
 * the per-game attacker set: every attacking type the game's chart knows
 * (canonical ordering first, then anything unexpected at the end)
 */
export function attackerTypes(chart: TypeChart): string[] {
  const keys = new Set(Object.keys(chart));
  const known = TYPE_ORDER.filter((t) => keys.has(t));
  const extra = [...keys].filter((t) => !TYPE_ORDER.includes(t as TypeSlug)).sort();
  return [...known, ...extra];
}

export function analyzeTeam(members: TeamMemberInput[], chart: TypeChart): TeamProfile {
  const attacks = attackerTypes(chart);
  const profiles: MemberProfile[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    types: m.types,
    multipliers: Object.fromEntries(attacks.map((a) => [a, effectiveness(chart, a, m.types)])),
  }));
  const rows: PerAttack[] = attacks.map((a) => ({
    attack: a,
    perMember: profiles.map((p) => p.multipliers[a]),
  }));
  return { attacks, members: profiles, rows };
}

/** convenience wrapper: build the profile straight from emitted GameData */
export function analyzeFromData(
  members: TeamMemberInput[],
  data: Pick<GameData, 'typeChart'>,
): TeamProfile {
  return analyzeTeam(members, data.typeChart);
}
