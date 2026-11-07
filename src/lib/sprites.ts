/**
 * Sprite viewer data logic (T2.7): which URL serves which kind, and the
 * documented fallback chain when a kind is missing in the emitted JSON
 * (e.g. no shiny for gen-i groups, no showdown gif for many species).
 *
 * Rendering rules (ADR-008): `game`, `shiny` and `animated` are low-res pixel
 * art and MUST be rendered with `image-rendering: pixelated`. `artwork`
 * (official keyart) and `home` are smooth renders and may be drawn as-is.
 */
import type { SpeciesSprites } from './data-schema';

export const SPRITE_KINDS = ['game', 'shiny', 'animated', 'artwork', 'home'] as const;
export type SpriteKind = (typeof SPRITE_KINDS)[number];

/** which SpeciesSprites field provides each kind */
const PRIMARY: Record<SpriteKind, keyof SpeciesSprites> = {
  game: 'game',
  shiny: 'shinyGame',
  animated: 'showdown',
  artwork: 'official',
  home: 'home',
};

/** documented fallback chain per kind (per PROMPT §2, game sprite leads) */
const FALLBACK: Record<SpriteKind, SpriteKind[]> = {
  game: ['game', 'artwork', 'home'],
  shiny: ['shiny', 'game', 'artwork'],
  animated: ['animated', 'game', 'artwork'],
  artwork: ['artwork', 'home', 'game'],
  home: ['home', 'artwork', 'game'],
};

/** kinds that must render pixel-crisp */
const PIXEL_KINDS: SpriteKind[] = ['game', 'shiny', 'animated'];

export interface SpriteChoice {
  url: string;
  /** the kind actually chosen (may be a fallback) */
  kind: SpriteKind;
  /** true when the URL is pixel art and must be rendered with `pixelated` */
  pixelated: boolean;
}

/** Best available URL for the requested kind, or null when nothing at all exists. */
export function chooseSprite(sprites: SpeciesSprites, kind: SpriteKind): SpriteChoice | null {
  for (const k of FALLBACK[kind]) {
    const url = sprites[PRIMARY[k]];
    if (url) return { url, kind: k, pixelated: PIXEL_KINDS.includes(k) };
  }
  return null;
}

/** kinds with no source at all (toggle buttons should hint unavailability) */
export function missingKinds(sprites: SpeciesSprites): SpriteKind[] {
  return SPRITE_KINDS.filter((k) => sprites[PRIMARY[k]] === null);
}

/** the SpeciesSprites field that provides each kind */
export const primaryField = (kind: SpriteKind): keyof SpeciesSprites => PRIMARY[kind];
