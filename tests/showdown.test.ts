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
