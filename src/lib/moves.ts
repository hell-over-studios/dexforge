/**
 * Move slots (T4.2). Pure, unit-tested helpers shared by the detail-drawer
 * move picker, the team store and the share encoder:
 *
 * - `buildMoveRows` turns a Pokémon's dataset learnset (already version-group
 *   filtered by T4.1) into display rows with method + level, level-up first.
 * - `filterMoveRows` powers the text/type filter without touching React.
 * - `toggleMoveSlot` / `memberMoves` / `withMemberMoves` keep the four slots
 *   immutable and prune empty branches from the persisted move map.
 *
 * Move ids are national ids; the dataset's move dictionary is keyed by their
 * string form. No network: everything comes from the loaded game dataset.
 */
import type { GamePokemon, MoveInfo, MoveMethod } from './data-schema';
import type { Lang } from './i18n';

/** A Pokémon may know four moves at once (all supported generations). */
export const MAX_MOVES = 4;

/** Display order: level-up reads like the in-game move list. */
const METHOD_ORDER: Record<MoveMethod, number> = {
  'level-up': 0,
  machine: 1,
  tutor: 2,
  egg: 3,
};

export interface MoveRow {
  /** national move id */
  id: number;
  info: MoveInfo;
  method: MoveMethod;
  /** only set for level-up rows */
  level: number | null;
}

/** Rows for one Pokémon, ordered level-up (by level) → machine → tutor → egg. */
export function buildMoveRows(mon: GamePokemon, moves: Record<string, MoveInfo>): MoveRow[] {
  const rows: MoveRow[] = [];
  for (const [id, method, level] of mon.moves) {
    const info = moves[String(id)];
    if (!info) continue; // data:check guarantees refs; stay safe on old payloads
    rows.push({ id, info, method, level });
  }
  return rows.sort(
    (a, b) =>
      METHOD_ORDER[a.method] - METHOD_ORDER[b.method] ||
      (a.level ?? Number.POSITIVE_INFINITY) - (b.level ?? Number.POSITIVE_INFINITY) ||
      a.info.slug.localeCompare(b.info.slug),
  );
}

/** Accent/case-insensitive needle so "lanzallamas" finds "Lanzallamas". */
const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export interface MoveFilter {
  query?: string;
  /** attacking type slug; null/undefined means every type */
  type?: string | null;
  lang: Lang;
}

export function filterMoveRows(rows: MoveRow[], { query, type, lang }: MoveFilter): MoveRow[] {
  const needle = normalize((query ?? '').trim());
  return rows.filter(
    (row) =>
      (!type || row.info.type === type) &&
      (!needle ||
        normalize(row.info.name[lang]).includes(needle) ||
        normalize(row.info.slug).includes(needle)),
  );
}

/** Types present in a learnset, sorted by slug (the UI resolves ES/EN labels). */
export function moveTypes(rows: MoveRow[]): string[] {
  return [...new Set(rows.map((row) => row.info.type))].sort();
}

export type MoveToggleResult = 'added' | 'removed' | 'replaced-oldest';

/**
 * Toggle one move in a four-slot list, order-preserving:
 * - already selected → remove it
 * - a free slot → append it
 * - full → drop the first (oldest) pick and append the new one
 */
export function toggleMoveSlot(
  slots: readonly number[],
  moveId: number,
): { slots: number[]; result: MoveToggleResult } {
  const clean = slots.slice(0, MAX_MOVES);
  if (clean.includes(moveId)) {
    return { slots: clean.filter((id) => id !== moveId), result: 'removed' };
  }
  if (clean.length >= MAX_MOVES) {
    return { slots: [...clean.slice(1), moveId], result: 'replaced-oldest' };
  }
  return { slots: [...clean, moveId], result: 'added' };
}

/** Pokémon id (as string) -> selected move ids, for one game. */
export type MoveSlots = Record<string, number[]>;
/** game id -> member move slots. */
export type MovesByGame = Record<string, MoveSlots>;

/**
 * Stable empties for zustand selectors — a fresh `{}`/`[]` on every snapshot
 * read would trip React's getSnapshot check.
 */
export const NO_MEMBER_MOVES: MoveSlots = {};
export const NO_MOVES: number[] = [];

export function memberMoves(moves: MovesByGame, gameId: string, pokemonId: number): number[] {
  return moves[gameId]?.[String(pokemonId)] ?? NO_MOVES;
}

/**
 * Immutable write of one member's slots. Empty slot lists delete the member
 * key, and an empty game map deletes the game key, so persisted state and
 * share payloads stay small.
 */
export function withMemberMoves(
  moves: MovesByGame,
  gameId: string,
  pokemonId: number,
  slots: readonly number[],
): MovesByGame {
  const next: MovesByGame = { ...moves };
  const gameSlots: MoveSlots = { ...(next[gameId] ?? {}) };
  if (slots.length === 0) delete gameSlots[String(pokemonId)];
  else gameSlots[String(pokemonId)] = [...slots];
  if (Object.keys(gameSlots).length === 0) delete next[gameId];
  else next[gameId] = gameSlots;
  return next;
}
