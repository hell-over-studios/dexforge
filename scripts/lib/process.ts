/**
 * Pure processing helpers for the data pipeline (no I/O) — unit-tested in tests/.
 */
import type {
  CuratedEncounter,
  Encounter,
  EncounterKind,
  EvolutionStep,
  EvolutionTarget,
  LocalizedText,
  SpeciesAbility,
  Stats,
  TypeChart,
} from '../../src/lib/data-schema';

/* ------------------------------------------------------------------ */
/* minimal PokeAPI payload shapes (only what we consume)               */
/* ------------------------------------------------------------------ */

export interface NamedRef {
  name: string;
  url: string;
}
interface NameEntry {
  name: string;
  language: { name: string };
}
export interface DamageRelations {
  double_damage_to: NamedRef[];
  half_damage_to: NamedRef[];
  no_damage_to: NamedRef[];
}
export interface PastDamage {
  generation: { name: string; url: string };
  damage_relations: DamageRelations;
}
export interface GenTypeEntry {
  name: string;
  url: string;
  damage_relations: DamageRelations;
  past_damage_relations: PastDamage[];
}
export interface PokeGeneration {
  id: number;
  name: string;
  types: GenTypeEntry[];
}
export interface PokeType {
  id: number;
  name: string;
  names: NameEntry[];
  /** generation the type was introduced in (2026 schema) */
  generation?: { name: string; url: string } | null;
  damage_relations: DamageRelations;
  past_damage_relations?: PastDamage[];
}
export interface PokePokedex {
  id: number;
  name: string;
  names: NameEntry[];
  pokemon_entries: { entry_number: number; pokemon_species: NamedRef }[];
}
interface NameEntry {
  name: string;
  language: { name: string };
}
export interface PokeSpecies {
  id: number;
  name: string;
  names: NameEntry[];
  generation: { name: string };
  capture_rate: number;
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: NamedRef }[];
}
export interface PastType {
  generation: NamedRef;
  types: { slot: number; type: NamedRef }[];
}
export interface PokeForm {
  id: number;
  name: string;
  height: number;
  weight: number;
  abilities: { ability: NamedRef; slot: number; is_hidden: boolean }[];
  stats: { stat: NamedRef; base_stat: number }[];
  /** 2026 schema: items are { slot, type } wrappers */
  types: { slot: number; type: NamedRef }[];
  /** 2026 schema: typing history lives on the FORM (moved from species) */
  past_types?: PastType[];
  sprites: {
    /** e.g. `generation-ii` -> { gold: { front_default: url, front_shiny: url, … } } */
    versions?: Record<string, Record<string, string | null | undefined> | undefined>;
    other: {
      'official-artwork'?: { front_default?: string | null };
      home?: { front_default?: string | null };
      showdown?: { front_default?: string | null };
    };
  };
}
export interface EncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: NamedRef;
}
export interface PokeEncounterVersion {
  version: NamedRef;
  max_chance: number;
  encounter_details: EncounterDetail[];
}
export interface PokeEncounterArea {
  location_area: NamedRef;
  version_details: PokeEncounterVersion[];
}
export interface EvoLink {
  species: NamedRef;
  evolution_details?: {
    trigger: NamedRef;
    min_level: number | null;
    item?: NamedRef | null;
    min_happiness: number | null;
  }[];
  evolves_to: EvoLink[];
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getName(names: NameEntry[], lang: 'en' | 'es', fallback: string): string {
  const hit = names.find((n) => n.language.name === lang)?.name;
  return hit ?? fallback;
}

export function localName(names: NameEntry[], fallback: string): LocalizedText {
  return {
    en: getName(names, 'en', fallback),
    es: getName(names, 'es', getName(names, 'en', fallback)),
  };
}

export function genNumberFromSlug(slug: string): number {
  const roman = slug.replace('generation-', '');
  const map: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
  };
  return map[roman] ?? 0;
}

export function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : 0;
}

export function slugFromUrl(url: string): string {
  const m = url.match(/\/([a-z-]+)\/?$/);
  return m ? m[1] : url;
}

/**
 * Game-accurate chart from full type details (`type/{id}` payloads), 2026 schema:
 * - a type is introduced in `t.generation` (e.g. steel/dark in gen-ii, fairy in gen-vi);
 * - `past_damage_relations` entries hold relations valid "up to and including"
 *   the entry's generation -> pick the entry with the smallest generation
 *   number >= the game's generation; without any, `damage_relations` applies.
 * - chart cells are restricted to types introduced <= gameGeneration.
 * - Gen-I quirks that PokeAPI (2026 schema) no longer exposes are patched in
 *   GEN1_PATCHES below (Bulbapedia "Type chart in Generation I" differences).
 */
