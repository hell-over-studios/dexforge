/**
 * Unit tests for the where-to-find display model (T5.1, src/lib/encounters.ts):
 * synthetic fixtures for category/merge/order rules plus invariants against the
 * real emitted JSON (Emerald single-version gifts, Red/Blue version exclusives,
 * Mewtwo statics, a species with no encounters).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  encounterCategory,
  formatLevelRange,
  formatRate,
  groupEncounters,
  methodLabel,
  summarizeLocations,
  versionLabel,
} from '../src/lib/encounters';
import type { Encounter, GameData, LocalizedText } from '../src/lib/data-schema';

const name = (en: string, es = en): LocalizedText => ({ en, es });

const encounter = (overrides: Partial<Encounter> = {}): Encounter => ({
  source: 'pokeapi',
  kind: 'wild',
  locationArea: 'some-area',
  name: name('Some Area'),
  method: 'walk',
  rate: 10,
  minLevel: 3,
  maxLevel: 5,
  version: 'red',
  notes: null,
  ...overrides,
});

describe('encounterCategory', () => {
  it('derives the category from PokeAPI methods, not from kind', () => {
    expect(encounterCategory(encounter({ method: 'walk' }))).toBe('wild');
    expect(encounterCategory(encounter({ method: 'super-rod' }))).toBe('wild');
    expect(encounterCategory(encounter({ method: 'rock-smash' }))).toBe('wild');
    expect(encounterCategory(encounter({ method: 'headbutt-high' }))).toBe('wild');
    expect(encounterCategory(encounter({ method: 'gift' }))).toBe('gift');
    expect(encounterCategory(encounter({ method: 'gift-egg' }))).toBe('gift');
    expect(encounterCategory(encounter({ method: 'npc-trade' }))).toBe('trade');
    expect(encounterCategory(encounter({ method: 'static' }))).toBe('static');
    expect(encounterCategory(encounter({ method: 'pokeflute' }))).toBe('static');
    expect(encounterCategory(encounter({ method: 'devon-scope' }))).toBe('static');
    expect(encounterCategory(encounter({ method: 'mystery' }))).toBe('wild');
  });

  it('handles curated methods and falls back to the authored kind', () => {
    expect(
      encounterCategory(encounter({ source: 'curated', kind: 'gift', method: 'Starter' })),
    ).toBe('gift');
    expect(
      encounterCategory(encounter({ source: 'curated', kind: 'gift', method: 'After fighting' })),
    ).toBe('gift');
    expect(
      encounterCategory(encounter({ source: 'curated', kind: 'static', method: 'Roaming' })),
    ).toBe('static');
    expect(encounterCategory(encounter({ source: 'curated', kind: 'evolve', method: null }))).toBe(
      'evolve',
    );
    expect(encounterCategory(encounter({ method: null }))).toBe('wild');
  });
});

describe('labels and formatting', () => {
  it('localizes known methods and passes unknown strings through', () => {
    expect(methodLabel('walk', 'es')).toBe('Caminando');
    expect(methodLabel('super-rod', 'en')).toBe('Super Rod');
    expect(methodLabel('Starter', 'es')).toBe('Inicial');
    expect(methodLabel('Revive fossil', 'en')).toBe('Revive fossil');
    expect(methodLabel('Something new', 'es')).toBe('Something new');
    expect(methodLabel(null, 'en')).toBeNull();
  });

  it('labels versions and capitalizes unknown slugs', () => {
    expect(versionLabel('red', 'es')).toBe('Rojo');
    expect(versionLabel('silver', 'en')).toBe('Silver');
    expect(versionLabel('mystery', 'en')).toBe('Mystery');
  });

  it('formats levels and rates', () => {
    expect(formatLevelRange(5, 5, 'es')).toBe('Nv. 5');
    expect(formatLevelRange(3, 5, 'en')).toBe('Lv. 3–5');
    expect(formatLevelRange(20, null, 'es')).toBe('Nv. ≥20');
    expect(formatLevelRange(null, 30, 'en')).toBe('Lv. ≤30');
    expect(formatLevelRange(null, null, 'es')).toBeNull();
    expect(formatRate(5)).toBe('5%');
    expect(formatRate(12.5)).toBe('12.5%');
    expect(formatRate(null)).toBeNull();
  });
});

describe('groupEncounters', () => {
  it('merges rows that only differ by version', () => {
    const sections = groupEncounters(
      [
        encounter({ version: 'red' }),
        encounter({ version: 'blue' }),
        encounter({ version: 'red', rate: 5, minLevel: 7, maxLevel: 7 }),
      ],
      ['red', 'blue'],
    );
    expect(sections).toHaveLength(1);
    expect(sections[0].entries).toHaveLength(2);
    expect(sections[0].entries[0].versions).toBeNull(); // present in both versions
    expect(sections[0].entries[1].versions).toEqual(['red']);
  });

  it('keeps one chip for a version subset in a three-version game', () => {
    const sections = groupEncounters(
      [
        encounter({ version: 'gold' }),
        encounter({ version: 'silver' }),
        encounter({ version: 'crystal' }),
        encounter({ version: 'gold', rate: 20 }),
      ],
      ['gold', 'silver', 'crystal'],
    );
    expect(sections[0].entries[0].versions).toBeNull();
    expect(sections[0].entries[1].versions).toEqual(['gold']);
  });

  it('treats version-less rows (curated) as available everywhere', () => {
    const sections = groupEncounters(
      [encounter({ source: 'curated', version: null, rate: null })],
      ['red', 'blue'],
    );
    expect(sections[0].entries[0].versions).toBeNull();
  });

  it('drops exact repeats', () => {
    const rows = [encounter(), encounter()];
    const sections = groupEncounters(rows, ['red']);
    expect(sections[0].entries).toHaveLength(1);
  });

  it('orders sections by category and rows by location', () => {
    const sections = groupEncounters(
      [
        encounter({ method: 'gift', locationArea: 'z', name: name('Z Gift') }),
        encounter({ method: 'walk', locationArea: 'b', name: name('B Route') }),
        encounter({ method: 'walk', locationArea: 'a', name: name('A Route') }),
      ],
      ['red'],
    );
    expect(sections.map((section) => section.category)).toEqual(['wild', 'gift']);
    expect(sections[0].entries.map((entry) => entry.location?.en)).toEqual(['A Route', 'B Route']);
  });

  it('summarizes the first locations and the remainder', () => {
    const sections = groupEncounters(
      [
        encounter({ locationArea: 'a', name: name('A Route') }),
        encounter({ locationArea: 'a', name: name('A Route'), rate: 20 }),
        encounter({ locationArea: 'b', name: name('B Route') }),
        encounter({ locationArea: 'c', name: name('C Route') }),
      ],
      ['red'],
    );
    expect(summarizeLocations(sections, 'en')).toEqual({
      labels: ['A Route', 'B Route'],
      more: 1,
    });
    expect(summarizeLocations([], 'es')).toEqual({ labels: [], more: 0 });
  });
});

/* ---- real emitted-JSON invariants ---- */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const hasData = existsSync(path.join(DATA, 'emerald.json'));

