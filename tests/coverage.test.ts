/**
 * Unit tests for the offensive-coverage layer (T4.3, src/lib/coverage.ts):
 * synthetic chart/move fixtures plus a real-dataset check that picked moves
 * resolve to game-accurate attacking types (Emerald Treecko + Absorb).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  analyzeCoverage,
  suggestCoverage,
  coverageMoves,
  defenderTypes,
  type CoverageMemberInput,
} from '../src/lib/coverage';
import type { GameData, MoveInfo } from '../src/lib/data-schema';

const move = (
  id: number,
  slug: string,
  type: string,
  damageClass: MoveInfo['damageClass'],
  power: number | null,
): [string, MoveInfo] => [
  String(id),
  {
    slug,
    name: { es: slug, en: slug },
    type,
    damageClass,
    power,
    accuracy: 100,
    pp: 10,
    generation: 1,
  },
];

const moveDex: Record<string, MoveInfo> = Object.fromEntries([
  move(1, 'absorber', 'grass', 'special', 20),
  move(2, 'placaje', 'normal', 'physical', 35),
  move(3, 'grunido', 'normal', 'status', null),
  move(4, 'sismico', 'fighting', 'physical', null),
  move(5, 'rayo', 'electric', 'special', 40),
  move(6, 'terremoto', 'ground', 'physical', 100),
]);

/** tiny chart: grass beats water/rock, normal is walled by rock/ghost, electric is immune to ground */
const chart = {
  normal: { normal: 1, ghost: 0, rock: 0.5, steel: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, steel: 0.5, ghost: 1 },
  electric: { ground: 0, water: 2, flying: 2 },
  ground: { flying: 0, electric: 2, rock: 2 },
};

const member = (id: number, es: string, moves: number[]): CoverageMemberInput => ({
  id,
  name: { es, en: es },
  moves,
});

describe('defenderTypes', () => {
  it('orders the chart defender keys canonically and keeps unknowns last', () => {
    expect(defenderTypes(chart)).toEqual([
      'normal',
      'fire',
      'water',
      'electric',
      'ground',
      'flying',
      'rock',
      'ghost',
      'steel',
    ]);
    expect(defenderTypes({ wood: { normal: 1, plasma: 1 } })).toEqual(['normal', 'plasma']);
  });

  it('ignores attacker keys with no defender columns', () => {
    expect(defenderTypes({ wood: {} })).toEqual([]);
  });
});

describe('coverageMoves', () => {
  it('keeps damaging moves with base power, in slot order', () => {
    expect(coverageMoves([2, 1, 5], moveDex).map((m) => m.id)).toEqual([2, 1, 5]);
  });

  it('drops status and fixed-damage moves', () => {
    expect(coverageMoves([3, 4, 1], moveDex).map((m) => m.id)).toEqual([1]);
  });

  it('ignores ids that are missing from the dictionary', () => {
    expect(coverageMoves([999, 1], moveDex).map((m) => m.id)).toEqual([1]);
  });
});

