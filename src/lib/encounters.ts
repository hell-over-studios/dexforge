/**
 * Where-to-find display model (T5.1, v0.5.0).
 *
 * PokeAPI's encounter list mixes real wild spawns with gifts, in-game trades,
 * statics and events — always as `kind: "wild"` — so grouping by `kind` lies.
 * These pure helpers derive a display category from the *method*, merge rows
 * that only differ by version, drop exact duplicates and produce a stable
 * order for the drawer panel.
 *
 * Everything reads a `GamePokemon.encounters` array from the already-loaded
 * static dataset; no network, no modern-game assumptions.
 */
import type { Encounter, EncounterKind, LocalizedText } from './data-schema';
import type { Lang } from './i18n';

export type EncounterCategory = 'wild' | 'gift' | 'trade' | 'static' | 'event' | 'evolve';

/** Section order in the drawer: the most common answer first. */
export const CATEGORY_ORDER: EncounterCategory[] = [
  'wild',
  'gift',
  'trade',
  'static',
  'event',
  'evolve',
];

export const CATEGORY_LABELS: Record<EncounterCategory, LocalizedText> = {
  wild: { es: 'En estado salvaje', en: 'In the wild' },
  gift: { es: 'Regalos', en: 'Gifts' },
  trade: { es: 'Intercambios', en: 'In-game trades' },
  static: { es: 'Estáticos', en: 'Static encounters' },
  event: { es: 'Eventos', en: 'Events' },
  evolve: { es: 'Evolución', en: 'Evolution' },
};

/** PokeAPI method -> localized label. Unknown/curated strings render as-is. */
const METHOD_LABELS: Record<string, LocalizedText> = {
  walk: { es: 'Caminando', en: 'Walking' },
  surf: { es: 'Surf', en: 'Surf' },
  'old-rod': { es: 'Caña vieja', en: 'Old Rod' },
  'good-rod': { es: 'Caña buena', en: 'Good Rod' },
  'super-rod': { es: 'Súper caña', en: 'Super Rod' },
  'rock-smash': { es: 'Demolición', en: 'Rock Smash' },
  'headbutt-low': { es: 'Golpe cabeza (bajo)', en: 'Headbutt (low)' },
  'headbutt-normal': { es: 'Golpe cabeza', en: 'Headbutt' },
  'headbutt-high': { es: 'Golpe cabeza (alto)', en: 'Headbutt (high)' },
  'roaming-grass': { es: 'Errante (hierba)', en: 'Roaming (grass)' },
  'roaming-water': { es: 'Errante (agua)', en: 'Roaming (water)' },
  seaweed: { es: 'Algas marinas', en: 'Seaweed' },
  'feebas-tile-fishing': { es: 'Pesca en la casilla de Feebas', en: 'Feebas tile fishing' },
  'devon-scope': { es: 'Scope Devon', en: 'Devon Scope' },
  'squirt-bottle': { es: 'Regadera', en: 'Squirt Bottle' },
  pokeflute: { es: 'Pokéflauta', en: 'Poké Flute' },
  gift: { es: 'Regalo', en: 'Gift' },
  'gift-egg': { es: 'Huevo regalo', en: 'Gift egg' },
  'npc-trade': { es: 'Intercambio', en: 'In-game trade' },
  static: { es: 'Estático', en: 'Static' },
  event: { es: 'Evento', en: 'Event' },
  'colosseum-bonus-disc-jpn': {
    es: 'Bonus Disc de Colosseum (JPN)',
    en: 'Colosseum Bonus Disc (JP)',
  },
  // curated methods (authored in data/curated/*.json)
  starter: { es: 'Inicial', en: 'Starter' },
  'after fighting': { es: 'Tras combatir', en: 'After fighting' },
  'revive fossil': { es: 'Revivir fósil', en: 'Revive fossil' },
  roaming: { es: 'Errante', en: 'Roaming' },
};

const WILD_METHODS = new Set([
  'walk',
  'surf',
  'old-rod',
  'good-rod',
  'super-rod',
  'rock-smash',
  'headbutt-low',
  'headbutt-normal',
  'headbutt-high',
  'roaming-grass',
  'roaming-water',
  'seaweed',
  'feebas-tile-fishing',
]);

const STATIC_METHODS = new Set(['static', 'pokeflute', 'squirt-bottle', 'devon-scope']);

