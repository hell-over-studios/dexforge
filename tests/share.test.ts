/**
 * Unit tests for share-by-URL (src/lib/share.ts): v1 (team only) + v2 (team +
 * move slots) encode/decode round-trips, strict-but-tolerant parsing and
 * sanitizing on both directions (no oversized teams, no garbage in URLs).
 * v2 must keep v1 links working: v1 decodes to members with no moves.
 */
import { describe, expect, it } from 'vitest';
import { decodeTeam, encodeTeam, type ShareMember } from '../src/lib/share';

const member = (id: number, moves: number[] = []): ShareMember => ({ id, moves });

describe('encodeTeam / decodeTeam v1 (no moves)', () => {
  it('round-trips a full team of 6, preserving order', () => {
    const members = [25, 6, 150, 512, 3, 1000].map((id) => member(id));
    const payload = decodeTeam(encodeTeam('gold-silver', members));
    expect(payload).toEqual({ gameId: 'gold-silver', members });
  });

  it('accepts a plain id list (v1-era callers)', () => {
    const payload = decodeTeam(encodeTeam('gold-silver', [25, 6]));
    expect(payload?.members).toEqual([member(25), member(6)]);
  });

  it('round-trips a single member and an empty team', () => {
    expect(decodeTeam(encodeTeam('emerald', [member(1)]))).toEqual({
      gameId: 'emerald',
      members: [member(1)],
    });
    expect(decodeTeam(encodeTeam('emerald', []))).toEqual({ gameId: 'emerald', members: [] });
  });

  it('encodes ids as lowercase base36 (inspectable, compact)', () => {
    expect(encodeTeam('emerald', [1, 10, 255])).toBe('v1.emerald.1.a.73');
  });

  it('caps at 6 slots when encoding', () => {
    const encoded = encodeTeam('emerald', [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(decodeTeam(encoded)?.members.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('drops invalid ids when encoding', () => {
    expect(decodeTeam(encodeTeam('red-blue', [7, -2, 0, 3.5, 9]))?.members).toEqual([
      member(7),
      member(9),
    ]);
  });

  it('accepts every launch game slug (hyphenated ids stay intact)', () => {
    for (const gameId of ['red-blue', 'gold-silver', 'emerald']) {
      expect(decodeTeam(encodeTeam(gameId, [4]))?.gameId).toBe(gameId);
    }
  });
});

describe('encodeTeam / decodeTeam v2 (moves)', () => {
  it('switches to v2 only when a member has moves', () => {
    expect(encodeTeam('emerald', [member(1), member(2)])).toBe('v1.emerald.1.2');
    expect(encodeTeam('emerald', [member(1), member(2, [33])])).toBe('v2.emerald.1.2:x');
  });

  it('encodes members without moves as a bare id inside v2', () => {
    const payload = decodeTeam('v2.emerald.fd.4:1.2a:1,a.9f:f');
    expect(payload?.members).toEqual([
      member(553),
      member(4, [1]),
      member(82, [1, 10]),
      member(339, [15]),
    ]);
  });

  it('round-trips move ids as base36, order-preserving', () => {
    const members = [member(253, [33, 34, 35, 36]), member(1, [45])];
    const encoded = encodeTeam('emerald', members);
    expect(encoded).toBe('v2.emerald.71:x,y,z,10.1:19');
    expect(decodeTeam(encoded)).toEqual({ gameId: 'emerald', members });
  });

  it('caps moves at 4 and drops duplicates/invalid ids', () => {
    const encoded = encodeTeam('emerald', [member(1, [5, 5, -1, 0, 2, 3, 4, 6])]);
    expect(decodeTeam(encoded)?.members[0].moves).toEqual([5, 2, 3, 4]);
  });

  it('caps the team at 6 members but keeps their moves', () => {
    const team = [1, 2, 3, 4, 5, 6, 7].map((id) => member(id, [id + 1]));
    const payload = decodeTeam(encodeTeam('emerald', team));
    expect(payload?.members.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(payload?.members[5].moves).toEqual([7]);
  });
});

describe('decodeTeam v1 backward compatibility', () => {
  it('decodes a v1 link into members with empty moves', () => {
    expect(decodeTeam('v1.emerald.1.4.o.fd')).toEqual({
      gameId: 'emerald',
      members: [member(1), member(4), member(24), member(553)],
    });
  });

  it('accepts a bare v1.<game> (empty team)', () => {
    expect(decodeTeam('v1.red-blue')?.members).toEqual([]);
  });
});

describe('decodeTeam rejects', () => {
  it('unknown version prefixes', () => {
    expect(decodeTeam('v3.emerald.1')).toBeNull();
    expect(decodeTeam('emerald.1')).toBeNull();
  });

  it('garbage / unsafe url payloads', () => {
    expect(decodeTeam('')).toBeNull();
    expect(decodeTeam('v1.')).toBeNull();
    expect(decodeTeam('v1.bad game!')).toBeNull();
    expect(decodeTeam('v1.emerald.@@')).toBeNull();
    expect(decodeTeam('v2.')).toBeNull();
    expect(decodeTeam('v2.bad game!')).toBeNull();
  });

  it('malformed v2 members and move lists', () => {
    expect(decodeTeam('v2.emerald.')).toBeNull();
    expect(decodeTeam('v2.emerald.1:')).toBeNull();
    expect(decodeTeam('v2.emerald.1:2,')).toBeNull();
    expect(decodeTeam('v2.emerald.1:2:3')).toBeNull();
    expect(decodeTeam('v2.emerald.:1')).toBeNull();
    expect(decodeTeam('v2.emerald.1:@')).toBeNull();
    expect(decodeTeam('v2.emerald.1:2.@@')).toBeNull();
  });

  it('parses odd-but-safe id segments instead of crashing', () => {
    expect(decodeTeam('v1.emerald.zz')).toEqual({ gameId: 'emerald', members: [member(1295)] });
    expect(decodeTeam('v2.emerald.zz:zz')?.members).toEqual([member(1295, [1295])]);
  });
});