describe.skipIf(!hasData)('game-accurate encounters (emitted JSON)', () => {
  const load = (file: string) =>
    JSON.parse(readFileSync(path.join(DATA, file), 'utf-8')) as GameData;
  const emerald = hasData ? load('emerald.json') : null;
  const redBlue = hasData ? load('red-blue.json') : null;

  it('Emerald is single-version: Treecko gifts carry no version chip', () => {
    if (!emerald) return;
    const treecko = emerald.pokemon.find((p) => p.slug === 'treecko');
    expect(treecko).toBeDefined();
    const sections = groupEncounters(treecko!.encounters, emerald.meta.versions);
    expect(sections.map((section) => section.category)).toEqual(['gift']);
    expect(sections[0].entries).toHaveLength(2); // PokeAPI gift + curated starter
    expect(sections[0].entries.every((entry) => entry.versions === null)).toBe(true);
    expect(sections[0].entries.some((entry) => entry.source === 'curated')).toBe(true);
  });

  it('Red/Blue keeps version-exclusive rows (Ekans is Red only)', () => {
    if (!redBlue) return;
    const ekans = redBlue.pokemon.find((p) => p.slug === 'ekans');
    expect(ekans).toBeDefined();
    const sections = groupEncounters(ekans!.encounters, redBlue.meta.versions);
    const rows = sections.flatMap((section) => section.entries);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((entry) => entry.versions?.join(',') === 'red')).toBe(true);
  });

  it('Mewtwo stays a static encounter and keeps the curated note', () => {
    if (!redBlue) return;
    const mewtwo = redBlue.pokemon.find((p) => p.slug === 'mewtwo');
    expect(mewtwo).toBeDefined();
    const sections = groupEncounters(mewtwo!.encounters, redBlue.meta.versions);
    expect(sections).toHaveLength(1);
    expect(sections[0].category).toBe('static');
    expect(sections[0].entries.every((entry) => entry.versions === null)).toBe(true);
    const curated = sections[0].entries.find((entry) => entry.source === 'curated');
    expect(curated?.method).toContain('HM03');
  });

  it('a species with no data yields no sections', () => {
    if (!emerald) return;
    const bellossom = emerald.pokemon.find((p) => p.slug === 'bellossom');
    expect(bellossom?.encounters).toEqual([]);
    expect(groupEncounters(bellossom!.encounters, emerald.meta.versions)).toEqual([]);
  });
});
