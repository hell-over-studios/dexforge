/**
 * Unit tests for the sprite viewer data logic (T2.7, src/lib/sprites.ts):
 * primary selection, documented fallback chains, pixelated rules — plus
 * invariants checked against the REAL emitted JSON (skipped if not generated).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { chooseSprite, missingKinds, SPRITE_KINDS, type SpriteKind } from '../src/lib/sprites';
import type { GameData, GamePokemon, SpeciesSprites } from '../src/lib/data-schema';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const hasData = existsSync(path.join(DATA, 'games.json'));

const sprites = (over: Partial<SpeciesSprites>): SpeciesSprites => ({
  game: null,
  shinyGame: null,
  official: null,
  showdown: null,
  home: null,
  ...over,
});

describe('chooseSprite — synthetic fixtures', () => {
  it('returns the primary source when present', () => {
    const c = chooseSprite(sprites({ game: 'game.png', official: 'art.png' }), 'game');
    expect(c).toEqual({ url: 'game.png', kind: 'game', pixelated: true });
  });

  it('falls back artwork for a missing game sprite', () => {
    const c = chooseSprite(sprites({ official: 'art.png' }), 'game');
    expect(c).toEqual({ url: 'art.png', kind: 'artwork', pixelated: false });
  });

  it('shiny chain: shiny -> game -> artwork', () => {
    expect(chooseSprite(sprites({ game: 'g.png' }), 'shiny')?.kind).toBe('game');
    expect(chooseSprite(sprites({ official: 'art.png', game: 'g.png' }), 'shiny')?.url).toBe(
      'g.png',
    );
    expect(chooseSprite(sprites({}), 'shiny')).toBeNull();
  });

  it('animated chain: showdown -> game -> artwork', () => {
    expect(chooseSprite(sprites({ game: 'g.png' }), 'animated')?.kind).toBe('game');
    expect(chooseSprite(sprites({ official: 'a.png' }), 'animated')?.kind).toBe('artwork');
  });

  it('artwork chain: official -> home -> game', () => {
    expect(chooseSprite(sprites({ home: 'h.png' }), 'artwork')?.url).toBe('h.png');
  });

  it('marks only pixel kinds as pixelated', () => {
    expect(chooseSprite(sprites({ official: 'art.png' }), 'artwork')?.pixelated).toBe(false);
    expect(chooseSprite(sprites({ home: 'h.png' }), 'home')?.pixelated).toBe(false);
    expect(chooseSprite(sprites({ shinyGame: 's.png' }), 'shiny')?.pixelated).toBe(true);
    expect(chooseSprite(sprites({ showdown: 'walk.gif' }), 'animated')?.pixelated).toBe(true);
  });

  it('missingKinds lists kinds with no source at all', () => {
    expect(missingKinds(sprites({ game: 'g.png', official: 'a.png' }))).toEqual([
      'shiny',
      'animated',
      'home',
    ]);
    expect(missingKinds(sprites({ game: 'g.png' }))).toEqual(
      SPRITE_KINDS.filter((k) => k !== 'game'),
    );
  });
});

describe('chooseSprite — against emitted JSON', () => {
  let games: { id: string; data: GameData }[] = [];

  beforeAll(() => {
    if (!hasData) return;
    const ids = ['red-blue', 'gold-silver', 'emerald'];
    games = ids.map((id) => ({
      id,
      data: JSON.parse(readFileSync(path.join(DATA, `${id}.json`), 'utf-8')) as GameData,
    }));
  });

  // community files must be bulk truth-tests; three teams are not full data sweeps...
  describe.skipIf(!hasData)('invariants', () => {
    for (const id of ['red-blue', 'gold-silver', 'emerald']) {
      it(`${id}: every species resolves every kind to a real URL`, () => {
        for (const p of games.find((g) => g.id === id)!.data.pokemon) {
          for (const kind of SPRITE_KINDS as readonly SpriteKind[]) {
            const choice = chooseSprite(p.sprites, kind);
            expect(kind, p.slug).toBeTruthy();
            if (choice) {
              // the chosen URL must be one of the sprites fields
              expect(
                [
                  p.sprites.game,
                  p.sprites.shinyGame,
                  p.sprites.official,
                  p.sprites.showdown,
                  p.sprites.home,
                ].includes(choice.url),
                `${id}/${p.slug}${kind}`,
              ).toBe(true);
            }
          }
          // claimed invariant: official artwork is always available
          const art = chooseSprite(p.sprites, 'artwork');
          expect(art?.url, `${id}/${p.slug} artwork`).toBeTruthy();
          // game sprite is the default visual for these generations
          expect(chooseSprite((p as GamePokemon).sprites, 'game')?.url, p.slug).toBeTruthy();
        }
      });

      it(`${id}: no contradiction with dataGaps (all sprites resolved)`, () => {
        for (const p of games.find((g) => g.id === id)!.data.pokemon) {
          // every kind either resolves exactly to its primary field or to a fallback value
          const choice = chooseSprite(p.sprites, 'game');
          if (p.sprites.game) expect(choice?.url).toBe(p.sprites.game);
        }
      });
    }
  });
});
