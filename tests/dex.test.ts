/**
 * Unit tests for the picker data layer (src/lib/dex.ts) per issue #15:
 * index building/shape/order, accent-insensitive ES/EN search, numeric search.
 */
import { describe, expect, it } from 'vitest';
import { buildDexIndex, normalizeText, searchDex, type DexEntry } from '../src/lib/dex';
import type { GameData, GamePokemon } from '../src/lib/data-schema';

/* ---- fixtures: shaped like the real emitted datasets but tiny ---- */

const mkPokemon = (over: Partial<GamePokemon> & Pick<GamePokemon, 'id' | 'slug'>): GamePokemon => ({
  name: { es: over.slug, en: over.slug },
  dexNumber: over.id,
  formSlug: over.slug,
  generationSlug: 'generation-ii',
  types: [],
  stats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
  abilities: [],
  height: 0,
  weight: 0,
  captureRate: null,
  sprites: { game: null, shinyGame: null, official: null, showdown: null, home: null },
  evolution: null,
  encounters: [],
  ...over,
});

const fixture: GameData = {
  meta: {
    id: 'gold-silver',
    label: { es: 'Oro / Plata', en: 'Gold / Silver' },
    generation: 2,
    generationSlug: 'generation-ii',
    versionGroup: 'gold-silver',
    versions: ['gold', 'silver'],
    region: 'johto',
    pokedexes: [],
    generatedAt: '2026-11-06T00:00:00.000Z',
    pokemonCount: 3,
    dataGaps: [],
  },
  typeChart: {},
  pokemon: [
    mkPokemon({
      id: 172,
      slug: 'pichu',
      name: { es: 'Pichu', en: 'Pichu' },
      dexNumber: 1,
      types: ['electric'],
      sprites: {
        game: null,
        shinyGame: null,
        official: 'http://x/pichu.png',
        showdown: null,
        home: null,
      },
    }),
    mkPokemon({
      id: 25,
      slug: 'pikachu',
      name: { es: 'Pikachu', en: 'Pikachu' },
      dexNumber: 2,
      types: ['electric'],
      sprites: {
        game: 'http://x/pikachu.png',
        shinyGame: null,
        official: 'http://x/pikachu-art.png',
        showdown: null,
        home: null,
      },
    }),
    mkPokemon({
      id: 26,
      slug: 'raichu',
      name: { es: 'Raichu', en: 'Raichu' },
      dexNumber: 3,
      types: ['electric'],
      sprites: { game: null, shinyGame: null, official: null, showdown: null, home: null },
    }),
    mkPokemon({
      id: 152,
      slug: 'chikorita',
      name: { es: 'Chikorita', en: 'Chikorita' },
      dexNumber: 152,
      types: ['grass'],
      sprites: { game: null, shinyGame: null, official: null, showdown: null, home: null },
    }),
  ],
};

/* ---- normalizeText ---- */

describe('normalizeText', () => {
  it('lower-cases and strips accents/tildes', () => {
    expect(normalizeText('Ñoño Árbol Índigo Última')).toBe('nono arbol indigo ultima');
  });

  it('is stable for plain ascii text', () => {
    expect(normalizeText('Pichu')).toBe('pichu');
  });
});

/* ---- buildDexIndex ---- */

describe('buildDexIndex', () => {
  it('orders by in-game dex number, regardless of input array order', () => {
    const entries = buildDexIndex(fixture);
    expect(entries.map((e) => e.slug)).toEqual(['pichu', 'pikachu', 'raichu', 'chikorita']);
  });

  it('keeps national id apart from in-game dex number', () => {
    const entries = buildDexIndex(fixture);
    const pikachu = entries[1];
    expect(pikachu.id).toBe(25);
    expect(pikachu.dexNumber).toBe(2);
  });

  it('picks the official artwork (only visual, owner directive)', () => {
    const entries = buildDexIndex(fixture);
    expect(entries[1].spriteUrl).toBe('http://x/pikachu-art.png');
    expect(entries[0].spriteUrl).toBe('http://x/pichu.png');
    expect(entries[2].spriteUrl).toBeNull();
    expect(entries[2].types).toEqual(['electric']);
  });
});

/* ---- searchDex ---- */

describe('searchDex', () => {
  const entries: DexEntry[] = buildDexIndex(fixture);

  it('returns every entry when the query is empty or whitespace', () => {
    expect(searchDex(entries, '')).toHaveLength(4);
    expect(searchDex(entries, '   ')).toHaveLength(4);
  });

  it('matches ES/EN names, case-insensitively', () => {
    expect(searchDex(entries, 'PIKA').map((e) => e.slug)).toEqual(['pikachu']);
    expect(searchDex(entries, 'chi').map((e) => e.slug)).toEqual(['chikorita']);
  });

  it('matches substrings, not only prefixes', () => {
    expect(searchDex(entries, 'chu').map((e) => e.slug)).toEqual(['pichu', 'pikachu', 'raichu']);
  });

  it('is accent-insensitive in ES', () => {
    // tie a synthetic accented ES name (accent here is only pronounced: "Ráichu"-style)
    const accented = searchDex(
      entries.map((e) => (e.slug === 'raichu' ? { ...e, name: { ...e.name, es: 'Ráichu' } } : e)),
      'raichu',
    );
    expect(accented.map((e) => e.slug)).toEqual(['raichu']);
  });

  it('matches national dex id and in-game dex number', () => {
    expect(searchDex(entries, '25').map((e) => e.slug)).toEqual(['pikachu']);
    expect(searchDex(entries, '26').map((e) => e.slug)).toEqual(['raichu']);
    // numeric matching is a substring search over the id: queries like '2'
    // legitimately hit id 25/26 and game-dex 152/172
    expect(searchDex(entries, '2')).toHaveLength(4);
    expect(searchDex(entries, '152').map((e) => e.slug)).toEqual(['chikorita']);
  });

  it('matches by slug', () => {
    expect(searchDex(entries, 'pichu').map((e) => e.slug)).toEqual(['pichu']);
  });

  it('returns dex order for non-empty results', () => {
    expect(searchDex(entries, 'chu').map((e) => e.dexNumber)).toEqual([1, 2, 3]);
  });

  it('never loses rows silently on unknown queries', () => {
    expect(searchDex(entries, 'zzz')).toEqual([]);
  });
});
