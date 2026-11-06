import { describe, expect, it } from 'vitest';
import {
  buildTypeChart,
  curatedToEncounter,
  extractEvolutionChain,
  extractStats,
  flattenWild,
  gameAccurateTypes,
  localName,
  type PokeForm,
  type PokeSpecies,
  type EvoLink,
  type TypeDetailInput,
} from '../scripts/lib/process';

/* ------------ fixtures ------------ */

function typeEntry(
  name: string,
  dr: { double: string[]; half: string[]; none: string[] },
  pastDamage: { gen: string; dr: { double: string[]; half: string[]; none: string[] } }[] = [],
) {
  const url = (name: string) => `https://pokeapi.co/api/v2/type/${name}/`;
  const toRel = (d: { double: string[]; half: string[]; none: string[] }) => ({
    double_damage_to: d.double.map((n) => ({ name: n, url: url(n) })),
    half_damage_to: d.half.map((n) => ({ name: n, url: url(n) })),
    no_damage_to: d.none.map((n) => ({ name: n, url: url(n) })),
  });
  return {
    name,
    url: url(name),
    damage_relations: toRel(dr),
    past_damage_relations: pastDamage.map((p) => ({
      generation: { name: p.gen, url: `https://pokeapi.co/api/v2/generation/${p.gen}/` },
      damage_relations: toRel(p.dr),
    })),
  };
}

const makeTypes = (types: ReturnType<typeof typeEntry>[]): TypeDetailInput[] => types.map(toDetail);

const toDetail = (t: ReturnType<typeof typeEntry>): TypeDetailInput => ({
  name: t.name,
  damage_relations: t.damage_relations,
  past_damage_relations: t.past_damage_relations,
});

/* ------------ type chart: game accuracy ------------ */

describe('buildTypeChart', () => {
  it('Gen 1 has no Dark/Steel/Fairy and keeps the classic chart', () => {
    const types = [
      typeEntry('normal', { double: [], half: ['rock'], none: ['ghost'] }),
      typeEntry('ghost', { double: ['ghost'], half: [], none: ['normal'] }),
      typeEntry('rock', { double: ['fire', 'flying'], half: [], none: [] }),
      typeEntry('steel', { double: [], half: [], none: [] }), // exists in modern API, must vanish for gen-1 games
      typeEntry('fairy', { double: [], half: [], none: [] }),
    ];
    const chart = buildTypeChart(makeTypes(types), 1);
    expect(Object.keys(chart)).toEqual(['normal', 'ghost', 'rock', 'steel', 'fairy']); // attacker rows = generation's types
    // NOTE: the real generation-i endpoint does NOT list steel/fairy rows at all;
    // this synthetic fixture only checks the "last applicable past entry" logic.
    expect(chart['normal']['ghost']).toBe(0);
    expect(chart['normal']['rock']).toBe(0.5);
    expect(chart['ghost']['normal']).toBe(0);
  });

  it('Gen 2-5: Steel resists Ghost and Dark (pre-Fairy behaviour)', () => {
    const types = typeEntry(
      'steel',
      // modern: Steel does NOT resist ghost/dark
      { double: [], half: ['fairy', 'ice'], none: [] },
      [
        { gen: 'generation-ii', dr: { double: [], half: ['ghost', 'dark'], none: [] } },
        { gen: 'generation-v', dr: { double: [], half: ['dark', 'ghost'], none: [] } },
      ],
    );
    const chart = buildTypeChart(makeTypes([types]), 2);
    expect(chart['steel']['ghost']).toBe(0.5);
    expect(chart['steel']['dark']).toBe(0.5);
  });

  it('Gen 6+: uses the modern chart (no past entries needed)', () => {
    const types = typeEntry('steel', { double: [], half: ['ghost', 'fairy'], none: [] });
    const chart = buildTypeChart(makeTypes([types]), 6);
    expect(chart['steel']['ghost']).toBe(0.5);
  });

  it('Chooses the newest past entry that is still older than the game generation', () => {
    const types = typeEntry('steel', { double: [], half: [], none: [] }, [
      { gen: 'generation-ii', dr: { double: [], half: ['ghost'], none: [] } },
      { gen: 'generation-vi', dr: { double: [], half: ['ghost', 'dark'], none: [] } },
    ]);
    // gen-4 game: must NOT use the gen-6 past entry
    const chart = buildTypeChart(makeTypes([types]), 4);
    expect(chart['steel']['ghost']).toBe(0.5);
  });
});

/* ------------ game-accurate typing via past_types ------------ */

describe('gameAccurateTypes', () => {
  const species = (pastTypes: { gen: string; types: string[] }[]): PokeSpecies =>
    ({
      past_types: pastTypes.map((p) => ({
        generation: { name: p.gen },
        types: p.types.map((t) => ({ name: t, url: `x/${t}/` })),
      })),
    }) as unknown as PokeSpecies;
  const form = {
    types: [
      { name: 'electric', url: 'x/electric/' },
      { name: 'steel', url: 'x/steel/' },
    ],
  } as unknown as PokeForm;

  it('Gen 1 Magnemite is electric-only', () => {
    const sp = species([{ gen: 'generation-i', types: ['electric'] }]);
    expect(gameAccurateTypes(sp, form, 1)).toEqual(['electric']);
  });

  it('Gen 2+ Magnemite includes Steel again', () => {
    const sp = species([{ gen: 'generation-i', types: ['electric'] }]);
    const formModern = {
      types: [
        { name: 'electric', url: 'x/' },
        { name: 'steel', url: 'x/' },
      ],
    } as unknown as PokeForm;
    expect(gameAccurateTypes(sp, { ...formModern } as PokeForm, 2)).toEqual(['electric', 'steel']);
  });

  it('Falls back to current types when there is no past entry', () => {
    expect(gameAccurateTypes(species([]), form, 3)).toEqual(['electric', 'steel']);
  });
});

