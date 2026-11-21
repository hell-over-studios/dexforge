/** UX-13 (#89): generation chart differences come from the data. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { chartDiffs, formatMultiplier, missingTypes } from '../src/lib/chart-diff';
import type { GameData } from '../src/lib/data-schema';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const load = (id: string) =>
  (JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData).typeChart;
const hasData =
  existsSync(path.join(DATA, 'x-y.json')) && existsSync(path.join(DATA, 'red-blue.json'));

describe('chartDiffs (synthetic)', () => {
  it('lists cells present in both charts that changed', () => {
    // real charts are square: every type is both a row (attacker) and a column (defender)
    const older = { ghost: { psychic: 0 }, bug: { poison: 2 }, psychic: {}, poison: {} };
    const newer = {
      ghost: { psychic: 2 },
      bug: { poison: 0.5 },
      psychic: {},
      poison: {},
      dark: {},
    };
    expect(chartDiffs(older, newer)).toEqual([
      { attack: 'ghost', defend: 'psychic', then: 0, now: 2 },
      { attack: 'bug', defend: 'poison', then: 2, now: 0.5 },
    ]);
    expect(missingTypes(older, newer)).toEqual(['dark']);
    expect(formatMultiplier(0.5)).toBe('×½');
  });
});

describe.skipIf(!hasData)('real charts', () => {
  it('Gen 1 vs Gen 6 shows the Gen-I quirks and the missing types', () => {
    const diffs = chartDiffs(load('red-blue'), load('x-y'));
    expect(diffs).toContainEqual({ attack: 'ghost', defend: 'psychic', then: 0, now: 2 });
    expect(diffs).toContainEqual({ attack: 'bug', defend: 'poison', then: 2, now: 0.5 });
    expect(missingTypes(load('red-blue'), load('x-y')).sort()).toEqual(['dark', 'fairy', 'steel']);
  });
});
