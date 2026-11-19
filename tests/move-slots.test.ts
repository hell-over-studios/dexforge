/**
 * Unit tests for the T4.2 move-slot helpers (src/lib/moves.ts): learnset row
 * ordering, text/type filtering, four-slot toggling and the immutable move
 * map used by the team store.
 */
import { describe, expect, it } from 'vitest';
import type { GamePokemon, MoveInfo } from '../src/lib/data-schema';
import {
  buildMoveRows,
  filterMoveRows,
  MAX_MOVES,
  memberMoves,
  moveTypes,
  NO_MOVES,
  toggleMoveSlot,
  withMemberMoves,
  type MoveRow,
  type MovesByGame,
} from '../src/lib/moves';

const move = (slug: string, name: string, type: string): MoveInfo => ({
  slug,
  name: { en: name, es: name },
  type,
  damageClass: type === 'normal' ? 'physical' : 'special',
  power: 40,
  accuracy: 100,
  pp: 20,
  generation: 1,
});

const DICT: Record<string, MoveInfo> = {
  '1': { ...move('tackle', 'Placaje', 'normal') },
  '12': move('curse', 'Maldición', 'unknown'),
  '14': move('body-slam', 'Golpe Cuerpo', 'normal'),
  '15': move('cut', 'Corte', 'normal'),
  '33': move('ember', 'Ascuas', 'fire'),
  '45': move('flamethrower', 'Lanzallamas', 'fire'),
};

function makeMon(): GamePokemon {
  return {
    id: 253,
    slug: 'grovyle',
    name: { en: 'Grovyle', es: 'Grovyle' },
    dexNumber: 2,
    formSlug: 'grovyle',
    generationSlug: 'generation-iii',
    types: ['grass'],
    stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
    abilities: [],
    height: 9,
    weight: 216,
    captureRate: 45,
    sprites: { game: null, shinyGame: null, official: null, showdown: null, home: null },
    evolution: null,
    moves: [
      [45, 'machine', null],
      [33, 'level-up', 7],
      [1, 'level-up', 1],
      [12, 'egg', null],
      [14, 'tutor', null],
      [15, 'machine', null],
    ],
    encounters: [],
  };
}

describe('buildMoveRows', () => {
  it('orders level-up (by level), machine, tutor, egg; slug within a method', () => {
    const rows = buildMoveRows(makeMon(), DICT);
    expect(rows.map((row) => row.id)).toEqual([1, 33, 15, 45, 14, 12]);
    expect(rows.map((row) => row.method)).toEqual([
      'level-up',
      'level-up',
      'machine',
      'machine',
      'tutor',
      'egg',
    ]);
    expect(rows[1].level).toBe(7);
    expect(rows[2].level).toBeNull();
  });

  it('skips rows missing from the dictionary and never mutates the learnset', () => {
    const mon = makeMon();
    const before = [...mon.moves];
    const rows = buildMoveRows(mon, { '1': DICT['1'] });
    expect(rows.map((row) => row.id)).toEqual([1]);
    expect(mon.moves).toEqual(before);
  });
});

describe('filterMoveRows', () => {
  const rows: MoveRow[] = buildMoveRows(makeMon(), DICT);

  it('finds moves by localized name and slug, ignoring case and accents', () => {
    expect(filterMoveRows(rows, { query: 'ascuas', lang: 'es' }).map((r) => r.id)).toEqual([33]);
    expect(filterMoveRows(rows, { query: 'LANZALLAMAS', lang: 'es' }).map((r) => r.id)).toEqual([
      45,
    ]);
    expect(filterMoveRows(rows, { query: 'corte', lang: 'es' }).map((r) => r.id)).toEqual([15]);
    expect(filterMoveRows(rows, { query: 'cut', lang: 'en' }).map((r) => r.id)).toEqual([15]);
    expect(filterMoveRows(rows, { query: 'maldición', lang: 'es' }).map((r) => r.id)).toEqual([12]);
  });

  it('filters by type, alone or combined with the query', () => {
    expect(filterMoveRows(rows, { type: 'fire', lang: 'es' }).map((r) => r.id)).toEqual([33, 45]);
    expect(
      filterMoveRows(rows, { type: 'fire', query: 'lanza', lang: 'es' }).map((r) => r.id),
    ).toEqual([45]);
    expect(filterMoveRows(rows, { type: 'water', lang: 'es' })).toEqual([]);
  });

  it('keeps every row for an empty query and no type', () => {
    expect(filterMoveRows(rows, { query: '   ', lang: 'es' })).toHaveLength(rows.length);
  });
});

describe('moveTypes', () => {
  it('lists each learnable type once, sorted', () => {
    expect(moveTypes(buildMoveRows(makeMon(), DICT))).toEqual(['fire', 'normal', 'unknown']);
  });
});

describe('toggleMoveSlot', () => {
  it('appends, removes and replaces the oldest pick', () => {
    expect(toggleMoveSlot([], 33)).toEqual({ slots: [33], result: 'added' });
    expect(toggleMoveSlot([33, 45], 33)).toEqual({ slots: [45], result: 'removed' });
    expect(toggleMoveSlot([1, 2, 3, MAX_MOVES + 100], 9)).toEqual({
      slots: [2, 3, MAX_MOVES + 100, 9],
      result: 'replaced-oldest',
    });
  });

  it('never mutates the input slots', () => {
    const slots = [1, 2];
    toggleMoveSlot(slots, 3);
    expect(slots).toEqual([1, 2]);
  });
});

describe('memberMoves / withMemberMoves', () => {
  it('returns a stable empty array for an unknown member', () => {
    expect(memberMoves({}, 'emerald', 253)).toBe(NO_MOVES);
    expect(memberMoves({ emerald: { '253': [33] } }, 'emerald', 1)).toBe(NO_MOVES);
  });

  it('writes slots immutably and prunes empty members and games', () => {
    const base: MovesByGame = { emerald: { '1': [2] } };
    const withSlot = withMemberMoves(base, 'emerald', 253, [33]);
    expect(withSlot.emerald['253']).toEqual([33]);
    expect(withSlot.emerald['1']).toEqual([2]);
    expect(base.emerald['253']).toBeUndefined();

    const cleared = withMemberMoves(withSlot, 'emerald', 253, []);
    expect(cleared.emerald['253']).toBeUndefined();
    expect(withMemberMoves(cleared, 'emerald', 1, [])).toEqual({});
  });

  it('keeps games isolated', () => {
    const moves = withMemberMoves({}, 'emerald', 1, [33]);
    expect(memberMoves(moves, 'red-blue', 1)).toBe(NO_MOVES);
  });
});
