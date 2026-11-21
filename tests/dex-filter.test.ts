/**
 * Index filters (UX-06 resists, UX-08 type/role): pure helper over the dex
 * index with the game's own chart.
 */
import { describe, expect, it } from 'vitest';
import {
  filterDex,
  isFilterActive,
  NO_FILTER,
  typeMultiplier,
  type DexEntry,
} from '../src/lib/dex';
import type { Role } from '../src/lib/roles';

const entry = (id: number, slug: string, types: string[]): DexEntry => ({
  id,
  slug,
  name: { es: slug, en: slug },
  dexNumber: id,
  types,
  spriteUrl: null,
});

const entries = [
  entry(1, 'treecko', ['grass']),
  entry(2, 'torchic', ['fire']),
  entry(3, 'mudkip', ['water']),
  entry(4, 'swampert', ['water', 'ground']),
  entry(5, 'skarmory', ['steel', 'flying']),
];

const chart = {
  water: { fire: 2, ground: 2, grass: 0.5, water: 0.5 },
  ground: { fire: 2, steel: 2, flying: 0, grass: 0.5 },
  electric: { water: 2, flying: 2, ground: 0, grass: 0.5 },
};

const roles = new Map<number, Role>([
  [1, 'sweeper'],
  [2, 'support'],
  [3, 'support'],
  [4, 'tank'],
  [5, 'wall'],
]);

describe('typeMultiplier', () => {
  it('multiplies across both types and defaults to 1', () => {
    expect(typeMultiplier(chart, 'electric', ['water', 'ground'])).toBe(0);
    expect(typeMultiplier(chart, 'ground', ['steel', 'flying'])).toBe(0);
    expect(typeMultiplier(chart, 'water', ['steel', 'flying'])).toBe(1);
  });
});

describe('filterDex', () => {
  it('returns the same list when no filter is active', () => {
    expect(isFilterActive(NO_FILTER)).toBe(false);
    expect(filterDex(entries, NO_FILTER, chart, roles)).toBe(entries);
  });

  it('keeps entries with any of the selected types', () => {
    const out = filterDex(entries, { ...NO_FILTER, types: ['water', 'grass'] }, chart, roles);
    expect(out.map((e) => e.slug)).toEqual(['treecko', 'mudkip', 'swampert']);
  });

  it('filters by role', () => {
    const out = filterDex(entries, { ...NO_FILTER, role: 'support' }, chart, roles);
    expect(out.map((e) => e.slug)).toEqual(['torchic', 'mudkip']);
  });

  it('keeps only Pokémon that resist or ignore the attacking type', () => {
    const out = filterDex(entries, { ...NO_FILTER, resists: 'ground' }, chart, roles);
    // grass resists (×½), flying is immune (×0 on Skarmory); fire and steel are weak
    expect(out.map((e) => e.slug)).toEqual(['treecko', 'skarmory']);
  });

  it('combines filters', () => {
    const out = filterDex(
      entries,
      { types: ['water', 'grass'], role: null, resists: 'water' },
      chart,
      roles,
    );
    expect(out.map((e) => e.slug)).toEqual(['treecko', 'mudkip']);
  });
});
