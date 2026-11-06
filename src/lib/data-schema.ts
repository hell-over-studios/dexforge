/**
 * Shared data schemas — single source of truth for the JSON emitted by
 * scripts/build.ts into /public/data and for what the app consumes at runtime.
 * Keep this file dependency-free so both scripts (node, tsx) and app code
 * (Astro/React) can import it.
 */

/* ---------- registry ---------- */

export interface LocalizedText {
  en: string;
  es: string;
}

export interface GameRegistryEntry {
  /** stable slug used in URLs and file names, e.g. "red-blue" */
  id: string;
  label: LocalizedText;
  /** PokeAPI region slug, e.g. "kanto" */
  region: string;
  /** numeric generation, 1..9 */
  generation: number;
  /** PokeAPI generation slug, e.g. "generation-i" */
  generationSlug: string;
  /** PokeAPI version-group slug */
  versionGroup: string;
  /** member versions of the group, e.g. ["red","blue"] */
  versions: string[];
  /** key under sprites.versions.<gen> for the DEFAULT sprite of the group */
  spriteVersionGroup: string;
  pokedexes: string[];
  pokemonCount: number;
}

export interface GamesRegistry {
  generatedAt: string;
  games: GameRegistryEntry[];
}

/* ---------- types ---------- */

export interface TypeEntry {
  id: number;
  slug: string;
  name: LocalizedText;
  color: string;
}

export interface TypeData {
  generatedAt: string;
  types: TypeEntry[];
}

/* ---------- per-game dataset ---------- */

/** attacker slug -> defender slug -> damage multiplier */
export type TypeChart = Record<string, Record<string, number>>;

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface SpeciesAbility {
  slug: string;
  name: LocalizedText;
  slot: number;
  hidden: boolean;
}

export interface SpeciesSprites {
  /** default sprite of the selected game version-group; may be null if not drawn that way */
  game: string | null;
  /** shiny sprite of the selected game version-group; may be null */
  shinyGame: string | null;
  /** official artwork — always available fallback */
  official: string | null;
  /** Showdown animated gif, may be null */
  showdown: string | null;
  /** Pokémon HOME render, may be null */
  home: string | null;
}

export interface EvolutionStep {
  id: number;
  slug: string;
  evolvesInto: EvolutionTarget[];
}

export interface EvolutionTarget {
  id: number;
  slug: string;
  trigger: string | null;
  minLevel: number | null;
  /** evolution item slug, required for use-item / trade triggers */
  item: string | null;
  /** required friendship for happiness-trigger evolutions */
  friendship: number | null;
}

export type EncounterKind = 'wild' | 'gift' | 'trade' | 'static' | 'evolve' | 'event';
export type EncounterSource = 'pokeapi' | 'curated';

export interface EncounterVersionDetail {
  /** member version slug, e.g. "red"; null = appears in all versions of the group */
  version: string | null;
  /** encounter chance %; curated entries may omit */
  rate: number | null;
  minLevel: number | null;
  maxLevel: number | null;
}

export interface WildMethod {
  /** e.g. walk, surf, old-rod, super-rod, rock-smash… */
  slug: string;
}

export interface Encounter {
  source: EncounterSource;
  kind: EncounterKind;
  /** PokeAPI location-area slug; curated entries may omit */
  locationArea: string | null;
  /** localized label (resolved from location-area, or curated text) */
  name: LocalizedText | null;
  /** how it is obtained in prose, e.g. "Starter", "Trade Remoraid", "Surf" */
  method: string | null;
  rate: number | null;
  minLevel: number | null;
  maxLevel: number | null;
  /** version exclusivity within the game group */
  version: string | null;
  /** free text: HM requirements, badge notes, trade partners… */
  notes: string | null;
}

export interface CuratedEncounter {
  /** resolves to a species in the game's dex (slug); pipeline throws if unknown */
  species: string;
  kind: EncounterKind;
  /** plain string is allowed and copied to both languages */
  location?: { en: string; es: string } | string | null;
  method?: string | null;
  /** e.g. ["red"] — omit for both/all versions */
  versions?: string[];
  rate?: number | null;
  minLevel?: number | null;
  maxLevel?: number | null;
  notes?: string | null;
}

export interface CuratedGameData {
  /** game id, must match a games.ts entry */
  game: string;
  entries: CuratedEncounter[];
}

export interface GamePokemon {
  /** national dex id */
  id: number;
  slug: string;
  name: LocalizedText;
  /** entry number in the game's dex */
  dexNumber: number;
  /** slug of the form whose data was used (usually the default) */
  formSlug: string;
  generationSlug: string;
  /** game-accurate type slugs (uses past_types) */
  types: string[];
  stats: Stats;
  /** empty for Gen 1-2 */
  abilities: SpeciesAbility[];
  /** decimetres */
  height: number;
  /** hectograms */
  weight: number;
  captureRate: number | null;
  sprites: SpeciesSprites;
  /** null if no evolution chain (single-stage, rare) */
  evolution: { family: EvolutionStep[] } | null;
  encounters: Encounter[];
}

export interface PokedexMeta {
  id: number;
  slug: string;
  name: LocalizedText | null;
}

export interface GameData {
  meta: {
    id: string;
    label: LocalizedText;
    generation: number;
    generationSlug: string;
    versionGroup: string;
    versions: string[];
    region: string;
    pokedexes: PokedexMeta[];
    generatedAt: string;
    /** number of dex entries emitted */
    pokemonCount: number;
    /** build-time gap report (e.g. missing types, data anomalies) */
    dataGaps: string[];
  };
  typeChart: TypeChart;
  pokemon: GamePokemon[];
}

/* helpers */

export const STAT_KEYS: (keyof Stats)[] = [
  'hp',
  'attack',
  'defense',
  'specialAttack',
  'specialDefense',
  'speed',
];
