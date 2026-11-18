import { describe, expect, it } from 'vitest';
import {
  buildMoveInfo,
  extractLearnset,
  gameAccurateDamageClass,
  localName,
  versionGroupGeneration,
  type PokeMove,
  type PokeMoveEntry,
} from '../scripts/lib/process';

const ref = (name: string) => ({ name, url: `https://pokeapi.co/api/v2/x/${name}/` });

type LearnRow = [versionGroup: string, method: string, level?: number];

function entry(move: string, rows: LearnRow[]): PokeMoveEntry {
  return {
    move: ref(move),
    version_group_details: rows.map(([versionGroup, method, level]) => ({
      level_learned_at: level ?? 0,
      move_learn_method: ref(method),
      version_group: ref(versionGroup),
    })),
  };
}

function makeMove(overrides: Partial<PokeMove> = {}): PokeMove {
  return {
    id: 1,
    name: 'tackle',
    accuracy: 100,
    power: 40,
    pp: 35,
    type: ref('normal'),
    damage_class: ref('physical'),
    generation: ref('generation-i'),
    names: [
      { name: 'Tackle', language: { name: 'en' } },
      { name: 'Placaje', language: { name: 'es' } },
    ],
    past_values: [],
    ...overrides,
  };
}

describe('extractLearnset', () => {
  it('keeps only the requested version group', () => {
    const entries = [
      entry('ember', [
        ['red-blue', 'level-up', 1],
        ['gold-silver', 'level-up', 7],
      ]),
      entry('scratch', [['red-blue', 'level-up', 1]]),
    ];
    expect(extractLearnset(entries, 'gold-silver')).toEqual([
      { slug: 'ember', method: 'level-up', level: 7 },
    ]);
  });

  it('dedupes by method priority and keeps the lowest level-up level', () => {
    const entries = [
      entry('flamethrower', [['emerald', 'machine']]),
      entry('flamethrower', [['emerald', 'level-up', 34]]),
      entry('ember', [
        ['emerald', 'level-up', 1],
        ['emerald', 'level-up', 7],
      ]),
      entry('psychic', [
        ['emerald', 'egg'],
        ['emerald', 'tutor'],
      ]),
    ];
    expect(extractLearnset(entries, 'emerald')).toEqual([
      { slug: 'ember', method: 'level-up', level: 1 },
      { slug: 'flamethrower', method: 'level-up', level: 34 },
      { slug: 'psychic', method: 'tutor', level: null },
    ]);
  });

  it('drops unsupported learn methods', () => {
    const entries = [entry('thunder-shock', [['gold-silver', 'light-ball-egg']])];
    expect(extractLearnset(entries, 'gold-silver')).toEqual([]);
  });

  it('returns machine moves with a null level', () => {
    const entries = [entry('surf', [['emerald', 'machine']])];
    expect(extractLearnset(entries, 'emerald')).toEqual([
      { slug: 'surf', method: 'machine', level: null },
    ]);
  });

  it('only unions machine rows from same-generation fallback groups', () => {
    const entries = [
      entry('fly', [['yellow', 'machine']]),
      entry('thunder-shock', [['yellow', 'level-up', 9]]),
      entry('sing', [['yellow', 'egg']]),
    ];
    expect(extractLearnset(entries, 'red-blue')).toEqual([]);
    expect(extractLearnset(entries, 'red-blue', ['yellow'])).toEqual([
      { slug: 'fly', method: 'machine', level: null },
    ]);
  });
});

describe('versionGroupGeneration', () => {
  it('maps the launch games and treats unknown groups as 0', () => {
    expect(versionGroupGeneration('red-blue')).toBe(1);
    expect(versionGroupGeneration('gold-silver')).toBe(2);
    expect(versionGroupGeneration('emerald')).toBe(3);
    expect(versionGroupGeneration('x-y')).toBe(6);
    expect(versionGroupGeneration('not-a-group')).toBe(0);
  });
});

