/**
 * Game definitions — the ONLY place where a game is declared.
 * Everything else (pokedexes, species sets, charts) is derived at build time.
 */
import type { GameRegistryEntry } from '../../src/lib/data-schema';

interface GameDef extends GameRegistryEntry {
  /** local curated file name (without extension) */
  curatedFile: string;
}

export const GAMES: GameDef[] = [
  {
    id: 'red-blue',
    label: { en: 'Red / Blue', es: 'Rojo / Azul' },
    region: 'kanto',
    generation: 1,
    generationSlug: 'generation-i',
    versionGroup: 'red-blue',
    versions: ['red', 'blue'],
    spriteVersionGroup: 'red-blue',
    pokedexes: ['kanto'],
    pokemonCount: 0, // derived
    curatedFile: 'red-blue',
  },
  {
    id: 'gold-silver',
    label: { en: 'Gold / Silver', es: 'Oro / Plata' },
    region: 'johto',
    generation: 2,
    generationSlug: 'generation-ii',
    versionGroup: 'gold-silver',
    versions: ['gold', 'silver'],
    spriteVersionGroup: 'gold-silver',
    pokedexes: ['original-johto'],
    pokemonCount: 0, // derived
    curatedFile: 'gold-silver',
  },
  {
    id: 'emerald',
    label: { en: 'Emerald', es: 'Esmeralda' },
    region: 'hoenn',
    generation: 3,
    generationSlug: 'generation-iii',
    versionGroup: 'emerald',
    versions: ['emerald'],
    spriteVersionGroup: 'emerald',
    pokedexes: ['hoenn'],
    pokemonCount: 0, // derived
    curatedFile: 'emerald',
  },
];

/** App-color palette per type (Tailwind-free, used by types.json) */
export const TYPE_COLORS: Record<string, string> = {
  normal: '#9299a1',
  fire: '#ff7043',
  water: '#42a1f1',
  electric: '#f7c531',
  grass: '#67c155',
  ice: '#7ecdf7',
  fighting: '#ef6239',
  poison: '#b054cf',
  ground: '#d97845',
  flying: '#8fa8de',
  psychic: '#f96e9e',
  bug: '#92bc2c',
  rock: '#c5b48c',
  ghost: '#8971b6',
  dragon: '#53a4cf',
  dark: '#5f636d',
  steel: '#5a8ea1',
  fairy: '#ef8fea',
};
