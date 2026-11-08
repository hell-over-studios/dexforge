/**
 * Unit tests for the team-of-6 logic (T2.8, src/lib/team.ts): add / remove /
 * replace-oldest / dedupe, per-game isolation. The Zustand wrapper stays
 * untested here (tested via browser e2e in T2.10).
 */
import { describe, expect, it } from 'vitest';
import { removeAt, TEAM_SIZE, toggleMember, type TeamsByGame } from '../src/lib/team';

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
