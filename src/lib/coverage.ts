/**
 * Offensive coverage (T4.3) — pure layer behind the coverage panel.
 *
 * Answers one question per defending type: can the team hit it for *at least
 * 2×* with the moves actually picked in the drawer? Everything is derived from
 * the game's OWN `typeChart` (Red/Blue keeps its Gen-I quirks) and the pruned
 * move dictionary, so a move the game does not have can never show up.
 *
 * Only damaging moves with a real base power count: status moves deal no
 * damage and fixed-damage moves (Seismic Toss, Dragon Rage, …) ignore the type
 * chart for damage, so including them would inflate coverage. That exclusion
 * is surfaced in the panel copy.
 */
import { TYPE_ORDER, type TypeSlug } from './analysis';
import type { LocalizedText, MoveInfo, TypeChart } from './data-schema';

/** One team member reduced to what offense needs: the picked move ids. */
export interface CoverageMemberInput {
  id: number;
  name: LocalizedText;
  /** picked move ids in slot order (0-4) */
  moves: readonly number[];
}

export interface CoverageMove {
  /** national move id */
  id: number;
  name: LocalizedText;
  /** attacking type slug */
  type: string;
  power: number;
}

export interface MemberCoverage {
  id: number;
  name: LocalizedText;
  /** damaging moves that can actually be counted */
  moves: CoverageMove[];
  /** defending type -> best multiplier among this member's moves (absent = no usable move) */
  best: Record<string, number>;
  /** defending type -> first move reaching that best multiplier */
  bestMove: Record<string, CoverageMove>;
}

export interface CoverageProfile {
  /** per-game defending types in canonical order */
  defenders: string[];
  members: MemberCoverage[];
  /** defenders no member reaches 2× against */
  gaps: string[];
  /** defenders at least one member reaches 2× against */
  covered: string[];
  /** true when no member has a damaging move with base power */
  empty: boolean;
}

/**
 * Defending types the game's chart actually knows, canonical order first.
 * Derived from the chart's inner keys so a per-game table can never invent a
 * type: Gen I has no Dark/Steel/Fairy columns.
 */
export function defenderTypes(chart: TypeChart): string[] {
  const keys = new Set<string>();
  for (const row of Object.values(chart)) {
    for (const def of Object.keys(row)) keys.add(def);
  }
  const known = TYPE_ORDER.filter((type) => keys.has(type));
  const extra = [...keys].filter((type) => !TYPE_ORDER.includes(type as TypeSlug)).sort();
  return [...known, ...extra];
}

/** Picked move ids -> the moves that can meaningfully hit for type damage. */
export function coverageMoves(
  moveIds: readonly number[],
  moveDex: Record<string, MoveInfo>,
): CoverageMove[] {
  const moves: CoverageMove[] = [];
  for (const id of moveIds) {
    const info = moveDex[String(id)];
    // data:check guarantees refs; stay safe on older payloads
    if (!info) continue;
    if (info.damageClass === 'status' || info.power == null) continue;
    moves.push({ id, name: info.name, type: info.type, power: info.power });
  }
  return moves;
}

/**
 * Best multiplier one member's moves reach against a single type, plus the
 * first move that gets there (slot order breaks ties, matching the drawer).
 */
function bestAgainst(
  chart: TypeChart,
  moves: CoverageMove[],
  defender: string,
): { value: number; move: CoverageMove } | null {
  let pick: { value: number; move: CoverageMove } | null = null;
  for (const move of moves) {
    const value = chart[move.type]?.[defender] ?? 1;
    if (!pick || value > pick.value) pick = { value, move };
  }
  return pick;
}

export function analyzeCoverage(
  members: CoverageMemberInput[],
  chart: TypeChart,
  moveDex: Record<string, MoveInfo>,
): CoverageProfile {
  const defenders = defenderTypes(chart);
  const profiles: MemberCoverage[] = members.map((member) => {
    const moves = coverageMoves(member.moves, moveDex);
    const best: Record<string, number> = {};
    const bestMove: Record<string, CoverageMove> = {};
    for (const defender of defenders) {
      const pick = bestAgainst(chart, moves, defender);
      if (!pick) continue;
      best[defender] = pick.value;
      bestMove[defender] = pick.move;
    }
    return { id: member.id, name: member.name, moves, best, bestMove };
  });

  const covered = defenders.filter((defender) =>
    profiles.some((member) => (member.best[defender] ?? 0) >= 2),
  );
  const gaps = defenders.filter((defender) => !covered.includes(defender));
  const empty = profiles.every((member) => member.moves.length === 0);

  return { defenders, members: profiles, gaps, covered, empty };
}