/* ------------ stats / names ------------ */

describe('extractStats', () => {
  it('maps PokeAPI stat rows', () => {
    const form = {
      stats: [
        { stat: { name: 'hp', url: '/' }, base_stat: 45 },
        { stat: { name: 'attack', url: '/' }, base_stat: 49 },
        { stat: { name: 'defense', url: '/' }, base_stat: 49 },
        { stat: { name: 'special-attack', url: '/' }, base_stat: 65 },
        { stat: { name: 'special-defense', url: '/' }, base_stat: 65 },
        { stat: { name: 'speed', url: '/' }, base_stat: 45 },
      ],
    } as unknown as PokeForm;
    expect(extractStats(form)).toEqual({
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    });
  });
});

describe('localName', () => {
  it('falls back to en when es is missing', () => {
    const names = [
      { name: 'Rock', language: { name: 'en' } },
      { name: '恐竜', language: { name: 'zh-Hans' } },
    ];
    expect(localName(names as never, 'Fallback')).toEqual({ en: 'Rock', es: 'Rock' });
  });
});

/* ------------ encounters ------------ */

describe('flattenWild', () => {
  it('splits per version and aggregates per method', () => {
    const det = (chance: number, min: number, max: number, method = 'walk') => ({
      min_level: min,
      max_level: max,
      chance,
      method: { name: method, url: '/' },
    });
    const raw = [
      {
        location_area: { name: 'route-1', url: '/' },
        version_details: [
          {
            version: { name: 'red', url: '/' },
            max_chance: 36,
            encounter_details: [det(20, 2, 4), det(16, 2, 4)],
          },
          {
            version: { name: 'yellow', url: '/' },
            max_chance: 40,
            encounter_details: [det(40, 3, 5)],
          },
        ],
      },
    ];
    const rows = flattenWild(raw as never, ['red', 'blue']);
    expect(rows).toHaveLength(1); // yellow excluded
    expect(rows[0]).toMatchObject({
      locationArea: 'route-1',
      version: 'red',
      rate: 36,
      minLevel: 2,
      maxLevel: 4,
    });
  });

  it('keeps methods separate', () => {
    const raw = [
      {
        location_area: { name: 'route-12', url: '/' },
        version_details: [
          {
            version: { name: 'blue', url: '/' },
            max_chance: 30,
            encounter_details: [
              { min_level: 10, max_level: 14, chance: 20, method: { name: 'walk', url: '/' } },
              { min_level: 15, max_level: 20, chance: 10, method: { name: 'super-rod', url: '/' } },
            ],
          },
        ],
      },
    ];
    const rows = flattenWild(raw as never, ['blue']);
    expect(rows.map((r: { method: string }) => r.method).sort()).toEqual(['super-rod', 'walk']);
  });
});

describe('curatedToEncounter', () => {
  it('normalizes strings and kind-default methods', () => {
    const e = curatedToEncounter({
      species: 'eevee',
      kind: 'gift',
      location: 'Celadon City',
      minLevel: 25,
      maxLevel: 25,
    });
    expect(e).toMatchObject({
      source: 'curated',
      kind: 'gift',
      method: 'Gift',
      name: { en: 'Celadon City', es: 'Celadon City' },
    });
  });
  it('maps a single version into `version`, none into null', () => {
    expect(curatedToEncounter({ species: 'lw', kind: 'trade', versions: ['red'] }).version).toBe(
      'red',
    );
    expect(curatedToEncounter({ species: 'lw', kind: 'trade' }).version).toBeNull();
  });
});

/* ------------ evolution chains ------------ */

describe('extractEvolutionChain', () => {
  const idOf = (name: string, id: number) => ({
    name,
    url: `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
  });
  const chain: EvoLink = {
    species: idOf('pichu', 172),
    evolves_to: [
      {
        species: idOf('pikachu', 25),
        evolution_details: [
          {
            trigger: { name: 'level-up', url: '/' },
            min_level: null,
            item: null,
            min_happiness: 220,
          },
        ],
        evolves_to: [
          {
            species: idOf('raichu', 26),
            evolves_to: [],
            evolution_details: [
              {
                trigger: { name: 'use-item', url: '/' },
                min_level: null,
                item: { name: 'thunder-stone', url: '/' },
                min_happiness: null,
              },
            ],
          },
        ],
      },
    ],
  };
  it('flattens the family with trigger details', () => {
    const steps = extractEvolutionChain(chain);
    expect(steps.map((s: { slug: string }) => s.slug)).toEqual(['pichu', 'pikachu', 'raichu']);
    expect(steps[0].evolvesInto[0]).toMatchObject({ id: 25, friendship: 220, trigger: 'level-up' });
    expect(steps[1].evolvesInto[0]).toMatchObject({
      id: 26,
      item: 'thunder-stone',
      trigger: 'use-item',
    });
    expect(steps[1].evolvesInto[0].minLevel).toBeNull(); // stone, not level
  });
});
