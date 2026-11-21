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
  it('games.json keeps the launch games and every registered game', () => {
    const reg = JSON.parse(readFileSync(path.join(DATA, 'games.json'), 'utf-8')) as GamesRegistry;
    const ids = reg.games.map((g) => g.id);
    expect(ids).toEqual(expect.arrayContaining(['red-blue', 'gold-silver', 'emerald']));
    expect(new Set(ids).size).toBe(ids.length);
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

  it('every dataset ships a resolvable, generation-accurate move index', () => {
    for (const id of ['red-blue', 'gold-silver', 'emerald']) {
      const data = JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData;
      expect(Object.keys(data.moves).length).toBeGreaterThan(100);
      for (const p of data.pokemon) {
        expect(p.moves.length).toBeGreaterThan(0);
        for (const [moveId, method, level] of p.moves) {
          const move = data.moves[String(moveId)];
          expect(move, `${id} ${p.slug} move ${moveId}`).toBeTruthy();
          expect(move.generation).toBeLessThanOrEqual(data.meta.generation);
          if (method === 'level-up') expect(level).toBeGreaterThanOrEqual(0);
          else expect(level).toBeNull();
        }
      }
    }
  });

  it('keeps Gen-I move quirks per game (types, power, accuracy)', () => {
    const rb = JSON.parse(readFileSync(path.join(DATA, 'red-blue.json'), 'utf-8')) as GameData;
    const rbMove = (slug: string) => Object.values(rb.moves).find((m) => m.slug === slug);
    expect(rbMove('bite')?.type).toBe('normal');
    expect(rbMove('gust')?.type).toBe('normal');
    expect(rbMove('karate-chop')?.type).toBe('normal');
    expect(rbMove('flamethrower')?.power).toBe(95);
    expect(rbMove('thunder')?.power).toBe(120);
    expect(rbMove('blizzard')?.accuracy).toBe(90);

    const gs = JSON.parse(readFileSync(path.join(DATA, 'gold-silver.json'), 'utf-8')) as GameData;
    const gsMove = (slug: string) => Object.values(gs.moves).find((m) => m.slug === slug);
    expect(gsMove('bite')?.type).toBe('dark');
    expect(gsMove('flamethrower')?.power).toBe(95);
    expect(gsMove('crunch')?.damageClass).toBe('special');
    const cyndaquil = gs.pokemon.find((p) => p.slug === 'cyndaquil')!;
    expect(cyndaquil.moves.some(([id]) => gs.moves[String(id)]?.slug === 'ember')).toBe(true);
  });

  it('ships abilities only from Gen III on, with resolvable refs and inGame flags', () => {
    const rb = JSON.parse(readFileSync(path.join(DATA, 'red-blue.json'), 'utf-8')) as GameData;
    const gs = JSON.parse(readFileSync(path.join(DATA, 'gold-silver.json'), 'utf-8')) as GameData;
    expect(Object.keys(rb.abilities)).toHaveLength(0);
    expect(Object.keys(gs.abilities)).toHaveLength(0);
    expect(rb.pokemon.every((p) => p.abilities.length === 0)).toBe(true);

    const em = JSON.parse(readFileSync(path.join(DATA, 'emerald.json'), 'utf-8')) as GameData;
    expect(Object.keys(em.abilities).length).toBeGreaterThan(100);
    expect(em.abilities['levitate']).toMatchObject({
      slug: 'levitate',
      name: { en: 'Levitate', es: 'Levitación' },
      generation: 3,
    });
    expect(em.abilities['levitate'].effect.es).toContain('Tierra');
    for (const p of em.pokemon) {
      expect(p.abilities.length).toBeGreaterThan(0);
      for (const a of p.abilities) {
        const info = em.abilities[a.slug];
        expect(info, `${p.slug} ${a.slug}`).toBeTruthy();
        expect(a.inGame).toBe(info.generation <= em.meta.generation);
        expect(a.name.es.length).toBeGreaterThan(0);
      }
    }
    const wingull = em.pokemon.find((p) => p.slug === 'wingull')!;
    expect(wingull.abilities.find((a) => a.slug === 'hydration')?.inGame).toBe(false);
    expect(wingull.abilities.find((a) => a.slug === 'keen-eye')?.inGame).toBe(true);
  });
});