describe('analyzeCoverage', () => {
  it('picks the best multiplier per defender and the move that gets there', () => {
    const profile = analyzeCoverage([member(1, 'Treecko', [1, 2])], chart, moveDex);
    const treecko = profile.members[0];
    expect(treecko.best.water).toBe(2);
    expect(treecko.bestMove.water.id).toBe(1);
    expect(treecko.best.rock).toBe(2);
    expect(treecko.best.steel).toBe(0.5);
    // grass has no ghost row -> neutral; normal is 0 but grass is better
    expect(treecko.best.ghost).toBe(1);
  });

  it('breaks ties with the first slot', () => {
    const profile = analyzeCoverage([member(1, 'Treecko', [1, 6])], chart, moveDex);
    expect(profile.members[0].best.rock).toBe(2);
    expect(profile.members[0].bestMove.rock.id).toBe(1);
  });

  it('partitions defenders into gaps and covered at the 2x threshold', () => {
    const profile = analyzeCoverage([member(1, 'Treecko', [1, 2])], chart, moveDex);
    expect(profile.covered).toEqual(['water', 'rock']);
    expect(profile.gaps).toEqual([
      'normal',
      'fire',
      'electric',
      'ground',
      'flying',
      'ghost',
      'steel',
    ]);
  });

  it('a second member can fill the gaps', () => {
    const profile = analyzeCoverage(
      [member(1, 'Treecko', [1]), member(2, 'Geodude', [6])],
      chart,
      moveDex,
    );
    expect(profile.covered).toEqual(['water', 'electric', 'rock']);
    expect(profile.gaps).toContain('flying'); // ground cannot hit it
  });

  it('immunity is not coverage, and a neutral move still does not cover it', () => {
    const immune = analyzeCoverage([member(1, 'Pikachu', [5])], chart, moveDex);
    expect(immune.members[0].best.ground).toBe(0);
    expect(immune.covered).not.toContain('ground');
    const mixed = analyzeCoverage([member(1, 'Pikachu', [5, 2])], chart, moveDex);
    expect(mixed.members[0].best.ground).toBe(1);
    expect(mixed.gaps).toContain('ground');
  });

  it('is empty when nobody picked a usable damaging move', () => {
    const profile = analyzeCoverage([member(1, 'Treecko', [3, 4])], chart, moveDex);
    expect(profile.empty).toBe(true);
    expect(profile.members[0].moves).toEqual([]);
    expect(profile.gaps).toHaveLength(profile.defenders.length);
  });

  it('is empty for an empty team', () => {
    const profile = analyzeCoverage([], chart, moveDex);
    expect(profile.empty).toBe(true);
    expect(profile.members).toEqual([]);
  });
});

/* ---- real emitted-JSON invariant ---- */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const hasData = existsSync(path.join(DATA, 'emerald.json'));

describe.skipIf(!hasData)('game-accurate coverage (emitted JSON)', () => {
  const emerald = hasData
    ? (JSON.parse(readFileSync(path.join(DATA, 'emerald.json'), 'utf-8')) as GameData)
    : null;

  it('keeps the per-game defender set (Emerald has no Fairy column)', () => {
    if (!emerald) return;
    const defenders = defenderTypes(emerald.typeChart);
    expect(defenders).toHaveLength(17);
    expect(defenders).not.toContain('fairy');
    expect(emerald.typeChart.fairy).toBeUndefined();
  });

  it('Treecko + Absorb covers Water/Rock/Ground and leaves Steel open', () => {
    if (!emerald) return;
    const treecko = emerald.pokemon.find((p) => p.slug === 'treecko');
    const absorb = treecko?.moves.find(([id]) => id === 71)?.[0];
    expect(treecko).toBeDefined();
    expect(absorb).toBe(71); // national id of Absorb
    if (!treecko || absorb === undefined) return;
    const profile = analyzeCoverage(
      [{ id: treecko.id, name: treecko.name, moves: [absorb] }],
      emerald.typeChart,
      emerald.moves,
    );
    expect(profile.covered).toEqual(expect.arrayContaining(['water', 'rock', 'ground']));
    expect(profile.gaps).toContain('steel');
    expect(profile.gaps).not.toContain('water');
    expect(profile.members[0].moves[0].type).toBe('grass');
  });
});

describe('suggestCoverage (UX-07)', () => {
  const sChart = { ground: { steel: 2, fire: 2 }, fire: { steel: 2 }, normal: {} };
  const sMoves: Record<string, MoveInfo> = Object.fromEntries([
    move(10, 'earthquake', 'ground', 'physical', 100),
    move(11, 'mud-slap', 'ground', 'special', 20),
    move(12, 'ember', 'fire', 'special', 40),
    move(13, 'growl', 'normal', 'status', null),
  ]);

  it('suggests the strongest learnable move per member for each gap', () => {
    const out = suggestCoverage(
      ['steel'],
      [
        { id: 1, learnset: [11, 10, 13], picked: [] },
        { id: 2, learnset: [12], picked: [] },
      ],
      sChart,
      sMoves,
    );
    expect(out).toEqual([
      { defender: 'steel', memberId: 1, moveId: 10, value: 2 },
      { defender: 'steel', memberId: 2, moveId: 12, value: 2 },
    ]);
  });

  it('skips picked and status moves, and gaps nobody can cover', () => {
    const out = suggestCoverage(
      ['steel', 'water'],
      [{ id: 1, learnset: [10, 13], picked: [10] }],
      sChart,
      sMoves,
    );
    expect(out).toEqual([]);
  });
});
