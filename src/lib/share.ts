/**
 * Share-by-URL (T2.9, v2 in T4.2): encode the current game + team into a
 * single `?t=<value>` query value. Deliberately human-inspectable and
 * server-free (PROMPT: state lives entirely in the URL/localStorage):
 *
 *   v1.<gameId>.<idBase36>[.<idBase36>…]                       (no moves)
 *   v2.<gameId>.<member>[.<member>…]                           (with moves)
 *   member = <idBase36>[:<moveIdBase36>,<moveIdBase36>…]        (max 4)
 *
 * `gameId` may contain hyphens (`red-blue`), so ids are separated by dots and
 * written in lowercase base36 (e.g. `v1.emerald.1.4.o.fd`). Encoding emits v1
 * while no member has a move selected, so old links and new empty-team links
 * stay backwards compatible; v1 decoding still works and yields members with
 * no moves. Strict-ish decode: wrong version or malformed segments → null
 * instead of half-garbage.
 */
import { MAX_MOVES } from './moves';
import { TEAM_SIZE } from './team';

const ID_ALPHABET = /^[a-z0-9]+$/;
const GAME_ALPHABET = /^[a-z0-9-]+$/;
const MEMBER = /^([a-z0-9]+)(?::([a-z0-9]+(?:,[a-z0-9]+)*))?$/;
const V1 = 'v1';
const V2 = 'v2';

export interface ShareMember {
  /** national dex id */
  id: number;
  /** national move ids, order-preserving, at most MAX_MOVES */
  moves: number[];
}

export interface SharePayload {
  gameId: string;
  members: ShareMember[];
}

/** negative / non-integer / duplicated / oversized entries are dropped */
const sanitizeMoveIds = (ids: readonly number[]): number[] => {
  const clean: number[] = [];
  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0 || clean.includes(id)) continue;
    clean.push(id);
    if (clean.length >= MAX_MOVES) break;
  }
  return clean;
};

const sanitizeMembers = (members: readonly ShareMember[]): ShareMember[] => {
  const clean: ShareMember[] = [];
  for (const member of members) {
    if (!Number.isInteger(member.id) || member.id <= 0) continue;
    clean.push({ id: member.id, moves: sanitizeMoveIds(member.moves) });
    if (clean.length >= TEAM_SIZE) break;
  }
  return clean;
};

/** `number[]` (v1-era callers) and `ShareMember[]` are both accepted. */
const toMembers = (team: readonly ShareMember[] | readonly number[]): ShareMember[] => {
  const first = team[0];
  if (typeof first === 'number') {
    return (team as readonly number[]).map((id) => ({ id, moves: [] }));
  }
  return [...(team as readonly ShareMember[])];
};

const parseBase36 = (raw: string): number | null => {
  if (!ID_ALPHABET.test(raw)) return null;
  const id = parseInt(raw, 36);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export function encodeTeam(
  gameId: string,
  team: readonly ShareMember[] | readonly number[],
): string {
  const members = sanitizeMembers(toMembers(team));
  if (members.every((member) => member.moves.length === 0)) {
    return [V1, gameId, ...members.map((member) => member.id.toString(36))].join('.');
  }
  return [
    V2,
    gameId,
    ...members.map((member) => {
      const id = member.id.toString(36);
      return member.moves.length > 0
        ? `${id}:${member.moves.map((moveId) => moveId.toString(36)).join(',')}`
        : id;
    }),
  ].join('.');
}

/** null when the value does not parse as a v1 or v2 payload */
export function decodeTeam(value: string): SharePayload | null {
  const parts = value.trim().split('.');
  if (parts.length < 2) return null;
  const [version, gameId, ...rawMembers] = parts;
  if (!GAME_ALPHABET.test(gameId)) return null;

  if (version === V1) {
    const members: ShareMember[] = [];
    for (const raw of rawMembers) {
      const id = parseBase36(raw);
      if (id === null) return null;
      members.push({ id, moves: [] });
    }
    return { gameId, members: sanitizeMembers(members) };
  }

  if (version !== V2) return null;
  const members: ShareMember[] = [];
  for (const raw of rawMembers) {
    const match = MEMBER.exec(raw);
    if (!match) return null;
    const id = parseBase36(match[1]);
    if (id === null) return null;
    const moves: number[] = [];
    if (match[2]) {
      for (const rawMove of match[2].split(',')) {
        const moveId = parseBase36(rawMove);
        if (moveId === null) return null;
        moves.push(moveId);
      }
    }
    members.push({ id, moves });
  }
  return { gameId, members: sanitizeMembers(members) };
}
