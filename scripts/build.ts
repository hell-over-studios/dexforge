/**
 * PokeAPI -> static JSON pipeline.
 *
 * Usage: pnpm run data [--game red-blue gold-silver emerald] [--verbose]
 * Emits: public/data/games.json, public/data/types.json, public/data/<game-id>.json
 * Never run the built site against PokeAPI: all data is baked at build time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CuratedEncounter,
  CuratedGameData,
  Encounter,
  GameData,
  GamePokemon,
  GamesRegistry,
  LocalizedText,
  PokedexMeta,
  TypeData,
} from '../src/lib/data-schema';
import { fetchPokeApi, mapPolite } from './lib/http';
import { GAMES, TYPE_COLORS } from './lib/games';
import {
  buildTypeChart,
  capitalize,
  curatedToEncounter,
  extractAbilities,
  extractEvolutionChain,
  extractStats,
  flattenWild,
  gameAccurateTypes,
  genNumberFromSlug,
  idFromUrl,
  localName,
  slugFromUrl,
  type EvoLink,
  type PokeEncounterArea,
  type PokeForm,
  type PokeGeneration,
  type PokePokedex,
  type PokeSpecies,
  type PokeType,
} from './lib/process';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const CURATED_DIR = path.join(ROOT, 'data', 'curated');

interface Args {
  only?: string[];
  verbose: boolean;
}
const args: Args = process.argv.slice(2).reduce<Args>(
  (acc, raw) => {
    if (raw === '--verbose') acc.verbose = true;
    else if (raw.startsWith('--game')) acc.only ??= [];
    else if (!acc.only) acc.only = [raw.replace(/^--?/, '')];
    else acc.only.push(raw.replace(/^--?/, ''));
    return acc;
  },
  { verbose: false },
);

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const runId = new Date().toISOString();
  const games = args.only ? GAMES.filter((g) => args.only!.includes(g.id)) : GAMES;
  if (args.only && games.length !== args.only.length) {
    throw new Error(`Unknown game id(s): ${args.only.join(', ')}`);
  }
  console.log(`▲ dexforge data pipeline — ${games.map((g) => g.id).join(', ')}`);

  /* 1. shared resources */
  const allPokedexSlugs = [...new Set(games.flatMap((g) => g.pokedexes))];
  console.log('· shared resources (generations, types, pokedexes)…');
  const [generations, typeRaw, dexes] = await Promise.all([
    ensureGenerations(),
    ensureTypeDetails(),
    ensurePokedex(allPokedexSlugs),
  ]);
  const knownTypes = new Set(typeRaw.map((t) => t.name));
  const typeDetailByName = new Map(typeRaw.map((t) => [t.name, t]));

  /* 2. unique species across the dexes of the selected games */
  const speciesByName = new Map<string, { dex: string; entryNumber: number; name: string }>();
  for (const g of games) {
    for (const dexSlug of g.pokedexes) {
      const dex = dexes.get(dexSlug);
      if (!dex) throw new Error(`Pokedex not found: ${dexSlug}`);
      for (const e of dex.pokemon_entries) {
        if (!speciesByName.has(e.pokemon_species.name)) {
          speciesByName.set(e.pokemon_species.name, {
            dex: dexSlug,
            entryNumber: e.entry_number,
            name: e.pokemon_species.name,
          });
        }
      }
    }
  }
  const speciesList = [...speciesByName.values()];
  console.log(`· unique species to fetch: ${speciesList.length}`);

  /* 3. species + default form */
  const species = await mapPolite(
    speciesList,
    (s) => fetchPokeApi<PokeSpecies>(`pokemon-species/${s.name}`),
    'species',
  );
  const speciesByKey = new Map<string, { sp: PokeSpecies; dex: string; entryNumber: number }>();
  species.forEach((sp) => {
    const key = speciesByName.get(sp.name);
    if (key) speciesByKey.set(sp.name, { sp, dex: key.dex, entryNumber: key.entryNumber });
  });
  const forms = await mapPolite(
    species,
    (sp) => {
      const def = sp.varieties.find((v) => v.is_default) ?? sp.varieties[0];
      return fetchPokeApi<PokeForm>(`pokemon/${def.pokemon.name}`);
    },
    'forms',
  );
  const formBySpeciesName = new Map<string, PokeForm>();
  species.forEach((sp, i) => formBySpeciesName.set(sp.name, forms[i]));

  /* 4. wild encounters */
  const encounters = await mapPolite(
    species,
    (sp) => fetchPokeApi<PokeEncounterArea[]>(`pokemon/${sp.id}/encounters`),
    'encounters',
  );
  const encounterBySpeciesName = new Map<string, PokeEncounterArea[]>();
  species.forEach((sp, i) => encounterBySpeciesName.set(sp.name, encounters[i]));

  /* 5. location names (unique across the selected games' version_details) */
  const gameVersions = new Set(games.flatMap((g) => g.versions));
  const areaSlugs = [
    ...new Set(
      encounters.flatMap((enc) =>
        enc
          .filter((area) => area.version_details.some((vd) => gameVersions.has(vd.version.name)))
          .map((e) => e.location_area.name),
      ),
    ),
  ];
  console.log(`· unique location areas: ${areaSlugs.length}`);
  const locationNames = new Map<string, LocalizedText>();
  await mapPolite(areaSlugs, async (slug) => {
    try {
      const area = await fetchPokeApi<{ names: { name: string; language: { name: string } }[] }>(
        `location-area/${slug}`,
      );
      locationNames.set(
        slug,
        area.names.length
          ? localName(area.names, capitalize(slug))
          : { en: capitalize(slug), es: capitalize(slug) },
      );
    } catch {
      locationNames.set(slug, { en: capitalize(slug), es: capitalize(slug) });
      if (args.verbose) console.warn(`  ⚠ location-area ${slug} missing`);
    }
  });

  /* 6. evolution chains */
  const chainIds = [
    ...new Set(
      species
        .map((sp) => (sp.evolution_chain ? idFromUrl(sp.evolution_chain.url) : 0))
        .filter(Boolean),
    ),
  ];
  const chains = await mapPolite(
    chainIds,
    (id) => fetchPokeApi<{ id: number; chain: EvoLink }>(`evolution-chain/${id}`),
    'evo-chains',
  );
  const chainsById = new Map(chains.map((c) => [c.id, c]));

  /* 7. emit per game */
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'types.json'),
    JSON.stringify(
      {
        generatedAt: runId,
        types: typeRaw
          .filter((t) => t.name in TYPE_COLORS)
          .sort((a, b) => a.id - b.id)
          .map((t) => ({
            id: t.id,
            slug: t.name,
            name: localName(t.names, capitalize(t.name)),
            color: TYPE_COLORS[t.name] ?? '#9299a1',
          })),
      } satisfies TypeData,
      null,
      2,
    ),
  );

  const registry: GamesRegistry = { generatedAt: runId, games: [] };

  for (const game of games) {
    console.log(`\n● building ${game.id}`);
    const gen = generations.get(game.generation);
    if (!gen) throw new Error(`Generation data missing: ${game.generation}`);
    const typeChart = buildTypeChart(
      gen.types.map((gt) => typeDetailByName.get(gt.name)).filter((t) => t !== undefined),
      game.generation,
    );

    const curated = loadCurated(game.id);
    const curatedBySpecies = new Map<string, CuratedEncounter[]>();
    const missing: string[] = [];
    for (const c of curated?.entries ?? []) {
      const list = curatedBySpecies.get(c.species);
      if (list) list.push(c);
      else curatedBySpecies.set(c.species, [c]);
      if (!speciesByName.has(c.species)) missing.push(c.species);
    }
    if (missing.length)
      throw new Error(
        `Curated entries reference species not in the ${game.id} dex: ${missing.join(', ')}`,
      );

    const dataGaps: string[] = [];
    const pokemon: GamePokemon[] = [];

    const gameSpecies = [...speciesByKey.values()]
      .filter((x) => game.pokedexes.includes(x.dex))
      .sort((a, b) => a.entryNumber - b.entryNumber);

    for (const { sp, entryNumber } of gameSpecies) {
      const form = formBySpeciesName.get(sp.name)!;
      const types = gameAccurateTypes(sp, form, game.generation);
      const invalidTypes = types.filter((t) => !knownTypes.has(t));
      if (invalidTypes.length) dataGaps.push(`${sp.name}: unknown types ${invalidTypes.join(',')}`);

      const versionSprites =
        form.sprites.versions?.[`generation-${roman(game.generation)}`]?.[game.spriteVersionGroup];
      const enc: Encounter[] = flattenWild(
        encounterBySpeciesName.get(sp.name) ?? [],
        game.versions,
      ).map((row) => ({
        source: 'pokeapi' as const,
        kind: 'wild' as const,
        locationArea: row.locationArea,
        name: locationNames.get(row.locationArea) ?? null,
        method: row.method,
        rate: round1(row.rate),
        minLevel: row.minLevel,
        maxLevel: row.maxLevel,
        version: row.version,
        notes: null,
      }));
      for (const c of curatedBySpecies.get(sp.name) ?? []) enc.push(curatedToEncounter(c));

      const chainId = sp.evolution_chain ? idFromUrl(sp.evolution_chain.url) : 0;
      const chain = chainsById.get(chainId);

      pokemon.push({
        id: sp.id,
        slug: sp.name,
        name: localName(sp.names, capitalize(sp.name)),
        dexNumber: entryNumber,
        formSlug: form.name,
        generationSlug: sp.generation.name,
        types,
        stats: extractStats(form),
        abilities: extractAbilities(form, game.generation),
        height: form.height,
        weight: form.weight,
        captureRate: sp.capture_rate ?? null,
        sprites: {
          game: versionSprites?.default ?? null,
          shinyGame: versionSprites?.shiny ?? null,
          official: form.sprites.other['official-artwork']?.front_default ?? null,
          showdown: form.sprites.other.showdown?.front_default ?? null,
          home: form.sprites.other.home?.front_default ?? null,
        },
        evolution: chain
          ? { family: extractEvolutionChain(chain.chain) }
          : (() => {
              dataGaps.push(`${sp.name}: no evolution chain`);
              return null;
            })(),
        encounters: enc,
      });
    }

    /* translation accuracy: PokeAPI ES names can be provisional; log counts only */
    const noEsName = pokemon.filter((p) => p.name.es === capitalize(p.slug)).length;

    const dexMeta: PokedexMeta[] = game.pokedexes.map((slug) => {
      const d = dexes.get(slug)!;
      return { id: d.id, slug, name: d.names.length ? localName(d.names, capitalize(slug)) : null };
    });

    const gameData: GameData = {
      meta: {
        id: game.id,
        label: game.label,
        generation: game.generation,
        generationSlug: game.generationSlug,
        versionGroup: game.versionGroup,
        versions: game.versions,
        region: game.region,
        pokedexes: dexMeta,
        generatedAt: runId,
        pokemonCount: pokemon.length,
        dataGaps,
      },
      typeChart,
      pokemon,
    };

    const dataFile = path.join(OUT_DIR, `${game.id}.json`);
    fs.writeFileSync(dataFile, JSON.stringify(gameData));
    const kb = (fs.statSync(dataFile).size / 1024).toFixed(0);
    console.log(
      `  ✔ ${game.id}.json — ${pokemon.length} species, ` +
        `${Object.keys(typeChart).length}x${Object.keys(typeChart).length} chart, ` +
        `${kb} kB` +
        (dataGaps.length ? `, ${dataGaps.length} data gaps` : ''),
    );
    if (args.verbose && dataGaps.length)
      for (const gap of dataGaps) console.log(`    · gap: ${gap}`);
    if (noEsName)
      console.log(`  ⚠ ${noEsName} species have no PokeAPI ES name (English fallback)}`);

    registry.games.push({
      id: game.id,
      label: game.label,
      region: game.region,
      generation: game.generation,
      generationSlug: game.generationSlug,
      versionGroup: game.versionGroup,
      versions: game.versions,
      spriteVersionGroup: game.spriteVersionGroup,
      pokedexes: game.pokedexes,
      pokemonCount: pokemon.length,
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'games.json'), JSON.stringify(registry, null, 2));
  console.log(
    `\n✔ wrote games.json, types.json and ${games.length} game dataset(s) to public/data`,
  );
}

