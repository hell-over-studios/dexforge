/**
 * Picker data layer (T2.4) — builds a slim, client-friendly dex index from a
 * per-game dataset and provides ES/EN search helpers. No UI here (that's T2.5's
 * React island); this module must stay framework-free and testable.
 *
 * The rendered site never calls PokeAPI: everything derives from the static
 * JSON under /public/data/<game>.json.
 */
import type { GameData, GamePokemon } from './data-schema';

/** One picker row: exactly what the listing UI needs, nothing more. */
export interface DexEntry {
  /** national dex id */
  id: number;
  slug: string;
  name: { es: string; en: string };
  /** entry number in the game's dex (matches in-game numbering) */
  dexNumber: number;
  /** game-accurate type slugs */
  types: string[];
  /** default game sprite for the version-group; falls back to official artwork */
  spriteUrl: string | null;
}

/** Lower-cased, accent-stripped text (NFD + combining-mark removal). */
export const normalizeText = (s: string): string =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** game sprite first, official artwork as fallback (shiny/animated stay T2.7's business) */
const pickSpriteUrl = (p: GamePokemon): string | null => p.sprites.game ?? p.sprites.official;

/**
 * Slim per-game index, ordered by in-game dex number (ascending).
 */
export function buildDexIndex(data: GameData): DexEntry[] {
  return [...data.pokemon]
    .sort((a, b) => a.dexNumber - b.dexNumber)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: { es: p.name.es, en: p.name.en },
      dexNumber: p.dexNumber,
      types: [...p.types],
      spriteUrl: pickSpriteUrl(p),
    }));
}

/**
 * Substring, accent- and case-insensitive search over ES/EN names, slug and
 * both dex numbers (national id and in-game number). Empty query = all
 * entries, in dex order.
 */
export function searchDex(entries: DexEntry[], query: string): DexEntry[] {
  const q = normalizeText(query.trim());
  if (!q) return [...entries];
  return entries.filter((e) => {
    if (normalizeText(e.name.es).includes(q)) return true;
    if (normalizeText(e.name.en).includes(q)) return true;
    if (e.slug.toLowerCase().includes(q)) return true;
    if (String(e.id).includes(q)) return true;
    if (String(e.dexNumber).includes(q)) return true;
    return false;
  });
}

/**
 * Client-side loader: fetch the static per-game dataset and index it.
 * (The deployed site never calls PokeAPI; this only reads /public/data.)
 */
export async function loadDexIndex(gameId: string): Promise<DexEntry[]> {
  const res = await fetch(`/data/${gameId}.json`);
  if (!res.ok) throw new Error(`dataset does not exist for game: ${gameId}`);
  const data = (await res.json()) as GameData;
  return buildDexIndex(data);
}
