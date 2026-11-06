/**
 * Post-build validation of /public/data (no network):
 * schema sanity + key game-accuracy facts. Runs in CI after data refresh.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameData, GamesRegistry, TypeChart } from '../src/lib/data-schema';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');

const problems: string[] = [];
const check = (cond: boolean, msg: string): void => {
  if (!cond) problems.push(msg);
};

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(OUT_DIR, file), 'utf-8'));
}

/* registry */
const registry = readJson('games.json') as GamesRegistry;
check(registry.games.length >= 3, 'games.json: at least 3 games expected');
for (const g of registry.games) {
  check(
    Number.isInteger(g.pokemonCount) && g.pokemonCount > 50,
    `games.json: ${g.id} too few pokemon`,
  );
  check(g.versions.length > 0, `games.json: ${g.id} versions empty`);
}

/* types */
const types = readJson('types.json') as { types: { slug: string }[] };
check(types.types.length === 18, `types.json: expected 18 types, got ${types.types.length}`);

/* per game */
const EXPECTED_TYPE_COUNT: Record<string, number> = {
  'red-blue': 15, // no Dark, Steel, Fairy
  'gold-silver': 17, // + Dark & Steel (incl. the "unknown" type excluded), no Fairy
  emerald: 17, // + still no Fairy
};

function countEffectiveness(chart: TypeChart, from: string, to: string): number {
  return chart[from]?.[to] ?? 1;
}

for (const g of registry.games) {
  const data = readJson(`${g.id}.json`) as GameData;
  const id = g.id;
  check(data.pokemon.length === g.pokemonCount, `${id}: count mismatch with registry`);
  check(
    Object.keys(data.typeChart).length === (EXPECTED_TYPE_COUNT[id] ?? 18),
    `${id}: type chart size ${Object.keys(data.typeChart).length} != expected ${EXPECTED_TYPE_COUNT[id] ?? 18}`,
  );

  for (const p of data.pokemon) {
    check(p.id > 0 && p.slug.length > 0, `${id} ${p.slug}: bad identity`);
    check(
      p.types.length > 0 && p.types.every((t) => types.types.some((tt) => tt.slug === t)),
      `${id} ${p.slug}: unknown types`,
    );
    const s = p.stats;
    check(
      [s.hp, s.attack, s.defense, s.specialAttack, s.specialDefense, s.speed].every(
        (v) => v >= 1 && v <= 255,
      ),
      `${id} ${p.slug}: stats out of range`,
    );
    check(p.sprites.official !== null, `${id} ${p.slug}: missing official artwork URL`);
    check(
      p.sprites.game !== null || p.sprites.official !== null,
      `${id} ${p.slug}: no sprite at all`,
    );
    check(
      game_gen(p.generationSlug) <= data.meta.generation,
      `${id} ${p.slug}: species from a later generation (${p.generationSlug}) leaked into dex`,
    );
    if (data.meta.generation < 3)
      check(p.abilities.length === 0, `${id} ${p.slug}: Gen 1-2 must not have abilities`);
  }
  check(
    new Set(data.pokemon.map((p) => p.id)).size === data.pokemon.length,
    `${id}: duplicate ids`,
  );

  /* game-accuracy spot checks */
  switch (id) {
    case 'red-blue': {
      check(
        data.typeChart['dark'] === undefined && data.typeChart['steel'] === undefined,
        'red-blue: Dark/Steel must not exist in Gen 1',
      );
      check(
        countEffectiveness(data.typeChart, 'electric', 'ground') === 0,
        'red-blue: Electric vs Ground must be 0',
      );
      break;
    }
    case 'gold-silver': {
      check(
        countEffectiveness(data.typeChart, 'ghost', 'steel') === 0.5,
        'gold-silver: Steel resists Ghost in Gen 2-5',
      );
      check(
        countEffectiveness(data.typeChart, 'dark', 'steel') === 0.5,
        'gold-silver: Steel resists Dark in Gen 2-5',
      );
      check(data.typeChart['fairy'] === undefined, 'gold-silver: Fairy must not exist in Gen 2');
      break;
    }
    case 'emerald': {
      check(data.typeChart['fairy'] === undefined, 'emerald: Fairy must not exist in Gen 3');
      check(
        countEffectiveness(data.typeChart, 'dark', 'steel') === 0.5,
        'emerald: Steel resists Dark in Gen 3',
      );
      break;
    }
    default:
      break;
  }
  /* magnemite/magneton electric-only in Gen 1 */
  if (g.id === 'red-blue') {
    const mag = data.pokemon.find((p) => p.slug === 'magnemite');
    check(
      !!mag && mag.types.join(',') === 'electric',
      'red-blue: magnemite must be electric-only (past_types)',
    );
  }
}

function game_gen(slug: string): number {
  const m = slug.match(/generation-(.+)$/);
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
  return m ? (map[m[1]] ?? 99) : 99;
}

void countEffectiveness;

if (problems.length) {
  console.error(`✖ ${problems.length} data validation problem(s):`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log(`✔ data validation OK — ${registry.games.length} games, ${types.types.length} types`);
