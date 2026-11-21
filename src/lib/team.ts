/**
 * Team of 6 (T2.8). Pure logic first (plain functions, unit-testable), then a
 * thin Zustand store with localStorage persistence. Teams are per game;
 * entries are national dex ids. The deployed site never calls PokeAPI —
 * rendering resolves names/sprites from the already-fetched game dataset.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_MOVES,
  memberMoves,
  toggleMoveSlot,
  withMemberMoves,
  type MoveToggleResult,
  type MovesByGame,
} from './moves';

export const TEAM_SIZE = 6;

/**
 * Stable empty array for selectors: `s.teams[id] ?? []` would return a new
 * reference on every snapshot read and trip React's getSnapshot check.
 */
export const NO_TEAM: number[] = [];

/** hotkey-free alias: what the team map looks like */
export type TeamsByGame = Record<string, number[]>;

export type AddResult = 'added' | 'removed' | 'replaced-oldest' | 'already-in-team';

/**
 * Toggle the species in its game's team:
 * - if present -> remove ('removed')
 * - else with space -> append ('added')
 * - else if full -> replace the oldest (first) entry ('replaced-oldest')
 */
export function toggleMember(teams: TeamsByGame, gameId: string, id: number): TeamsByGame {
  const team = teams[gameId] ?? [];
  const next: TeamsByGame = { ...teams };
  if (team.includes(id)) {
    if (team.length === 1) delete next[gameId];
    else next[gameId] = team.filter((x) => x !== id);
    return next;
  }
  if (team.length >= TEAM_SIZE) {
    next[gameId] = [...team.slice(1), id];
    return next;
  }
  next[gameId] = [...team, id];
  return next;
}

/** remove at index (slot X button) */
export function removeAt(teams: TeamsByGame, gameId: string, index: number): TeamsByGame {
  const team = teams[gameId] ?? [];
  const next: TeamsByGame = { ...teams };
  const rest = team.filter((_, i) => i !== index);
  if (rest.length === 0) delete next[gameId];
  else next[gameId] = rest;
  return next;
}

/**
 * Put a member back at a slot (undo after a removal). No-op when the team is
 * full or the species is already in it; an index past the end appends.
 */
export function insertAt(
  teams: TeamsByGame,
  gameId: string,
  index: number,
  id: number,
): TeamsByGame {
  const team = teams[gameId] ?? [];
  if (team.length >= TEAM_SIZE || team.includes(id)) return teams;
  const at = Math.max(0, Math.min(index, team.length));
  return { ...teams, [gameId]: [...team.slice(0, at), id, ...team.slice(at)] };
}

/**
 * Swap the member at a slot for another species (the player chose whom to
 * replace, UX-02). No-op for an empty/out-of-range slot or a species already
 * in the team.
 */
export function replaceAt(
  teams: TeamsByGame,
  gameId: string,
  index: number,
  id: number,
): TeamsByGame {
  const team = teams[gameId] ?? [];
  if (index < 0 || index >= team.length || team.includes(id)) return teams;
  return { ...teams, [gameId]: team.map((x, i) => (i === index ? id : x)) };
}

/* ---------- Zustand store (client-only island) ---------- */

/** what a shared link (or an incoming `?t=`) brings per team member */
export interface SeedMember {
  id: number;
  moves?: number[];
}

interface TeamStore {
  teams: TeamsByGame;
  /** game id -> pokemon id -> selected move ids (T4.2) */
  moves: MovesByGame;
  toggle: (gameId: string, id: number) => AddResult;
  remove: (gameId: string, index: number) => void;
  /** put a removed member back at its slot (undo) */
  insert: (gameId: string, index: number, id: number) => void;
  /** replace the member at a slot (its picked moves are cleared) */
  replace: (gameId: string, index: number, id: number) => void;
  /** seed a game's team (and its move slots) from a share URL; caps at TEAM_SIZE */
  seed: (gameId: string, members: SeedMember[]) => void;
  /** toggle one move in a team member's four slots (T4.2) */
  toggleMove: (gameId: string, pokemonId: number, moveId: number) => MoveToggleResult;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teams: {},
      moves: {},
      toggle: (gameId: string, id: number) => {
        const team = get().teams[gameId] ?? [];
        const result: AddResult = team.includes(id)
          ? 'removed'
          : team.length >= TEAM_SIZE
            ? 'replaced-oldest'
            : 'added';
        set({ teams: toggleMember(get().teams, gameId, id) });
        return result;
      },
      remove: (gameId: string, index: number) => {
        set({ teams: removeAt(get().teams, gameId, index) });
      },
      insert: (gameId: string, index: number, id: number) => {
        set({ teams: insertAt(get().teams, gameId, index, id) });
      },
      replace: (gameId: string, index: number, id: number) => {
        const { teams, moves } = get();
        const out = (teams[gameId] ?? [])[index];
        const next = replaceAt(teams, gameId, index, id);
        if (next === teams || out === undefined) return;
        set({ teams: next, moves: withMemberMoves(moves, gameId, out, []) });
      },
      seed: (gameId: string, members: SeedMember[]) => {
        const clean = members
          .filter((member) => Number.isInteger(member.id) && member.id > 0)
          .slice(0, TEAM_SIZE);
        const moves = { ...get().moves };
        const gameSlots: Record<string, number[]> = {};
        for (const member of clean) {
          const slots = (member.moves ?? []).filter(
            (moveId) => Number.isInteger(moveId) && moveId > 0,
          );
          if (slots.length === 0) continue;
          gameSlots[String(member.id)] = [...new Set(slots)].slice(0, MAX_MOVES);
        }
        if (Object.keys(gameSlots).length === 0) delete moves[gameId];
        else moves[gameId] = gameSlots;
        set({ teams: { ...get().teams, [gameId]: clean.map((member) => member.id) }, moves });
      },
      toggleMove: (gameId: string, pokemonId: number, moveId: number) => {
        const { slots, result } = toggleMoveSlot(
          memberMoves(get().moves, gameId, pokemonId),
          moveId,
        );
        set({ moves: withMemberMoves(get().moves, gameId, pokemonId, slots) });
        return result;
      },
    }),
    { name: 'dexforge-team', version: 1 },
  ),
);
