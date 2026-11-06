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
}interface PastTypeEntry {
  generation: { name: string; url: string };
  types: NamedRef[];
}
export interface PokeSpecies {
  id: number;
  name: string;
  names: NameEntry[];
  generation: { name: string };
  past_types: PastTypeEntry[];
  capture_rate: number;
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: NamedRef }[];
}
export interface PokeForm {
  id: number;
  name: string;
  height: number;
  weight: number;
  abilities: { ability: NamedRef; slot: number; is_hidden: boolean }[];
  stats: { stat: NamedRef; base_stat: number }[];
  types: NamedRef[];
  sprites: {
    versions?: Record<
      string,
      Record<string, { default?: string; shiny?: string } | undefined> | undefined
    >;
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
 * Game-accurate chart from full type details (`type/{id}` payloads):
 * uses past_damage_relations of the game's generation if present.
 * Gen 1 -> 15 types, Gen 2-5 -> 16-17, Gen 6+ -> 18.
 */
export interface TypeDetailInput {
  name: string;
  damage_relations: DamageRelations;
  past_damage_relations: PastDamage[];
}

export function buildTypeChart(typeDetails: TypeDetailInput[], gameGeneration: number): TypeChart {
  const chart: TypeChart = {};
  for (const t of typeDetails) {
    const past = t.past_damage_relations ?? [];
    const applicable = past
      .map((p) => ({ p, gen: genNumberFromSlug(p.generation.name) }))
      .filter((x) => x.gen <= gameGeneration)
      .sort((a, b) => a.gen - b.gen);
    const rel: DamageRelations = applicable.length
      ? applicable[applicable.length - 1].p.damage_relations
      : t.damage_relations;
    const def: Record<string, number> = {};
    for (const x of rel.double_damage_to) def[slugFromUrl(x.url)] = 2;
    for (const x of rel.half_damage_to) def[slugFromUrl(x.url)] = 0.5;
    for (const x of rel.no_damage_to) def[slugFromUrl(x.url)] = 0;
    chart[t.name] = def;
  }
  return chart;
}

/**
 * Game-accurate typing via `past_types`.
 * By PokeAPI convention a past entry lists the types the species had during the
 * *entry's* generation when they differ from current. So an entry applies only
 * to its exact generation; all other generations use the form's current types.
 */
export function gameAccurateTypes(
  species: PokeSpecies,
  form: PokeForm,
  generation: number,
): string[] {
  const here = (species.past_types ?? []).find(
    (p) => genNumberFromSlug(p.generation.name) === generation,
  );
  if (here) return here.types.map((t) => t.name);
  return form.types.map((t) => t.name);
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

export function extractAbilities(form: PokeForm, generation: number): SpeciesAbility[] {
  if (generation < 3) return [];
  return form.abilities.map((a) => ({
    slug: a.ability.name,
    name: { en: capitalize(a.ability.name), es: capitalize(a.ability.name) },
    slot: a.slot,
    hidden: a.is_hidden,
  }));
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
