import { describe, expect, it } from 'vitest';
import {
  buildAbilityInfo,
  extractAbilities,
  normalizeText,
  type PokeAbility,
} from '../scripts/lib/process';
import { abilityEffect, abilityPeers, isAbilityInGame } from '../src/lib/abilities';
import type { AbilityInfo, GamePokemon } from '../src/lib/data-schema';

const ref = (name: string) => ({ name, url: `https://pokeapi.co/api/v2/x/${name}/` });

function makeAbility(overrides: Partial<PokeAbility> = {}): PokeAbility {
  return {
    name: 'static',
    generation: ref('generation-iii'),
    names: [
      { name: 'Static', language: { name: 'en' } },
      { name: 'Electricidad estática', language: { name: 'es' } },
    ],
    effect_entries: [
      {
        effect: 'Paralyzes on contact.',
        short_effect: 'Has a 30% chance of paralyzing attacking Pokémon on contact.',
        language: { name: 'en' },
      },
    ],
    flavor_text_entries: [
      {
        flavor_text: 'Puede paralizar\nal mínimo contacto.',
        language: { name: 'es' },
        version_group: ref('x-y'),
      },
      {
        flavor_text: 'Has a 30% chance of paralyzing\nattacking Pokémon.',
        language: { name: 'en' },
        version_group: ref('ruby-sapphire'),
      },
    ],
    ...overrides,
  };
}

function makeMon(id: number, abilities: string[]): GamePokemon {
  return {
    id,
    slug: `mon-${id}`,
    name: { en: `Mon ${id}`, es: `Mon ${id}` },
    dexNumber: id,
    formSlug: `mon-${id}`,
    generationSlug: 'generation-iii',
    types: ['normal'],
    stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
    abilities: abilities.map((slug, i) => ({
      slug,
      name: { en: slug, es: slug },
      slot: i + 1,
      hidden: false,
      inGame: true,
    })),
    height: 1,
    weight: 1,
    captureRate: null,
    sprites: { game: null, shinyGame: null, official: null, showdown: null, home: null },
    evolution: null,
    moves: [],
    encounters: [],
  };
}

describe('normalizeText', () => {
  it('collapses line breaks, form feeds and repeated spaces', () => {
    expect(normalizeText('  Puede paralizar\nal mínimo\fcontacto.  ')).toBe(
      'Puede paralizar al mínimo contacto.',
    );
  });
});

describe('buildAbilityInfo', () => {
  it('keeps localized names and picks the latest Spanish flavor text', () => {
    const ability = makeAbility({
      flavor_text_entries: [
        {
          flavor_text: 'Texto viejo',
          language: { name: 'es' },
          version_group: ref('x-y'),
        },
        {
          flavor_text: 'Puede paralizar al mínimo contacto.',
          language: { name: 'es' },
          version_group: ref('scarlet-violet'),
        },
      ],
    });
    const info = buildAbilityInfo(ability);
    expect(info.name).toEqual({ en: 'Static', es: 'Electricidad estática' });
    expect(info.effect.es).toBe('Puede paralizar al mínimo contacto.');
    expect(info.effect.en).toBe('Has a 30% chance of paralyzing attacking Pokémon on contact.');
    expect(info.generation).toBe(3);
  });

  it('falls back to es-419, then leaves es null when there is no Spanish text', () => {
    const latin = buildAbilityInfo(
      makeAbility({
        flavor_text_entries: [
          {
            flavor_text: 'Puede paralizar.',
            language: { name: 'es-419' },
            version_group: ref('sun-moon'),
          },
        ],
      }),
    );
    expect(latin.effect.es).toBe('Puede paralizar.');

    const noSpanish = buildAbilityInfo(
      makeAbility({
        flavor_text_entries: [
          {
            flavor_text: 'Has a 30% chance of paralyzing attacking Pokémon.',
            language: { name: 'en' },
            version_group: ref('ruby-sapphire'),
          },
        ],
      }),
    );
    expect(noSpanish.effect.es).toBeNull();
    expect(noSpanish.effect.en).toContain('30%');
  });
});

describe('extractAbilities', () => {
  const form = {
    abilities: [
      { ability: ref('static'), slot: 1, is_hidden: false },
      { ability: ref('motor-drive'), slot: 3, is_hidden: true },
    ],
  } as never;
  const dictionary = new Map<string, AbilityInfo>([
    [
      'static',
      {
        slug: 'static',
        name: { en: 'Static', es: 'Electricidad estática' },
        effect: { en: 'Paralyzes on contact.', es: 'Puede paralizar al contacto.' },
        generation: 3,
      },
    ],
    [
      'motor-drive',
      {
        slug: 'motor-drive',
        name: { en: 'Motor Drive', es: 'Electromotor' },
        effect: {
          en: 'Raises Speed when hit by Electric moves.',
          es: 'Sube la Velocidad con Electricidad.',
        },
        generation: 4,
      },
    ],
  ]);

  it('returns nothing before abilities existed (Gen 1-2)', () => {
    expect(extractAbilities(form, 2, dictionary)).toEqual([]);
  });

  it('keeps the ability data and flags later-generation abilities as not in game', () => {
    const gen3 = extractAbilities(form, 3, dictionary);
    expect(gen3.map((a) => [a.slug, a.inGame])).toEqual([
      ['static', true],
      ['motor-drive', false],
    ]);
    const gen4 = extractAbilities(form, 4, dictionary);
    expect(gen4.every((a) => a.inGame)).toBe(true);
    expect(gen4[0].name.es).toBe('Electricidad estática');
  });
});

describe('abilityEffect', () => {
  const info: AbilityInfo = {
    slug: 'static',
    name: { en: 'Static', es: 'Electricidad estática' },
    effect: { en: 'Paralyzes on contact.', es: null },
    generation: 3,
  };

  it('uses the requested language when available', () => {
    expect(abilityEffect(info, 'en')).toEqual({ text: 'Paralyzes on contact.', lang: 'en' });
    expect(abilityEffect(info, 'es')).toEqual({ text: 'Paralyzes on contact.', lang: 'en' });
  });

  it('stays empty when the ability has no info', () => {
    expect(abilityEffect(undefined, 'es')).toEqual({ text: '', lang: 'es' });
  });
});

describe('abilityPeers / isAbilityInGame', () => {
  it('lists other team members sharing the ability', () => {
    const a = makeMon(1, ['keen-eye']);
    const b = makeMon(2, ['keen-eye', 'drizzle']);
    const c = makeMon(3, ['static']);
    expect(abilityPeers([a, b, c], 'keen-eye', 1).map((m) => m.id)).toEqual([2]);
    expect(abilityPeers([a, b, c], 'keen-eye', 2).map((m) => m.id)).toEqual([1]);
    expect(abilityPeers([a, b, c], 'drizzle', 1).map((m) => m.id)).toEqual([2]);
  });

  it('guards by generation and assumes in-game when info is missing', () => {
    expect(isAbilityInGame({ generation: 4 } as AbilityInfo, 3)).toBe(false);
    expect(isAbilityInGame({ generation: 3 } as AbilityInfo, 3)).toBe(true);
    expect(isAbilityInGame(undefined, 3)).toBe(true);
  });
});
