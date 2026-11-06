import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { GameData, GamesRegistry } from '../src/lib/data-schema';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');

// The data files are produced by `pnpm run data` (network + cache) and are
// validated in-depth by `pnpm run data:check` in CI. Here we only run the
// full JSON through a structural smoke test; skipped if data not generated.
const registry = existsSync(path.join(DATA, 'games.json'));

beforeAll(() => {
  if (!registry) console.warn('public/data missing — run `pnpm run data` to generate the datasets');
});

describe.skipIf(!registry)('generated data snapshot', () => {
  it('games.json lists the 3 launch games', () => {
    const reg = JSON.parse(readFileSync(path.join(DATA, 'games.json'), 'utf-8')) as GamesRegistry;
    expect(reg.games.map((g) => g.id).sort()).toEqual(['emerald', 'gold-silver', 'red-blue']);
  });

  for (const id of ['red-blue', 'gold-silver', 'emerald']) {
    it(`${id}.json is complete and sane`, () => {
      const data = JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData;
      expect(data.meta.id).toBe(id);
      expect(data.pokemon.length).toBe(data.meta.pokemonCount);
      expect(new Set(data.pokemon.map((p) => p.id)).size).toBe(data.pokemon.length);
      for (const p of data.pokemon) {
        expect(p.types.length).toBeGreaterThan(0);
        expect(p.sprites.official).toBeTruthy();
        expect(Object.values(p.stats).every((v) => v > 0 && v < 256)).toBe(true);
      }
    });
  }

  it('red-blue has no Dark/Steel chart rows and magnemite is electric-only', () => {
    const data = JSON.parse(readFileSync(path.join(DATA, 'red-blue.json'), 'utf-8')) as GameData;
    expect(Object.keys(data.typeChart)).not.toContain('dark');
    expect(Object.keys(data.typeChart)).not.toContain('steel');
    expect(Object.keys(data.typeChart)).not.toContain('fairy');
    const mag = data.pokemon.find((p) => p.slug === 'magnemite')!;
    expect(mag.types).toEqual(['electric']);
  });

  it('gold-silver chart: Steel resists Ghost & Dark, no Fairy', () => {
    const data = JSON.parse(readFileSync(path.join(DATA, 'gold-silver.json'), 'utf-8')) as GameData;
    expect(data.typeChart['ghost']?.['steel']).toBe(0.5);
    expect(data.typeChart['dark']?.['steel']).toBe(0.5);
    expect(Object.keys(data.typeChart)).not.toContain('fairy');
  });

  it('every dataset has at least one curated encounter', () => {
    for (const id of ['red-blue', 'gold-silver', 'emerald']) {
      const data = JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData;
      const curated = data.pokemon.flatMap((p) =>
        p.encounters.filter((e) => e.source === 'curated'),
      );
      expect(curated.length).toBeGreaterThan(0);
    }
  });
});