describe('buildMoveInfo', () => {
  it('applies historical values that were in effect before a later group', () => {
    const flamethrower = makeMove({
      id: 53,
      name: 'flamethrower',
      power: 90,
      type: ref('fire'),
      damage_class: ref('special'),
      past_values: [{ version_group: ref('x-y'), power: 95, accuracy: null, pp: null, type: null }],
    });
    expect(buildMoveInfo(flamethrower, 1).power).toBe(95);
    expect(buildMoveInfo(flamethrower, 3).power).toBe(95);
    expect(buildMoveInfo(flamethrower, 6).power).toBe(90);
  });

  it('restores Gen-I types (Bite was Normal, not Dark)', () => {
    const bite = makeMove({
      id: 44,
      name: 'bite',
      type: ref('dark'),
      damage_class: ref('physical'),
      past_values: [
        {
          version_group: ref('gold-silver'),
          power: null,
          accuracy: null,
          pp: null,
          type: ref('normal'),
        },
      ],
    });
    expect(buildMoveInfo(bite, 1)).toMatchObject({ type: 'normal', damageClass: 'physical' });
    expect(buildMoveInfo(bite, 2)).toMatchObject({ type: 'dark', damageClass: 'special' });
  });

  it('uses the oldest applicable past entry (Tackle 35 -> 50 -> 40)', () => {
    const tackle = makeMove({
      id: 33,
      past_values: [
        {
          version_group: ref('black-white'),
          power: 35,
          accuracy: 95,
          pp: null,
          type: null,
        },
        { version_group: ref('sun-moon'), power: 50, accuracy: null, pp: null, type: null },
      ],
    });
    expect(buildMoveInfo(tackle, 1)).toMatchObject({ power: 35, accuracy: 95 });
    expect(buildMoveInfo(tackle, 3)).toMatchObject({ power: 35, accuracy: 95 });
    expect(buildMoveInfo(tackle, 5)).toMatchObject({ power: 50, accuracy: 100 });
    expect(buildMoveInfo(tackle, 7).power).toBe(40);
  });

  it('reads past_values per field, not per entry', () => {
    // Thunder/Blizzard: a near entry for gold-silver and a far one for x-y,
    // each carrying only the fields that changed there.
    const thunder = makeMove({
      id: 87,
      name: 'thunder',
      power: 110,
      accuracy: 70,
      type: ref('electric'),
      damage_class: ref('special'),
      past_values: [
        { version_group: ref('gold-silver'), power: null, accuracy: null, pp: null, type: null },
        { version_group: ref('x-y'), power: 120, accuracy: null, pp: null, type: null },
      ],
    });
    expect(buildMoveInfo(thunder, 1)).toMatchObject({ power: 120, accuracy: 70 });
    expect(buildMoveInfo(thunder, 5)).toMatchObject({ power: 120, accuracy: 70 });
    expect(buildMoveInfo(thunder, 6).power).toBe(110);

    const blizzard = makeMove({
      id: 59,
      name: 'blizzard',
      power: 110,
      accuracy: 70,
      type: ref('ice'),
      damage_class: ref('special'),
      past_values: [
        { version_group: ref('gold-silver'), power: null, accuracy: 90, pp: null, type: null },
        { version_group: ref('x-y'), power: 120, accuracy: null, pp: null, type: null },
      ],
    });
    expect(buildMoveInfo(blizzard, 1)).toMatchObject({ power: 120, accuracy: 90 });
    expect(buildMoveInfo(blizzard, 2)).toMatchObject({ power: 120, accuracy: 70 });
  });

  it('keeps localized names and lets curated overrides win', () => {
    const info = buildMoveInfo(makeMove(), 1);
    expect(info.name).toEqual({ en: 'Tackle', es: 'Placaje' });
    const fixed = buildMoveInfo(makeMove(), 1, new Map([['tackle', { es: 'Embestida' }]]));
    expect(fixed.name).toEqual({ en: 'Tackle', es: 'Embestida' });
  });
});

describe('gameAccurateDamageClass', () => {
  it('derives the class from the type in Gen 1-3', () => {
    expect(gameAccurateDamageClass('normal', 'physical', 1)).toBe('physical');
    expect(gameAccurateDamageClass('ghost', 'physical', 3)).toBe('physical');
    expect(gameAccurateDamageClass('dark', 'special', 2)).toBe('special');
    expect(gameAccurateDamageClass('fire', 'status', 1)).toBe('status');
  });

  it('uses the per-move class from Gen 4 on', () => {
    expect(gameAccurateDamageClass('dark', 'physical', 4)).toBe('physical');
    expect(gameAccurateDamageClass('ghost', 'special', 4)).toBe('special');
  });
});

describe('localName es fallback', () => {
  it('uses es-419 when European Spanish is missing', () => {
    const names = [
      { name: 'Thunderbolt', language: { name: 'en' } },
      { name: 'Rayo', language: { name: 'es-419' } },
    ];
    expect(localName(names as never, 'Fallback')).toEqual({ en: 'Thunderbolt', es: 'Rayo' });
  });
});
