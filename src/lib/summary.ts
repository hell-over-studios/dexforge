/**
 * Suggestions v1 (T3.4, v0.3.0): defensive summary heuristics over a
 * TeamProfile — pure, no fake data, no opponent movesets (that's later). The
 * three notes it can make today:
 *  - sharedWeaknesses: attacking types that hit >= 2 members at 2x or more
 *    (the classic "hole in the team" report).
 *  - immunities: attacking types somebody shrugs off at 0x entirely.
 *  - teamResists: attacking types every single member takes at 0.5x or less
 *    (the team answers them). Notice: 1x everywhere is deliberately NOT a
 *    resist — "neutral everywhere" is not a strength.
 */
import type { TeamProfile } from './analysis';

export interface AttackHit {
  /** attacking type slug */
  attack: string;
  /** member indices (into profile.members) affected */
  indices: number[];
}

export interface DefenseSummary {
  sharedWeaknesses: AttackHit[];
  immunities: AttackHit[];
  teamResists: string[];
}

export function summarizeDefenses(profile: TeamProfile): DefenseSummary {
  const sharedWeaknesses: AttackHit[] = [];
  const immunities: AttackHit[] = [];
  const teamResists: string[] = [];

  for (const row of profile.rows) {
    const weak = row.perMember.map((m, i) => (m >= 2 ? i : -1)).filter((i) => i >= 0);
    if (weak.length >= 2) sharedWeaknesses.push({ attack: row.attack, indices: weak });

    const immun = row.perMember.map((m, i) => (m === 0 ? i : -1)).filter((i) => i >= 0);
    if (immun.length) immunities.push({ attack: row.attack, indices: immun });

    if (row.perMember.length > 0 && row.perMember.every((m) => m <= 0.5)) {
      teamResists.push(row.attack);
    }
  }
  return { sharedWeaknesses, immunities, teamResists };
}
