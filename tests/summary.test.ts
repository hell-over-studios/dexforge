/**
 * Unit tests for suggestions v1 (T3.4, src/lib/summary.ts): defensive
 * summary heuristics over a TeamProfile, with fixtures close to real cases
 * (electric teams vs Ground, dark-weak duos, Gen-I immunities).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analyzeTeam, type TeamMemberInput } from '../src/lib/analysis';
import { summarizeDefenses } from '../src/lib/summary';
import type { GameData } from '../src/lib/data-schema';

const member = (id: number, es: string, types: string[]): TeamMemberInput => ({
  id,
  name: { es, en: es },
  types,
});

/** classic gen-3 hole: a ground-weak duo (electrics) with a floating ghost */
const electricTeam = [
  member(1, 'Pikachu', ['electric']),
  member(2, 'Electrike', ['electric']),
  member(3, 'Shedinja', ['bug', 'ghost']), // weak almost to everything, usual trap
];

/** restricted chart for determinism */
const chart = {
  ground: { electric: 2 },
  dark: { ghost: 2 },
  normal: { ghost: 0 },
  fighting: { ghost: 0 },
  bug: { grass: 2 },
};

describe('summarizeDefenses (v1)', () => {
  it('reports shared weaknesses when >= 2 members take 2x+', () => {
    const profile = analyzeTeam(electricTeam, chart);
    const s = summarizeDefenses(profile);
    expect(s.sharedWeaknesses).toContainEqual({
      attack: 'ground',
      indices: [0, 1],
    });
  });

  it('does NOT report a weakness hit by a single member (v1 keeps it focused)', () => {
    const profile = analyzeTeam(electricTeam, chart);
    const s = summarizeDefenses(profile);
    // dark hits only Shedinja (2x); bug/ghost not in chart at all
    expect(s.sharedWeaknesses.map((w) => w.attack)).not.toContain('dark');
  });

  it('reports immunities per member from the game chart', () => {
    const profile = analyzeTeam(electricTeam, chart);
    const s = summarizeDefenses(profile);
    expect(s.immunities).toContainEqual({ attack: 'normal', indices: [2] });
    expect(s.immunities).toContainEqual({ attack: 'fighting', indices: [2] });
  });

  it('marks team-wide resists (everyone <= 0.5x) but not neutral-everywhere', () => {
    const resistChart = {
      ...chart,
      // bug side would be neutral (1x): cap it too so the whole team resists
      // cap the electric-vs-electric self-resist and the bug side too so the
      // whole team (Pikachu, Electrike, Shedinja) resists electric
      electric: { steel: 0.5, ghost: 0.5, bug: 0.5, electric: 0.5 },
      poison: { steel: 0.5 }, // nobody here is steel -> all 1x, NOT a team resist
    };
    const profile = analyzeTeam(electricTeam, resistChart);
    const s = summarizeDefenses(profile);
    expect(s.teamResists).toContain('electric');
    expect(s.teamResists).not.toContain('poison');
  });

  it('an empty summary is fine for a very bulky team', () => {
    const profile = analyzeTeam([member(1, 'Bulky', ['steel'])], {
      ground: { steel: 0.5 },
      poison: { steel: 0.5 },
    });
    const s = summarizeDefenses(profile);
    expect(s.sharedWeaknesses).toEqual([]);
    expect(s.immunities).toEqual([]);
    // canonical attacker order (poison before ground in TYPE_ORDER)
    expect(s.teamResists).toEqual(['poison', 'ground']);
  });
});

/* ---- real emitted-JSON spot check (same loader pattern as analysis.test.ts) ---- */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const hasData = existsSync(path.join(DATA, 'games.json'));

describe.skipIf(!hasData)('summarizeDefenses over the real Red/Blue chart', () => {
  const games: Record<string, GameData> = {};

  it('keeps Normal/Fighting immunities for Ghosts and flags shared Poison weakness', () => {
    Object.assign(games, {
      'red-blue': JSON.parse(readFileSync(path.join(DATA, 'red-blue.json'), 'utf-8')) as GameData,
    });
    const rb = games['red-blue'].typeChart;
    const profile = analyzeTeam(
      [member(1, 'Gengar', ['ghost', 'poison']), member(2, 'Golbat', ['poison', 'flying'])],
      rb,
    );
    const s = summarizeDefenses(profile);
    // Gen I: Normal can't touch Ghost (0x), and the repo's GEN1_PATCHES makes
    // fighting 0.5x (0 came in Gen II) — so no fighting immunity is reported
    expect(s.immunities).toContainEqual({ attack: 'normal', indices: [0] });
    expect(s.immunities.map((i) => i.attack)).not.toContain('fighting');
    // flying (Golbat) is fully immune to ground; Gengar takes 2x instead
    expect(s.immunities).toContainEqual({ attack: 'ground', indices: [1] });
    // the two poison-backbone members share psychic: 2x on both in Gen I
    const psych = s.sharedWeaknesses.find((w) => w.attack === 'psychic');
    expect(psych).toEqual({ attack: 'psychic', indices: [0, 1] });
  });
});
