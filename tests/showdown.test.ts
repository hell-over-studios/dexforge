/**
 * V1-01 (#94): Showdown text <-> team, resolved against the real Emerald dataset.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { GameData } from '../src/lib/data-schema';
import { exportShowdown, importShowdown, showdownKey } from '../src/lib/showdown';

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'data',
  'emerald.json',
);
const hasData = existsSync(file);

describe('showdownKey', () => {
  it('ignores case, accents, spaces and punctuation', () => {
    expect(showdownKey('Mr. Mime')).toBe(showdownKey('mr-mime'));
    expect(showdownKey('Psíquico')).toBe('psiquico');
  });
});

describe.skipIf(!hasData)('Showdown import/export (Emerald)', () => {
  const game = JSON.parse(readFileSync(file, 'utf-8')) as GameData;
  const species = (slug: string) => game.pokemon.find((p) => p.slug === slug)!.id;
  const move = (slug: string) =>
    Number(Object.entries(game.moves).find(([, m]) => m.slug === slug)![0]);

  it('reads nicknames, items and gender, and reports what does not fit', () => {
    const paste = [
      'Big Fish (Swampert) (M) @ Leftovers',
      'Ability: Torrent',
      'EVs: 252 HP / 252 Atk',
      '- Earthquake',
      '- Surf',
      '- Fly',
      '- Splash Dance',
      '',
      'Mewtwo @ Leftovers',
      '- Psychic',
      '',
      'Mudkip',
    ].join('\n');
    const { members, issues } = importShowdown(paste, game);
    expect(members).toEqual([
      { id: species('swampert'), moves: [move('earthquake'), move('surf')] },
      { id: species('mudkip'), moves: [] },
    ]);
    expect(issues).toEqual([
      { kind: 'not-learnable', text: 'Fly', species: 'Swampert' },
      { kind: 'unknown-move', text: 'Splash Dance', species: 'Swampert' },
      { kind: 'unknown-species', text: 'Mewtwo' },
    ]);
  });

  it('accepts Spanish names too', () => {
    const { members, issues } = importShowdown('Treecko\n- Absorber', game);
    expect(issues).toEqual([]);
    expect(members).toEqual([{ id: species('treecko'), moves: [move('absorb')] }]);
  });

  it('round-trips an exported team', () => {
    const team = [
      { id: species('swampert'), moves: [move('earthquake'), move('surf')] },
      { id: species('gardevoir'), moves: [move('psychic')] },
    ];
    const text = exportShowdown(team, game);
    expect(text).toBe('Swampert\n- Earthquake\n- Surf\n\nGardevoir\n- Psychic');
    expect(importShowdown(text, game)).toEqual({ members: team, issues: [] });
  });
});

const alolaFile = path.join(path.dirname(file), 'sun-moon.json');

describe.skipIf(!existsSync(alolaFile))('Showdown regional forms (Sun/Moon)', () => {
  const game = JSON.parse(readFileSync(alolaFile, 'utf-8')) as GameData;
  const raichu = game.pokemon.find((p) => p.slug === 'raichu')!;

  it('exports Alolan forms with the Showdown species name', () => {
    expect(exportShowdown([{ id: raichu.id, moves: [] }], game)).toBe('Raichu-Alola');
  });

  it('imports "Raichu-Alola" and "Alolan Raichu" to the same member', () => {
    for (const text of ['Raichu-Alola @ Aloraichium Z', 'Alolan Raichu']) {
      expect(importShowdown(text, game).members).toEqual([{ id: raichu.id, moves: [] }]);
    }
  });
});

const galarFile = path.join(path.dirname(file), 'sword-shield.json');
const paldeaFile = path.join(path.dirname(file), 'scarlet-violet.json');

describe.skipIf(!existsSync(galarFile) || !existsSync(paldeaFile))(
  'Showdown regional forms (Galar, Paldea)',
  () => {
    const galar = JSON.parse(readFileSync(galarFile, 'utf-8')) as GameData;
    const paldea = JSON.parse(readFileSync(paldeaFile, 'utf-8')) as GameData;
    const idOf = (game: GameData, slug: string) => game.pokemon.find((p) => p.slug === slug)!.id;

    it('uses Showdown species names for regional forms and breeds', () => {
      expect(exportShowdown([{ id: idOf(galar, 'meowth'), moves: [] }], galar)).toBe(
        'Meowth-Galar',
      );
      expect(exportShowdown([{ id: idOf(paldea, 'tauros'), moves: [] }], paldea)).toBe(
        'Tauros-Paldea-Combat',
      );
    });

    it('imports them back', () => {
      expect(importShowdown('Meowth-Galar', galar).members).toEqual([
        { id: idOf(galar, 'meowth'), moves: [] },
      ]);
      expect(importShowdown('Tauros-Paldea-Combat', paldea).members).toEqual([
        { id: idOf(paldea, 'tauros'), moves: [] },
      ]);
      expect(importShowdown('Wooper-Paldea', paldea).members).toEqual([
        { id: idOf(paldea, 'wooper'), moves: [] },
      ]);
    });
  },
);
