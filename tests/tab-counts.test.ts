/**
 * Unit tests for the analysis-tab badges (UX-04, src/lib/tab-counts.ts):
 * the counts come from the same profiles the panels render.
 */
import { describe, expect, it } from 'vitest';
import { analyzeTeam } from '../src/lib/analysis';
import { analyzeCoverage } from '../src/lib/coverage';
import type { MoveInfo } from '../src/lib/data-schema';
import { coverageGapCount, defenseAlertCount } from '../src/lib/tab-counts';

/* tiny synthetic chart: attacker -> defender -> multiplier (1 when missing) */
const chart = {
  ground: { electric: 2, fire: 2, flying: 0 },
  water: { fire: 2 },
  electric: { flying: 2, water: 2 },
  normal: {},
};

const members = [
  { id: 1, name: { es: 'Manectric', en: 'Manectric' }, types: ['electric'] },
  { id: 2, name: { es: 'Blaziken', en: 'Blaziken' }, types: ['fire'] },
  { id: 3, name: { es: 'Altaria', en: 'Altaria' }, types: ['flying'] },
];

const thunderbolt: MoveInfo = {
  slug: 'thunderbolt',
  name: { es: 'Rayo', en: 'Thunderbolt' },
  type: 'electric',
  damageClass: 'special',
  power: 95,
  accuracy: 100,
  pp: 15,
  generation: 1,
};

describe('defenseAlertCount', () => {
  it('counts attacking types that hit two or more members super effectively', () => {
    // ground hits Manectric and Blaziken (2) -> alert; water and electric hit one each
    expect(defenseAlertCount(analyzeTeam(members, chart))).toBe(1);
  });

  it('is zero without a team', () => {
    expect(defenseAlertCount(null)).toBe(0);
  });
});

describe('coverageGapCount', () => {
  it('stays at zero until a damaging move is picked', () => {
    const noMoves = analyzeCoverage(
      members.map((m) => ({ id: m.id, name: m.name, moves: [] })),
      chart,
      {},
    );
    expect(noMoves.empty).toBe(true);
    expect(coverageGapCount(noMoves)).toBe(0);
  });

  it('counts the defending types nobody hits for 2× or more', () => {
    const profile = analyzeCoverage([{ id: 1, name: members[0].name, moves: [85] }], chart, {
      '85': thunderbolt,
    });
    // electric covers flying and water; every other defending type is a gap
    expect(coverageGapCount(profile)).toBe(profile.gaps.length);
    expect(profile.gaps).not.toContain('water');
    expect(profile.gaps.length).toBeGreaterThan(0);
  });
});