const VERSION_LABELS: Record<string, LocalizedText> = {
  red: { es: 'Rojo', en: 'Red' },
  blue: { es: 'Azul', en: 'Blue' },
  yellow: { es: 'Amarillo', en: 'Yellow' },
  gold: { es: 'Oro', en: 'Gold' },
  silver: { es: 'Plata', en: 'Silver' },
  crystal: { es: 'Cristal', en: 'Crystal' },
  ruby: { es: 'Rubí', en: 'Ruby' },
  sapphire: { es: 'Zafiro', en: 'Sapphire' },
  emerald: { es: 'Esmeralda', en: 'Emerald' },
  firered: { es: 'Rojo Fuego', en: 'FireRed' },
  leafgreen: { es: 'Verde Hoja', en: 'LeafGreen' },
  diamond: { es: 'Diamante', en: 'Diamond' },
  pearl: { es: 'Perla', en: 'Pearl' },
  platinum: { es: 'Platino', en: 'Platinum' },
  heartgold: { es: 'HeartGold', en: 'HeartGold' },
  soulsilver: { es: 'SoulSilver', en: 'SoulSilver' },
  black: { es: 'Negro', en: 'Black' },
  white: { es: 'Blanco', en: 'White' },
  'black-2': { es: 'Negro 2', en: 'Black 2' },
  'white-2': { es: 'Blanco 2', en: 'White 2' },
  x: { es: 'X', en: 'X' },
  y: { es: 'Y', en: 'Y' },
  'omega-ruby': { es: 'Rubí Omega', en: 'Omega Ruby' },
  'alpha-sapphire': { es: 'Zafiro Alfa', en: 'Alpha Sapphire' },
  sun: { es: 'Sol', en: 'Sun' },
  moon: { es: 'Luna', en: 'Moon' },
  'ultra-sun': { es: 'Ultrasol', en: 'Ultra Sun' },
  'ultra-moon': { es: 'Ultraluna', en: 'Ultra Moon' },
  sword: { es: 'Espada', en: 'Sword' },
  shield: { es: 'Escudo', en: 'Shield' },
  'legends-arceus': { es: 'Leyendas: Arceus', en: 'Legends: Arceus' },
  scarlet: { es: 'Escarlata', en: 'Scarlet' },
  violet: { es: 'Púrpura', en: 'Violet' },
};

const cap = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

/**
 * Display category. Method wins over `kind` because PokeAPI reports every row
 * as `wild`; only unknown methods fall back to the authored kind.
 */
export function encounterCategory(encounter: Encounter): EncounterCategory {
  const method = encounter.method?.trim().toLowerCase() ?? '';
  if (WILD_METHODS.has(method)) return 'wild';
  if (method === 'gift' || method.startsWith('gift-') || method === 'starter') return 'gift';
  if (method === 'npc-trade' || method === 'trade') return 'trade';
  if (method === 'event') return 'event';
  if (STATIC_METHODS.has(method) || method.startsWith('static')) return 'static';
  if (method === 'colosseum-bonus-disc-jpn') return 'event';
  return encounter.kind === 'wild' ? 'wild' : encounter.kind;
}

/** Localized method label; returns null only when the dataset has no method. */
export function methodLabel(method: string | null, lang: Lang): string | null {
  if (!method) return null;
  const key = method.trim().toLowerCase();
  return METHOD_LABELS[key]?.[lang] ?? method;
}

/** Version chip label ("Rojo", "Oro", …); unknown slugs are capitalized. */
export function versionLabel(slug: string, lang: Lang): string {
  return VERSION_LABELS[slug]?.[lang] ?? cap(slug);
}

/** "Nv. 16" / "Nv. 3–5" / "Nv. ≤20" — null when the dataset has no levels. */
export function formatLevelRange(
  min: number | null,
  max: number | null,
  lang: Lang,
): string | null {
  if (min == null && max == null) return null;
  const prefix = lang === 'en' ? 'Lv.' : 'Nv.';
  if (min != null && max != null) {
    return min === max ? `${prefix} ${min}` : `${prefix} ${min}–${max}`;
  }
  if (min != null) return `${prefix} ≥${min}`;
  return `${prefix} ≤${max}`;
}

