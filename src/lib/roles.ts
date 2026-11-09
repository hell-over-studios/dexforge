/**
 * Team profile layer (T3.3, v0.3.0): per-stat averages for the 6-member team
 * and a v1 heuristic role per member. Pure and framework-free — the UI island
 * consumes it; the radar is hand-rolled SVG (ADR-005: no chart libraries).
 */
import type { Stats } from './data-schema';

export type Role = 'sweeper' | 'special-sweeper' | 'wall' | 'tank' | 'support';

/** average of each base stat across the members (rounded to nearest whole) */
export function teamAverageStats(statsList: Stats[]): Stats {
  const n = statsList.length;
  const sum: Stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
  if (n === 0) return sum;
  for (const s of statsList) {
    for (const k of Object.keys(sum) as (keyof Stats)[]) sum[k] += s[k];
  }
  for (const k of Object.keys(sum) as (keyof Stats)[]) sum[k] = Math.round(sum[k] / n);
  return sum;
}

/**
 * v1 role heuristic (documented, deliberately simple):
 * - sweeper: fast (speed >= 90) AND strong (attack >= 90)
 * - special-sweeper: fast (speed >= 90) AND strong (specialAttack >= 90)
 * - wall: one armor is very high (>= 110) and the team line holds:
 *          (other armor >= 55 OR hp >= 90) — Skarmory 140/60, Blissey 10/135/hp255
 * - tank: at least one armor >= 85 with hp >= 65 backing it, or both >= 85
 * - support: everything else
 * Speed/aura items, natures and movesets are out of scope until v0.4+.
 */
export function detectRole(stats: Stats): Role {
  const { hp, attack, specialAttack, defense, specialDefense, speed } = stats;
  if (speed >= 90 && attack >= 90) return 'sweeper';
  if (speed >= 90 && specialAttack >= 90) return 'special-sweeper';
  const armors = [[defense, specialDefense] as const, [specialDefense, defense] as const];
  for (const [armor, other] of armors) {
    if (armor >= 110 && (other >= 55 || hp >= 90)) return 'wall';
    if (armor >= 85 && hp >= 65) return 'tank';
  }
  if (defense >= 85 && specialDefense >= 85) return 'tank';
  return 'support';
}

/** short radar axis labels, localized */
export const STAT_SHORT = {
  es: {
    hp: 'PS',
    attack: 'Ata',
    defense: 'Def',
    specialAttack: 'A.Esp',
    specialDefense: 'D.Esp',
    speed: 'Vel',
  },
  en: {
    hp: 'HP',
    attack: 'Atk',
    defense: 'Def',
    specialAttack: 'SpA',
    specialDefense: 'SpD',
    speed: 'Spe',
  },
} as const;

/** radar normalization: base stats are drawn on a 0..150 scale (cap) */
export const RADAR_CAP = 150;

/** vertex dot & polygon points for a 6-axes radar (top axis = hp, clockwise) */
export function radarPolygon(averages: Stats, center: number, radius: number) {
  const keys: (keyof Stats)[] = [
    'hp',
    'attack',
    'defense',
    'specialAttack',
    'specialDefense',
    'speed',
  ];
  const points = keys.map((k, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const value = Math.max(0, Math.min(1, averages[k] / RADAR_CAP));
    const r = radius * value;
    return {
      key: k,
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      /** outer axis endpoint for grid/labels */
      ax: center + radius * Math.cos(angle),
      ay: center + radius * Math.sin(angle),
    };
  });
  return points;
}
