/**
 * Unit tests for the team profile layer (T3.3, src/lib/roles.ts): stat
 * averaging, the v1 role heuristic (documented thresholds) and radar geometry.
 */
import { describe, expect, it } from 'vitest';
import type { Stats } from '../src/lib/data-schema';
import { detectRole, radarPolygon, RADAR_CAP, teamAverageStats } from '../src/lib/roles';

const stats = (o: Partial<Stats> & { hp?: number; speed?: number }): Stats => ({
  hp: 70,
  attack: 70,
  defense: 70,
  specialAttack: 70,
  specialDefense: 70,
  speed: 70,
  ...o,
});

describe('teamAverageStats', () => {
  it('averages each stat across members and rounds to the whole', () => {
    const avg = teamAverageStats([
      stats({ hp: 80, attack: 100, speed: 60 }),
      stats({ hp: 81, attack: 101, speed: 71 }),
    ]);
    expect(avg.hp).toBe(81);
    expect(avg.attack).toBe(101);
    expect(avg.speed).toBe(66);
    expect(avg.defense).toBe(70);
  });

  it('returns a zeroed block without members', () => {
    const avg = teamAverageStats([]);
    for (const v of Object.values(avg)) expect(v).toBe(0);
  });
});

describe('detectRole (v1 heuristic)', () => {
  it('sweepers: speed >= 90 with matching offense', () => {
    expect(detectRole(stats({ speed: 120, attack: 100, specialAttack: 60 }))).toBe('sweeper');
    expect(detectRole(stats({ speed: 120, attack: 60, specialAttack: 100 }))).toBe(
      'special-sweeper',
    );
  });

  it('not fast enough -> not a sweeper (Machamp-like)', () => {
    expect(detectRole(stats({ speed: 80, attack: 130 }))).toBe('support');
  });

  it('walls: one armor very high, the other >= 55 (Skarmory / Blissey)', () => {
    expect(
      detectRole(stats({ attack: 20, specialAttack: 20, defense: 140, specialDefense: 60 })),
    ).toBe('wall');
    expect(detectRole(stats({ defense: 10, specialDefense: 135, hp: 255 }))).toBe('wall');
  });

  it('tanks: armor >= 85 backed by hp >= 65, or two solid armors', () => {
    expect(detectRole(stats({ defense: 90, hp: 70 }))).toBe('tank');
    expect(detectRole(stats({ specialDefense: 95, hp: 70 }))).toBe('tank');
    expect(detectRole(stats({ defense: 86, specialDefense: 86, hp: 54 }))).toBe('tank');
  });

  it('falls back to support otherwise', () => {
    expect(detectRole(stats({ defense: 60, specialDefense: 60 }))).toBe('support');
  });
});

describe('radarPolygon', () => {
  it("places the top axis (hp) at 12 o'clock and sweeps clockwise", () => {
    const pts = radarPolygon(stats({}), 110, 88);
    expect(pts[0].key).toBe('hp');
    expect(pts[0].x).toBeCloseTo(110);
    expect(pts[0].y).toBeCloseTo(110 - 88 * (70 / RADAR_CAP));
    // second axis (attack) is 1/6 turn clockwise -> x > center
    expect(pts[1].x).toBeGreaterThan(110);
  });

  it('clamps values above the cap and keeps zero-length axes at center', () => {
    const pts = radarPolygon(stats({ attack: 999, speed: 0 }), 110, 88);
    // capped axis reaches the full radius (distance from center) even at 999
    expect(Math.hypot(pts[1].x - 110, pts[1].y - 110)).toBeCloseTo(88);
    expect(pts[5].x).toBeCloseTo(110);
    expect(pts[5].y).toBeCloseTo(110);
  });
});