/** "5%" — null stays null (curated entries usually omit the rate). */
export function formatRate(rate: number | null): string | null {
  if (rate == null) return null;
  return `${rate}%`;
}

/** One merged row the panel can render without further cleanup. */
export interface EncounterView {
  category: EncounterCategory;
  kind: EncounterKind;
  source: Encounter['source'];
  location: LocalizedText | null;
  /** raw method slug/text from the dataset (localize with `methodLabel`) */
  method: string | null;
  rate: number | null;
  minLevel: number | null;
  maxLevel: number | null;
  notes: string | null;
  /** versions that have this entry; `null` = every version of the game */
  versions: string[] | null;
}

export interface EncounterSection {
  category: EncounterCategory;
  entries: EncounterView[];
}

interface Bucket {
  entry: EncounterView;
  versions: Set<string>;
  /** a version-less (curated) row applies to all versions */
  allVersions: boolean;
}

const labelOf = (name: LocalizedText | null): string => name?.en ?? name?.es ?? '';

/**
 * Collapse version duplicates, drop exact repeats and sort by category, then
 * location / method / level. `gameVersions` comes from `GameData.meta.versions`
 * so a single-version game (Emerald) never shows a chip.
 */
export function groupEncounters(
  encounters: readonly Encounter[],
  gameVersions: readonly string[],
): EncounterSection[] {
  const buckets = new Map<string, Bucket>();

  for (const encounter of encounters) {
    const category = encounterCategory(encounter);
    const key = [
      category,
      encounter.kind,
      encounter.source,
      encounter.locationArea ?? '',
      labelOf(encounter.name),
      encounter.method ?? '',
      encounter.rate ?? '',
      encounter.minLevel ?? '',
      encounter.maxLevel ?? '',
      encounter.notes ?? '',
    ].join('|');

    const existing = buckets.get(key);
    if (existing) {
      if (encounter.version) existing.versions.add(encounter.version);
      else existing.allVersions = true;
      continue;
    }

    buckets.set(key, {
      entry: {
        category,
        kind: encounter.kind,
        source: encounter.source,
        location: encounter.name,
        method: encounter.method,
        rate: encounter.rate,
        minLevel: encounter.minLevel,
        maxLevel: encounter.maxLevel,
        notes: encounter.notes,
        versions: null,
      },
      versions: new Set(encounter.version ? [encounter.version] : []),
      allVersions: !encounter.version,
    });
  }

  const order = new Map(gameVersions.map((version, index) => [version, index]));
  const rows: EncounterView[] = [];

  for (const bucket of buckets.values()) {
    const { entry } = bucket;
    let versions: string[] | null = null;
    if (!bucket.allVersions && bucket.versions.size > 0) {
      const sorted = [...bucket.versions].sort(
        (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
      );
      // a row present in every version of the group carries no information
      versions = sorted.length >= gameVersions.length ? null : sorted;
    }
    rows.push({ ...entry, versions });
  }

  rows.sort((a, b) => {
    const byCategory = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (byCategory !== 0) return byCategory;
    const byLocation = labelOf(a.location).localeCompare(labelOf(b.location), 'en');
    if (byLocation !== 0) return byLocation;
    const byMethod = (a.method ?? '').localeCompare(b.method ?? '', 'en');
    if (byMethod !== 0) return byMethod;
    const byMin = (a.minLevel ?? 999) - (b.minLevel ?? 999);
    if (byMin !== 0) return byMin;
    return (a.maxLevel ?? 999) - (b.maxLevel ?? 999);
  });

  return CATEGORY_ORDER.map((category) => ({
    category,
    entries: rows.filter((row) => row.category === category),
  })).filter((section) => section.entries.length > 0);
}

/**
 * Collapsed-panel summary: the first locations in display order, plus how many
 * more there are. Locations are deduped and untranslated-but-identical names
 * (PokeAPI) collapse naturally because we key on the English label.
 */
export function summarizeLocations(
  sections: readonly EncounterSection[],
  lang: Lang,
  limit = 2,
): { labels: string[]; more: number } {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const section of sections) {
    for (const entry of section.entries) {
      const label = entry.location?.[lang] ?? entry.location?.en;
      if (!label) continue;
      const key = labelOf(entry.location);
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }
  }
  return { labels: labels.slice(0, limit), more: Math.max(0, labels.length - limit) };
}
