/**
 * Pure processing helpers for the data pipeline (no I/O) — unit-tested in tests/.
 */
import type {
  AbilityInfo,
  CuratedEncounter,
  Encounter,
  EncounterKind,
  EvolutionStep,
  EvolutionTarget,
  LocalizedText,
  MoveDamageClass,
  MoveInfo,
  MoveMethod,
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
  /** learnset for every version group the form exists in */
  moves: PokeMoveEntry[];
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
/** one learnset row inside a form payload (`pokemon/{id}`) */
export interface PokeMoveEntry {
  move: NamedRef;
  version_group_details: {
    level_learned_at: number;
    move_learn_method: NamedRef;
    version_group: NamedRef;
  }[];
}
/** historical values: each entry holds the values used BEFORE that version group */
export interface MovePastValues {
  version_group: NamedRef;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  type: NamedRef | null;
}
export interface PokeMove {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  type: NamedRef;
  damage_class: NamedRef | null;
  generation: NamedRef;
  names: NameEntry[];
  past_values: MovePastValues[];
}
/** `ability/{slug}` payload (only the fields we bake) */
export interface PokeAbility {
  name: string;
  generation: NamedRef;
  names: NameEntry[];
  effect_entries: {
    effect: string;
    short_effect: string;
    language: { name: string };
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version_group: NamedRef;
  }[];
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
  // European Spanish first, Latin American as documented fallback (docs/DATA_SOURCES.md)
  const order = lang === 'es' ? ['es', 'es-419'] : ['en'];
  for (const code of order) {
    const hit = names.find((n) => n.language.name === code)?.name;
    if (hit) return hit;
  }
  return fallback;
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

/* ------------------------------------------------------------------ */
/* moves                                                               */
/* ------------------------------------------------------------------ */

/**
 * Version-group slug -> generation number. PokeAPI's version-group resource
 * carries no generation and its numeric ids are not stable across schema
 * bumps, so the slug is the only reliable key. Unknown (newer) groups are
 * treated as 0: they never win a historical-value lookup for the launched
 * games, which is the safe default (modern values are not older values).
 */
export const VERSION_GROUP_GENERATION: Readonly<Record<string, number>> = Object.freeze({
  'red-blue': 1,
  yellow: 1,
  'red-green-japan': 1,
  'blue-japan': 1,
  'gold-silver': 2,
  crystal: 2,
  'ruby-sapphire': 3,
  emerald: 3,
  'firered-leafgreen': 3,
  colosseum: 3,
  xd: 3,
  'diamond-pearl': 4,
  platinum: 4,
  'heartgold-soulsilver': 4,
  'black-white': 5,
  'black-2-white-2': 5,
  'x-y': 6,
  'omega-ruby-alpha-sapphire': 6,
  'sun-moon': 7,
  'ultra-sun-ultra-moon': 7,
  'lets-go-pikachu-lets-go-eevee': 7,
  'sword-shield': 8,
  'the-isle-of-armor': 8,
  'the-crown-tundra': 8,
  'brilliant-diamond-and-shining-pearl': 8,
  'legends-arceus': 8,
  'scarlet-violet': 9,
  'the-teal-mask': 9,
  'the-indigo-disk': 9,
});

export function versionGroupGeneration(slug: string): number {
  return VERSION_GROUP_GENERATION[slug] ?? 0;
}

/** learnset row before it gains the national move id */
export interface PokeLearnEntry {
  slug: string;
  method: MoveMethod;
  level: number | null;
}

/** lower wins when the same move is learnable several ways */
const MOVE_METHOD_PRIORITY: Record<MoveMethod, number> = {
  'level-up': 0,
  machine: 1,
  tutor: 2,
  egg: 3,
};

function isMoveMethod(name: string): name is MoveMethod {
  return name in MOVE_METHOD_PRIORITY;
}

function preferredLearn(a: PokeLearnEntry, b: PokeLearnEntry): boolean {
  const pa = MOVE_METHOD_PRIORITY[a.method];
  const pb = MOVE_METHOD_PRIORITY[b.method];
  if (pa !== pb) return pa < pb;
  if (a.method === 'level-up' && b.method === 'level-up') return (a.level ?? 0) < (b.level ?? 0);
  return false;
}

/**
 * Learnsets are stored inside the form payload (`pokemon/{id}.moves`) for every
 * version group; this keeps only the requested group and one row per move.
 * Unsupported methods (e.g. `light-ball-egg`, `colosseum-purification`) are
 * dropped. Priority: level-up > machine > tutor > egg; ties keep the lowest level.
 *
 * `machineFallbackGroups` adds machine (TM/HM) rows from same-generation groups
 * whose pool is identical — PokeAPI's `red-blue` data misses a few Gen-I HM
 * entries that `yellow` has (Charizard+Fly, Butterfree+Flash, Diglett+Cut…).
 * Those groups are never consulted for level-up/egg/tutor rows.
 */
export function extractLearnset(
  entries: PokeMoveEntry[],
  versionGroup: string,
  machineFallbackGroups: string[] = [],
): PokeLearnEntry[] {
  const bySlug = new Map<string, PokeLearnEntry>();
  for (const entry of entries) {
    let best: PokeLearnEntry | null = null;
    for (const detail of entry.version_group_details) {
      const method = detail.move_learn_method.name;
      const fromFallback = detail.version_group.name !== versionGroup;
      if (
        fromFallback &&
        !(method === 'machine' && machineFallbackGroups.includes(detail.version_group.name))
      )
        continue;
      if (!isMoveMethod(method)) continue;
      const candidate: PokeLearnEntry = {
        slug: entry.move.name,
        method,
        level: method === 'level-up' ? detail.level_learned_at : null,
      };
      if (!best || preferredLearn(candidate, best)) best = candidate;
    }
    if (!best) continue;
    const prev = bySlug.get(best.slug);
    if (!prev || preferredLearn(best, prev)) bySlug.set(best.slug, best);
  }
  return [...bySlug.values()].sort((a, b) => {
    const byMethod = MOVE_METHOD_PRIORITY[a.method] - MOVE_METHOD_PRIORITY[b.method];
    if (byMethod) return byMethod;
    if (a.method === 'level-up' && (a.level ?? 0) !== (b.level ?? 0))
      return (a.level ?? 0) - (b.level ?? 0);
    return a.slug.localeCompare(b.slug);
  });
}

/** Gen 1-3 physical types (the split became per-move in Gen 4) */
export const GEN1_3_PHYSICAL_TYPES: ReadonlySet<string> = new Set([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
]);

export function gameAccurateDamageClass(
  type: string,
  damageClass: string,
  generation: number,
): MoveDamageClass {
  if (damageClass === 'status') return 'status';
  if (generation <= 3) return GEN1_3_PHYSICAL_TYPES.has(type) ? 'physical' : 'special';
  return damageClass === 'physical' ? 'physical' : 'special';
}

/**
 * Game-accurate move details. PokeAPI's `past_values` entries are per-field
 * change records: each entry holds the value that was in effect BEFORE the
 * referenced version group, and only the fields that changed there (e.g.
 * Thunder's gold-silver entry carries the old effect chance while x-y carries
 * the old 120 power). So, per field, pick the oldest entry whose generation is
 * still greater than the game's and fall back to the current value.
 */
export function buildMoveInfo(
  move: PokeMove,
  generation: number,
  nameOverrides?: ReadonlyMap<string, { en?: string; es?: string }>,
): MoveInfo {
  const history = move.past_values
    .map((past) => ({ past, gen: versionGroupGeneration(past.version_group.name) }))
    .filter((x) => x.gen > generation)
    .sort((a, b) => a.gen - b.gen);
  const first = <T>(read: (past: MovePastValues) => T | null): T | null => {
    for (const { past } of history) {
      const value = read(past);
      if (value !== null) return value;
    }
    return null;
  };
  const type = first((past) => past.type?.name ?? null) ?? move.type.name;
  const base = localName(move.names, capitalize(move.name));
  const override = nameOverrides?.get(move.name);
  return {
    slug: move.name,
    name: override ? { en: override.en ?? base.en, es: override.es ?? base.es } : base,
    type,
    damageClass: gameAccurateDamageClass(
      type,
      move.damage_class?.name ?? (move.power === null ? 'status' : 'physical'),
      generation,
    ),
    power: first((past) => past.power) ?? move.power,
    accuracy: first((past) => past.accuracy) ?? move.accuracy,
    pp: first((past) => past.pp) ?? move.pp,
    generation: genNumberFromSlug(move.generation.name),
  };
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

/* ------------------------------------------------------------------ */
/* abilities                                                           */
/* ------------------------------------------------------------------ */

/** PokeAPI text fields carry hard line breaks and form feeds */
export function normalizeText(text: string): string {
  return text.replace(/[\s\f]+/g, ' ').trim();
}

/**
 * One-line ability details. The effect text is the *current* description:
 * PokeAPI only ships Spanish flavor text from X/Y on, so there is no
 * game-era Spanish wording to pick. `es` stays null when even that is
 * missing, letting the UI fall back to English with an explicit lang.
 * English prefers `short_effect` (one line) over the flavor paragraph.
 */
export function buildAbilityInfo(ability: PokeAbility): AbilityInfo {
  const flavor = (lang: string): string | null => {
    const rows = ability.flavor_text_entries.filter((f) => f.language.name === lang);
    const last = rows.at(-1);
    return last ? normalizeText(last.flavor_text) : null;
  };
  const short = ability.effect_entries.find((e) => e.language.name === 'en')?.short_effect;
  const en = (short ? normalizeText(short) : null) ?? flavor('en') ?? capitalize(ability.name);
  return {
    slug: ability.name,
    name: localName(ability.names, capitalize(ability.name)),
    effect: { en, es: flavor('es') ?? flavor('es-419') },
    generation: genNumberFromSlug(ability.generation.name),
  };
}

export function extractAbilities(
  form: PokeForm,
  generation: number,
  abilities?: ReadonlyMap<string, AbilityInfo>,
): SpeciesAbility[] {
  if (generation < 3) return [];
  return form.abilities.map((a) => {
    const slug = a.ability.name;
    const info = abilities?.get(slug);
    return {
      slug,
      name: info?.name ?? { en: capitalize(slug), es: capitalize(slug) },
      slot: a.slot,
      hidden: a.is_hidden,
      inGame: info ? info.generation <= generation : true,
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
