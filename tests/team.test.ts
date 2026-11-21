/**
 * Unit tests for the team-of-6 logic (T2.8, src/lib/team.ts): add / remove /
 * replace-oldest / dedupe, per-game isolation. The Zustand wrapper stays
 * untested here (tested via browser e2e in T2.10).
 */
import { describe, expect, it } from 'vitest';
import {
  insertAt,
  removeAt,
  replaceAt,
  TEAM_SIZE,
  toggleMember,
  type TeamsByGame,
} from '../src/lib/team';

describe('toggleMember', () => {
  it('appends with space', () => {
    const teams = toggleMember({}, 'gold-silver', 25);
    expect(teams['gold-silver']).toEqual([25]);
  });

  it('adds to a first empty slot, in order', () => {
    let teams = toggleMember({}, 'g', 1);
    teams = toggleMember(teams, 'g', 4);
    teams = toggleMember(teams, 'g', 7);
    expect(teams.g).toEqual([1, 4, 7]);
  });

  it('removes a member (toggle off)', () => {
    const teams: TeamsByGame = { g: [1, 2, 3] };
    expect(toggleMember(teams, 'g', 2).g).toEqual([1, 3]);
  });

  it('add/remove round-trip returns to an empty team', () => {
    const teams = toggleMember(toggleMember({}, 'g', 5), 'g', 5);
    expect(teams).toEqual({});
  });

  it('replaces the oldest member when the team is full', () => {
    let teams: TeamsByGame = {};
    for (const id of [1, 2, 3, 4, 5, 6]) teams = toggleMember(teams, 'g', id);
    expect(teams.g).toHaveLength(TEAM_SIZE);
    teams = toggleMember(teams, 'g', 25);
    expect(teams.g).toEqual([2, 3, 4, 5, 6, 25]);
  });

  it('keeps games isolated', () => {
    let teams = toggleMember({}, 'red-blue', 25);
    teams = toggleMember(teams, 'gold-silver', 152);
    expect(teams['red-blue']).toEqual([25]);
    expect(teams['gold-silver']).toEqual([152]);
    teams = toggleMember(teams, 'red-blue', 25);
    expect(teams['red-blue']).toBeUndefined();
    expect(teams['gold-silver']).toEqual([152]);
  });

  it('deletes the game key when the last member leaves', () => {
    const teams: TeamsByGame = { g: [1] };
    expect(toggleMember(teams, 'g', 1)).toEqual({});
  });
});

describe('removeAt', () => {
  it('removes the slot at the given index', () => {
    const teams: TeamsByGame = { g: [1, 2, 3] };
    expect(removeAt(teams, 'g', 1).g).toEqual([1, 3]);
  });

  it('never mutates the input', () => {
    const teams: TeamsByGame = { g: [1, 2] };
    removeAt(teams, 'g', 0);
    expect(teams.g).toEqual([1, 2]);
  });

  it('deletes the key when a last member is removed', () => {
    const teams: TeamsByGame = { g: [7] };
    expect(removeAt(teams, 'g', 0)).toEqual({});
  });

  it('is a no-op for an unknown game', () => {
    expect(removeAt({}, 'missing', 0)).toEqual({});
  });
});

describe('insertAt (undo a removal, UX-01)', () => {
  it('puts the member back at its slot', () => {
    const teams: TeamsByGame = { emerald: [252, 258, 280] };
    expect(insertAt(teams, 'emerald', 1, 255).emerald).toEqual([252, 255, 258, 280]);
  });

  it('appends when the slot is past the end and starts an empty team', () => {
    expect(insertAt({ emerald: [252] }, 'emerald', 5, 255).emerald).toEqual([252, 255]);
    expect(insertAt({}, 'emerald', 0, 255).emerald).toEqual([255]);
  });

  it('ignores full teams and species already in the team', () => {
    const full: TeamsByGame = { emerald: [1, 2, 3, 4, 5, 6] };
    expect(insertAt(full, 'emerald', 0, 7)).toBe(full);
    const dup: TeamsByGame = { emerald: [252] };
    expect(insertAt(dup, 'emerald', 0, 252)).toBe(dup);
  });
});

describe('replaceAt (choose whom to replace, UX-02)', () => {
  it('swaps only the chosen slot', () => {
    const teams: TeamsByGame = { emerald: [1, 2, 3, 4, 5, 6] };
    expect(replaceAt(teams, 'emerald', 3, 99).emerald).toEqual([1, 2, 3, 99, 5, 6]);
  });

  it('ignores out-of-range slots and species already in the team', () => {
    const teams: TeamsByGame = { emerald: [1, 2] };
    expect(replaceAt(teams, 'emerald', 2, 99)).toBe(teams);
    expect(replaceAt(teams, 'emerald', -1, 99)).toBe(teams);
    expect(replaceAt(teams, 'emerald', 0, 2)).toBe(teams);
  });
});
