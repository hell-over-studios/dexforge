/**
 * Game definitions — the ONLY place where a game is declared.
 * Everything else (pokedexes, species sets, charts) is derived at build time.
 */
import type { GameRegistryEntry } from '../../src/lib/data-schema';

interface GameDef extends GameRegistryEntry {
  /** local curated file name (without extension) */
  curatedFile: string;
  /**
   * Sprite groups inside `sprites.versions.<generation-x>` of the form payload,
   * first match wins. 2026 schema: gen-ii has no `gold-silver` group, only
   * separate `gold` / `silver` / `crystal` keys.
   */
  spriteGroups: string[];
  /**
   * Same-generation version groups whose TM/HM pool is identical; their machine
   * rows fill PokeAPI gaps in `versionGroup` (Gen-I HM omissions live in yellow).
   * Never used for level-up/egg/tutor rows.
   */
  machineFallbackGroups?: string[];
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
    spriteGroups: ['red-blue', 'yellow'],
    machineFallbackGroups: ['yellow'],
    pokedexes: ['kanto'],
    pokemonCount: 0, // derived
    curatedFile: 'red-blue',
  },
  {
    id: 'yellow',
    label: { en: 'Yellow', es: 'Amarillo' },
    region: 'kanto',
    generation: 1,
    generationSlug: 'generation-i',
    versionGroup: 'yellow',
    versions: ['yellow'],
    spriteVersionGroup: 'yellow',
    spriteGroups: ['yellow', 'red-blue'],
    pokedexes: ['kanto'],
    pokemonCount: 0, // derived
    curatedFile: 'yellow',
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
    spriteGroups: ['gold-silver', 'gold', 'silver'],
    pokedexes: ['original-johto'],
    pokemonCount: 0, // derived
    curatedFile: 'gold-silver',
  },
  {
    id: 'crystal',
    label: { en: 'Crystal', es: 'Cristal' },
    region: 'johto',
    generation: 2,
    generationSlug: 'generation-ii',
    versionGroup: 'crystal',
    versions: ['crystal'],
    spriteVersionGroup: 'crystal',
    spriteGroups: ['crystal', 'gold'],
    pokedexes: ['original-johto'],
    pokemonCount: 0, // derived
    curatedFile: 'crystal',
  },
  {
    id: 'ruby-sapphire',
    label: { en: 'Ruby / Sapphire', es: 'Rubí / Zafiro' },
    region: 'hoenn',
    generation: 3,
    generationSlug: 'generation-iii',
    versionGroup: 'ruby-sapphire',
    versions: ['ruby', 'sapphire'],
    spriteVersionGroup: 'ruby-sapphire',
    spriteGroups: ['ruby-sapphire', 'emerald'],
    pokedexes: ['hoenn'],
    pokemonCount: 0, // derived
    curatedFile: 'ruby-sapphire',
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
    spriteGroups: ['emerald', 'ruby-sapphire'],
    pokedexes: ['hoenn'],
    pokemonCount: 0, // derived
    curatedFile: 'emerald',
  },
  {
    id: 'firered-leafgreen',
    label: { en: 'FireRed / LeafGreen', es: 'Rojo Fuego / Verde Hoja' },
    region: 'kanto',
    generation: 3,
    generationSlug: 'generation-iii',
    versionGroup: 'firered-leafgreen',
    versions: ['firered', 'leafgreen'],
    spriteVersionGroup: 'firered-leafgreen',
    spriteGroups: ['firered-leafgreen'],
    pokedexes: ['kanto'],
    pokemonCount: 0, // derived
    curatedFile: 'firered-leafgreen',
  },
  {
    id: 'diamond-pearl',
    label: { en: 'Diamond / Pearl', es: 'Diamante / Perla' },
    region: 'sinnoh',
    generation: 4,
    generationSlug: 'generation-iv',
    versionGroup: 'diamond-pearl',
    versions: ['diamond', 'pearl'],
    spriteVersionGroup: 'diamond-pearl',
    spriteGroups: ['diamond-pearl'],
    pokedexes: ['original-sinnoh'],
    pokemonCount: 0, // derived
    curatedFile: 'diamond-pearl',
  },
  {
    id: 'platinum',
    label: { en: 'Platinum', es: 'Platino' },
    region: 'sinnoh',
    generation: 4,
    generationSlug: 'generation-iv',
    versionGroup: 'platinum',
    versions: ['platinum'],
    spriteVersionGroup: 'platinum',
    spriteGroups: ['platinum', 'diamond-pearl'],
    pokedexes: ['extended-sinnoh'],
    pokemonCount: 0, // derived
    curatedFile: 'platinum',
  },
  {
    id: 'heartgold-soulsilver',
    label: { en: 'HeartGold / SoulSilver', es: 'HeartGold / SoulSilver' },
    region: 'johto',
    generation: 4,
    generationSlug: 'generation-iv',
    versionGroup: 'heartgold-soulsilver',
    versions: ['heartgold', 'soulsilver'],
    spriteVersionGroup: 'heartgold-soulsilver',
    spriteGroups: ['heartgold-soulsilver'],
    pokedexes: ['updated-johto'],
    pokemonCount: 0, // derived
    curatedFile: 'heartgold-soulsilver',
  },
  {
    id: 'black-white',
    label: { en: 'Black / White', es: 'Negro / Blanco' },
    region: 'unova',
    generation: 5,
    generationSlug: 'generation-v',
    versionGroup: 'black-white',
    versions: ['black', 'white'],
    spriteVersionGroup: 'black-white',
    spriteGroups: ['black-white'],
    pokedexes: ['original-unova'],
    pokemonCount: 0, // derived
    curatedFile: 'black-white',
  },
  {
    id: 'black-2-white-2',
    label: { en: 'Black 2 / White 2', es: 'Negro 2 / Blanco 2' },
    region: 'unova',
    generation: 5,
    generationSlug: 'generation-v',
    versionGroup: 'black-2-white-2',
    versions: ['black-2', 'white-2'],
    spriteVersionGroup: 'black-2-white-2',
    spriteGroups: ['black-white'],
    pokedexes: ['updated-unova'],
    pokemonCount: 0, // derived
    curatedFile: 'black-2-white-2',
  },
  {
    id: 'x-y',
    label: { en: 'X / Y', es: 'X / Y' },
    region: 'kalos',
    generation: 6,
    generationSlug: 'generation-vi',
    versionGroup: 'x-y',
    versions: ['x', 'y'],
    spriteVersionGroup: 'x-y',
    spriteGroups: ['x-y', 'omegaruby-alphasapphire'],
    pokedexes: ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
    pokemonCount: 0, // derived
    curatedFile: 'x-y',
  },
  {
    id: 'omega-ruby-alpha-sapphire',
    label: { en: 'Omega Ruby / Alpha Sapphire', es: 'Rubí Omega / Zafiro Alfa' },
    region: 'hoenn',
    generation: 6,
    generationSlug: 'generation-vi',
    versionGroup: 'omega-ruby-alpha-sapphire',
    versions: ['omega-ruby', 'alpha-sapphire'],
    spriteVersionGroup: 'omega-ruby-alpha-sapphire',
    spriteGroups: ['omegaruby-alphasapphire', 'x-y'],
    pokedexes: ['updated-hoenn'],
    pokemonCount: 0, // derived
    curatedFile: 'omega-ruby-alpha-sapphire',
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
