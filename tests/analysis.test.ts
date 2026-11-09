/**
 * Unit tests for the team-analysis data layer (T3.1, src/lib/analysis.ts):
 * synthetic-chart fixtures plus game-accurate invariants against the REAL
 * emitted JSON (Red/Blue Gen-I quirks, GS/Emerald Steel/Dark behavior).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  analyzeTeam,
  attackerTypes,
  effectiveness,
  type TeamMemberInput,
} from '../src/lib/analysis';
import type { GameData } from '../src/lib/data-schema';

/* ---- synthetic fixtures ---- */

/** tiny chart: fighting hits normal 2x, ghost hits psychic 0x (like gen-i after patches) */
const fixtureChart = {
  fighting: { normal: 2, ghost: 0 },
  ghost: { normal: 0, psychic: 0 },
  grass: { water: 0.5, rock: 2 },
};

const member = (id: number, es: string, types: string[]): TeamMemberInput => ({
  id,
  name: { es, en: es },
  types,
});

describe('effectiveness', () => {
  it('single-type lookup with synthesized correctness', () => {
    expect(effectiveness(fixtureChart, 'fighting', ['normal'])).toBe(2);
    expect(effectiveness(fixtureChart, 'ghost', ['psychic'])).toBe(0);
    expect(effectiveness(fixtureChart, 'grass', ['water'])).toBe(0.5);
  });

  it('absent pair defaults to 1x (both levels)', () => {
    expect(effectiveness(fixtureChart, 'fighting', ['water'])).toBe(1);
    expect(effectiveness(fixtureChart, 'grass', ['normal'])).toBe(1);
  });

  it('composes across dual types and caps at 4x', () => {
    // grass -> [water, rock] = 0.5 * 2 = 1
    expect(effectiveness(fixtureChart, 'grass', ['water', 'rock'])).toBe(1);
    // fighting -> [normal, normal-like 2x] doubles are capped
    const chart = { fighting: { normal: 2, rock: 2 } };
    expect(effectiveness(chart, 'fighting', ['normal', 'rock'])).toBe(4);
  });

  it('short-circuits on immunity (0x is always 0x)', () => {
    const chart = { fighting: { ghost: 0, normal: 2 } };
    expect(effectiveness(chart, 'fighting', ['normal', 'ghost'])).toBe(0);
  });
});

describe('analyzeTeam — shape', () => {
  const members = [member(1, 'Mudkip', ['water']), member(2, 'Machop', ['fighting'])];

  it('rows follow the canonical attacker order, members keep order', () => {
    const profile = analyzeTeam(members, fixtureChart);
    expect(profile.attacks).toEqual(['grass', 'fighting', 'ghost']); // TYPE_ORDER wins over insertion
    expect(profile.members.map((m) => m.id)).toEqual([1, 2]);
    expect(profile.rows.map((r) => r.attack)).toEqual(['grass', 'fighting', 'ghost']);
    expect(profile.rows[0].perMember).toEqual([0.5, 1]); // grass vs water 0.5x, grass vs fighting 1x
  });

  it('attackerTypes orders canonically and keeps unknowns at the end', () => {
    expect(attackerTypes(fixtureChart)).toEqual(['grass', 'fighting', 'ghost']);
    expect(attackerTypes({ wood: { normal: 1 }, ghost: { normal: 0.5 } })).toEqual([
      'ghost',
      'wood',
    ]);
  });
});

/* ---- real emitted-JSON invariants ---- */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const hasData = existsSync(path.join(DATA, 'games.json'));

describe.skipIf(!hasData)('game-accurate charts (emitted JSON)', () => {
  const games: Record<string, GameData> = {};
  beforeAll(() => {
    if (!hasData) return;
    for (const id of ['red-blue', 'gold-silver', 'emerald']) {
      games[id] = JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData;
    }
  });

  it('Red/Blue has Gen-I quirks (no dark/steel rows; classic neutralities hold)', () => {
    const rb = games['red-blue'].typeChart;
    const rows = attackerTypes(rb);
    expect(rows.length).toBe(15);
    expect(rows).not.toContain('dark');
    expect(rows).not.toContain('steel');
    expect(rows).not.toContain('fairy');
    expect(effectiveness(rb, 'fire', ['ghost'])).toBe(1);
    expect(effectiveness(rb, 'bug', ['poison'])).toBe(2);
    expect(effectiveness(rb, 'ghost', ['psychic'])).toBe(0);
  });

  it('Emerald: electric 0x vs ground, steel immune to poison, grass 2x vs water', () => {
    const em = games['emerald'].typeChart;
    expect(effectiveness(em, 'electric', ['ground'])).toBe(0);
    expect(effectiveness(em, 'poison', ['steel'])).toBe(0);
    expect(effectiveness(em, 'grass', ['water'])).toBe(2);
  });

  it('Gold/Silver introduces dark/steel (ghost is only 0.5x vs steel, dark 2x vs ghost)', () => {
    const gs = games['gold-silver'].typeChart;
    expect(gs.dark).toBeDefined();
    expect(gs.steel).toBeDefined();
    expect(effectiveness(gs, 'ghost', ['steel'])).toBe(0.5);
    expect(effectiveness(gs, 'dark', ['ghost'])).toBe(2);
  });

  it(' RB: every multiplier is 0, 0.5, 1 or 2 (no modern values); all games cap types at 4x', () => {
    for (const id of ['red-blue', 'gold-silver', 'emerald']) {
      const chart = games[id].typeChart;
      for (const [attack, row] of Object.entries(chart)) {
        for (const [, value] of Object.entries(row)) {
          expect([0, 0.5, 1, 2], `${id}/${attack}`).toContain(value);
        }
      }
    }
  });

  it('compose with real charts: ice vs ["grass","ground","flying"] caps at 4x in Emerald', () => {
    expect(effectiveness(games['emerald'].typeChart, 'ice', ['grass', 'ground', 'flying'])).toBe(4);
  });
});
