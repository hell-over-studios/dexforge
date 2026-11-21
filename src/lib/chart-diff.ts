/**
 * How one generation's type chart differs from another (UX-13, #89). Used by
 * the "Cómo calculamos" page so the rules it lists come from the generated
 * datasets, not from hand-written prose.
 */
import type { TypeChart } from './data-schema';

export interface ChartDiff {
  attack: string;
  defend: string;
  /** multiplier in the older chart */
  then: number;
  /** multiplier in the reference (newer) chart */
  now: number;
}

/** cells present in both charts whose multiplier differs, in the older chart's order */
export function chartDiffs(older: TypeChart, newer: TypeChart): ChartDiff[] {
  const out: ChartDiff[] = [];
  for (const attack of Object.keys(older)) {
    if (!newer[attack]) continue;
    for (const defend of Object.keys(older)) {
      if (!(defend in newer)) continue;
      const then = older[attack]?.[defend] ?? 1;
      const now = newer[attack]?.[defend] ?? 1;
      if (then !== now) out.push({ attack, defend, then, now });
    }
  }
  return out;
}

/** attacking types in the newer chart that the older one does not have yet */
export function missingTypes(older: TypeChart, newer: TypeChart): string[] {
  return Object.keys(newer).filter((t) => !(t in older));
}

export const formatMultiplier = (m: number): string =>
  m === 0.5 ? '×½' : m === 0.25 ? '×¼' : `×${m}`;
