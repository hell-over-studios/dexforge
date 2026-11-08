/**
 * Unit tests for the share-by-URL stub (T2.9, src/lib/share.ts): encode +
 * decode round-trips, tolerant-but-strict decode, and sanitizing on both
 * directions (no oversized teams, no garbage ids in URLs).
 */
import { describe, expect, it } from 'vitest';
import { decodeTeam, encodeTeam } from '../src/lib/share';

describe('encodeTeam / decodeTeam round-trip', () => {
  it('round-trips a full team of 6, preserving order', () => {
    const ids = [25, 6, 150, 512, 3, 1000];
    const payload = decodeTeam(encodeTeam('gold-silver', ids));
    expect(payload).toEqual({ gameId: 'gold-silver', ids });
  });

  it('round-trips a single member and an empty team', () => {
    expect(decodeTeam(encodeTeam('emerald', [1]))).toEqual({ gameId: 'emerald', ids: [1] });
    expect(decodeTeam(encodeTeam('emerald', []))).toEqual({ gameId: 'emerald', ids: [] });
  });

  it('encodes ids as lowercase base36 (inspectable, compact)', () => {
    expect(encodeTeam('emerald', [1, 10, 255])).toBe('v1.emerald.1.a.73');
  });

  it('caps at 6 slots when encoding', () => {
    const encoded = encodeTeam('emerald', [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(decodeTeam(encoded)?.ids).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('drops invalid ids when encoding', () => {
    expect(decodeTeam(encodeTeam('red-blue', [7, -2, 0, 3.5, 9]))?.ids).toEqual([7, 9]);
  });

  it('accepts every launch game slug (hyphenated ids stay intact)', () => {
    for (const gameId of ['red-blue', 'gold-silver', 'emerald']) {
      expect(decodeTeam(encodeTeam(gameId, [4]))?.gameId).toBe(gameId);
    }
  });
});

describe('decodeTeam rejects', () => {
  it('wrong version prefix', () => {
    expect(decodeTeam('v2.emerald.1')).toBeNull();
    expect(decodeTeam('emerald.1')).toBeNull();
  });

  it('garbage / unsafe url payloads', () => {
    expect(decodeTeam('')).toBeNull();
    expect(decodeTeam('v1.')).toBeNull();
    expect(decodeTeam('v1.bad game!')).toBeNull();
    expect(decodeTeam('v1.emerald.@@')).toBeNull();
  });

  it('parses odd-but-safe id segments instead of crashing', () => {
    expect(decodeTeam('v1.emerald.zz')).toEqual({ gameId: 'emerald', ids: [1295] });
  });

  it('accepts a bare v1.<game> (empty team)', () => {
    expect(decodeTeam('v1.red-blue')?.ids).toEqual([]);
  });
});