export interface TypeDetailInput {
  name: string;
  generation?: { name: string } | null;
  damage_relations: DamageRelations;
  past_damage_relations: PastDamage[];
}

/** attacker -> defender -> multiplier, Gen-I specific corrections */
export const GEN1_PATCHES: Readonly<Record<string, number>> = Object.freeze({
  'bug/poison': 2, // Bug was 2x against Poison in Gen I (0.5 from Gen II)
  'poison/bug': 2, // Poison was 2x against Bug in Gen I (0.5 from Gen II)
  'bug/psychic': 2, // Bug was 2x against Psychic in Gen I (0.5 from Gen II)
  'ghost/psychic': 0, // Gen I bug: Ghost had no effect on Psychic (0.5 from Gen II)
  'ghost/ghost': 0, // Ghost could not hit Ghost in Gen I (2 from Gen II)
  'ice/fire': 1, // Ice was neutral against Fire in Gen I (0.5 from Gen II)
  'fighting/ghost': 0.5, // Fighting only half-hit Ghost in Gen I (0 from Gen II)
});

export function buildTypeChart(typeDetails: TypeDetailInput[], gameGeneration: number): TypeChart {
  const introduced = (t: TypeDetailInput) =>
    t.generation ? genNumberFromSlug(t.generation.name) : 1;
  const inGame = typeDetails.filter((t) => introduced(t) <= gameGeneration && t.name !== 'unknown');
  const inSet = new Set(inGame.map((t) => t.name));

  const chart: TypeChart = {};
  for (const t of inGame) {
    const entries = (t.past_damage_relations ?? [])
      .map((p) => ({ rel: p.damage_relations, gen: genNumberFromSlug(p.generation.name) }))
      .filter((x) => x.gen >= gameGeneration)
      .sort((a, b) => a.gen - b.gen);
    const rel = entries.length ? entries[0].rel : t.damage_relations;
    const def: Record<string, number> = {};
    for (const defender of inGame) def[defender.name] = 1;
    for (const x of rel.double_damage_to) if (inSet.has(x.name)) def[x.name] = 2;
    for (const x of rel.half_damage_to) if (inSet.has(x.name)) def[x.name] = 0.5;
    for (const x of rel.no_damage_to) if (inSet.has(x.name)) def[x.name] = 0;
    chart[t.name] = def;
  }
  if (gameGeneration === 1) {
    for (const [key, mult] of Object.entries(GEN1_PATCHES)) {
      const [attacker, defender] = key.split('/');
      if (chart[attacker] && defender in chart[attacker]) chart[attacker][defender] = mult;
    }
  }
  return chart;
}

/**
 * Game sprite lookup from the form's `sprites.versions` (2026 schema):
 * - groups live under `generation-x`, with per-version keys (`red-blue`, `gold`,
 *   `silver`, `emerald`…). There is no combined `gold-silver` group, hence the
 *   ordered fallback list.
 * - a group is a flat map of `front_default` / `front_shiny` / … to URLs.
 *   Gen-I groups ship no shiny sprites.
 */
export function pickGameSprites(
  form: PokeForm,
  generation: number,
  groups: string[],
): { game: string | null; shinyGame: string | null } {
  const genGroup = form.sprites?.versions?.[`generation-${toRoman(generation)}`] as
    Record<string, unknown> | undefined;
  if (!genGroup) return { game: null, shinyGame: null };
  for (const group of groups) {
    const map = genGroup[group] as Record<string, unknown> | undefined;
    if (!map) continue;
    const game = typeof map.front_default === 'string' ? map.front_default : null;
    const shinyGame = typeof map.front_shiny === 'string' ? map.front_shiny : null;
    if (game || shinyGame) return { game, shinyGame };
  }
  return { game: null, shinyGame: null };
}

function toRoman(n: number): string {
  return ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'][n - 1] ?? 'x';
}

/**
 * Game-accurate typing using the form's `past_types` (2026 schema: entry.generation
 * is the LAST generation in which that typing was in effect). Rule: pick the
 * entry with the smallest generation number >= the game's generation; if none,
 * the form's current types apply.
 */
export function gameAccurateTypes(form: PokeForm, generation: number): string[] {
  const entries = (form.past_types ?? [])
    .map((p) => ({
      types: p.types.map((t) => t.type.name),
      gen: genNumberFromSlug(p.generation.name),
    }))
    .filter((x) => x.gen >= generation)
    .sort((a, b) => a.gen - b.gen);
  if (entries.length) return entries[0].types;
  return form.types.map((t) => t.type.name);
}

