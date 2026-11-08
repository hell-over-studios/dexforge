/**
 * Team of 6 (T2.8). Pure logic first (plain functions, unit-testable), then a
 * thin Zustand store with localStorage persistence. Teams are per game;
 * entries are national dex ids. The deployed site never calls PokeAPI —
 * rendering resolves names/sprites from the already-fetched game dataset.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const TEAM_SIZE = 6;

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

/* ---------- Zustand store (client-only island) ---------- */

interface TeamStore {
  teams: TeamsByGame;
  toggle: (gameId: string, id: number) => AddResult;
  remove: (gameId: string, index: number) => void;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teams: {},
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
    }),
    { name: 'dexforge-team', version: 1 },
  ),
);
