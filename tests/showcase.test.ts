/**
 * UX-12 (#88): every example team must be playable in its game — six distinct
 * species that exist in that game's generated dataset.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { GameData, GamesRegistry } from '../src/lib/data-schema';
import { EXAMPLE_TEAMS, GAME_FEATURED } from '../src/lib/showcase';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const hasData = existsSync(path.join(DATA, 'games.json'));

describe.skipIf(!hasData)('showcase data fits each game', () => {
  const registry = JSON.parse(
    readFileSync(path.join(DATA, 'games.json'), 'utf-8'),
  ) as GamesRegistry;

  for (const { id } of registry.games) {
    it(`${id}: example team and featured species are in the game`, () => {
      const data = JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData;
      const ids = new Set(data.pokemon.map((p) => p.id));
      const team = EXAMPLE_TEAMS[id];
      expect(team, `${id} has no example team`).toBeDefined();
      expect(new Set(team).size).toBe(6);
      for (const member of team) expect(ids.has(member), `${id}: #${member} not in dex`).toBe(true);
      const featured = GAME_FEATURED[id];
      expect(featured, `${id} has no featured species`).toBeDefined();
      expect(ids.has(featured.id), `${id}: featured #${featured.id} not in dex`).toBe(true);
    });
  }
});