export function extractStats(form: PokeForm): Stats {
  const s: Record<string, number> = {};
  for (const row of form.stats) s[row.stat.name] = row.base_stat;
  // PokeAPI exposes the modern split; in Gen 1-2 there was a single "Special"
  // stat, so both fields carry its value (documented approximation).
  const special = s['special-attack'] ?? s['special-defense'] ?? 0;
  const sa = s['special-attack'] ?? special;
  const sd = s['special-defense'] ?? special;
  return {
    hp: s['hp'] ?? 0,
    attack: s['attack'] ?? 0,
    defense: s['defense'] ?? 0,
    specialAttack: sa,
    specialDefense: sd,
    speed: s['speed'] ?? 0,
  };
}

export function extractAbilities(
  form: PokeForm,
  generation: number,
  abilityNames?: ReadonlyMap<string, LocalizedText>,
): SpeciesAbility[] {
  if (generation < 3) return [];
  return form.abilities.map((a) => {
    const slug = a.ability.name;
    const localized = abilityNames?.get(slug);
    return {
      slug,
      name: localized ?? { en: capitalize(slug), es: capitalize(slug) },
      slot: a.slot,
      hidden: a.is_hidden,
    };
  });
}

export function extractEvolutionChain(link: EvoLink): EvolutionStep[] {
  const steps: EvolutionStep[] = [];
  const walk = (node: EvoLink): void => {
    if (steps.some((s) => s.id === idFromUrl(node.species.url))) return;
    steps.push({
      id: idFromUrl(node.species.url),
      slug: node.species.name,
      evolvesInto: node.evolves_to.map((child) => {
        const det = child.evolution_details?.[0];
        return {
          id: idFromUrl(child.species.url),
          slug: child.species.name,
          trigger: det?.trigger?.name ?? null,
          minLevel: det?.min_level ?? null,
          item: det?.item?.name ?? null,
          friendship: det?.min_happiness ?? null,
        };
      }),
    });
    for (const child of node.evolves_to) walk(child);
  };
  walk(link);
  return steps;
}

/* wild encounter flattening: one row per (location_area, version, method) */
export interface RawWildRow {
  locationArea: string;
  version: string | null;
  method: string;
  rate: number;
  minLevel: number;
  maxLevel: number;
}

export function flattenWild(raw: PokeEncounterArea[], versions: string[]): RawWildRow[] {
  const rows: RawWildRow[] = [];
  for (const area of raw) {
    for (const vd of area.version_details) {
      const version = versions.includes(vd.version.name) ? vd.version.name : null;
      if (version === null) continue;
      const byMethod = new Map<string, RawWildRow>();
      for (const det of vd.encounter_details) {
        const m = byMethod.get(det.method.name);
        if (m) {
          m.rate += det.chance;
          m.minLevel = Math.min(m.minLevel, det.min_level);
          m.maxLevel = Math.max(m.maxLevel, det.max_level);
        } else {
          byMethod.set(det.method.name, {
            locationArea: area.location_area.name,
            version,
            method: det.method.name,
            rate: det.chance,
            minLevel: det.min_level,
            maxLevel: det.max_level,
          });
        }
      }
      rows.push(...byMethod.values());
    }
  }
  return rows;
}

const KIND_METHOD: Record<EncounterKind, string> = {
  wild: 'Wild',
  gift: 'Gift',
  trade: 'In-game trade',
  static: 'Static',
  evolve: 'Evolution',
  event: 'Event',
};

export function curatedToEncounter(c: CuratedEncounter): Encounter {
  const txt = (v: { en: string; es: string } | string | null | undefined): LocalizedText | null => {
    if (!v) return null;
    if (typeof v === 'string') return { en: v, es: v };
    return { en: v.en ?? v.es ?? '', es: v.es ?? v.en ?? '' };
  };
  return {
    source: 'curated',
    kind: c.kind,
    locationArea: null,
    name: txt(c.location),
    method: c.method ?? KIND_METHOD[c.kind],
    rate: c.rate ?? null,
    minLevel: c.minLevel ?? null,
    maxLevel: c.maxLevel ?? null,
    version: c.versions?.length === 1 ? (c.versions[0] as string) : null,
    notes: c.notes ?? null,
  };
}

export type { EvoLink as EvolutionLink };
export type { EvolutionTarget };