/* ------------------------------------------------------------------ */

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'] as const;

function roman(n: number): string {
  return ROMAN[n - 1] ?? 'x';
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function loadCurated(gameId: string): CuratedGameData | null {
  const file = path.join(CURATED_DIR, `${gameId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as CuratedGameData;
  } catch (err) {
    throw new Error(`Invalid curated JSON for ${gameId}: ${String(err)}`);
  }
}

/* generation & pokedex bootstrapping kept in build (they are pure fetch members) */

async function ensureGenerations(): Promise<Map<number, PokeGeneration>> {
  const gens = await mapPolite([1, 2, 3, 4, 5, 6, 7, 8, 9], (n) =>
    fetchPokeApi<PokeGeneration>(`generation/${n}`),
  );
  return new Map(gens.map((g) => [g.id, g]));
}

async function ensureTypeDetails(): Promise<PokeType[]> {
  return mapPolite(
    Array.from({ length: 18 }, (_, i) => i + 1),
    (n) => fetchPokeApi<PokeType>(`type/${n}`),
    'type details',
  );
}

async function ensurePokedex(slugs: string[]): Promise<Map<string, PokePokedex>> {
  const dexes = await mapPolite(slugs, (s) => fetchPokeApi<PokePokedex>(`pokedex/${s}`));
  return new Map(dexes.map((d) => [d.name, d]));
}

/* note: genNumberFromSlug re-exported for validate.ts */
export { genNumberFromSlug, slugFromUrl };

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
