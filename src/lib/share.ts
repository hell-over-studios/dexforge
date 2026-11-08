/**
 * Share-by-URL stub (T2.9): encode the current game + team of 6 into a
 * single `?t=<value>` query value. Deliberately human-inspectable and
 * server-free (PROMPT: state lives entirely in the URL/localStorage):
 *
 *   v1.<gameId>.<idBase36>[.<idBase36>…]
 *
 * gameId may contain hyphens (`red-blue`), so ids are separated by dots and
 * written in lowercase base36 (e.g. `v1.emerald.1.4.o.fd`). Strict-ish decode:
 * wrong version or malformed segments → null instead of half-garbage.
 */
import { TEAM_SIZE } from './team';

const ID_ALPHABET = /^[a-z0-9]+$/;
const GAME_ALPHABET = /^[a-z0-9-]+$/;
const VERSION = 'v1';

export interface SharePayload {
  gameId: string;
  ids: number[];
}

/** negative / non-integer / oversized entries are dropped, kept order-preserving */
const sanitize = (ids: number[]): number[] =>
  ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, TEAM_SIZE);

export function encodeTeam(gameId: string, ids: number[]): string {
  const clean = sanitize(ids);
  return [VERSION, gameId, ...clean.map((id) => id.toString(36))].join('.');
}

/** null when the value does not parse as a v1 payload */
export function decodeTeam(value: string): SharePayload | null {
  const parts = value.trim().split('.');
  if (parts.length < 2 || parts[0] !== VERSION) return null;
  const [version, gameId, ...rawIds] = parts;
  if (version !== VERSION || !GAME_ALPHABET.test(gameId)) return null;
  const ids: number[] = [];
  for (const raw of rawIds) {
    if (!ID_ALPHABET.test(raw)) return null;
    const id = parseInt(raw, 36);
    if (!Number.isInteger(id) || id <= 0) return null;
    ids.push(id);
  }
  return { gameId, ids: sanitize(ids) };
}
