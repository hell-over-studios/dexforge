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

const MOVE_METHODS = ['level-up', 'machine', 'egg', 'tutor'];

function learnSlugs(data: GameData, species: string): Set<string> {
  const p = data.pokemon.find((x) => x.slug === species);
  return new Set(
    (p?.moves ?? [])
      .map(([moveId]) => data.moves[String(moveId)]?.slug)
      .filter((slug): slug is string => typeof slug === 'string'),
  );
}

function moveInfo(data: GameData, slug: string) {
  return Object.values(data.moves).find((m) => m.slug === slug);
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

    /* learnsets: refs resolve, no later-gen leaks, sane levels */
    check(p.moves.length > 0, `${id} ${p.slug}: empty learnset`);
    const seenMoves = new Set<number>();
    for (const [moveId, method, level] of p.moves) {
      const move = data.moves[String(moveId)];
      check(!!move, `${id} ${p.slug}: move id ${moveId} missing from the dictionary`);
      if (!move) continue;
      check(!seenMoves.has(moveId), `${id} ${p.slug}: duplicate move ${move.slug}`);
      seenMoves.add(moveId);
      if (method === 'level-up') {
        check(
          level !== null && level >= 0 && level <= 100,
          `${id} ${p.slug}: ${move.slug} has level ${String(level)}`,
        );
      } else {
        check(level === null, `${id} ${p.slug}: ${move.slug} (${method}) must not have a level`);
      }
    }
  }
  check(
    new Set(data.pokemon.map((p) => p.id)).size === data.pokemon.length,
    `${id}: duplicate ids`,
  );

  /* move dictionary: schema + game accuracy */
  const referencedMoves = new Set<number>();
  for (const p of data.pokemon) for (const [moveId] of p.moves) referencedMoves.add(moveId);
  for (const [key, move] of Object.entries(data.moves)) {
    const moveId = Number(key);
    check(Number.isInteger(moveId) && moveId > 0, `${id}: move key "${key}" is not a valid id`);
    check(referencedMoves.has(moveId), `${id}: move ${key} is in the dictionary but unused`);
    check(move.slug.length > 0, `${id} move ${key}: empty slug`);
    check(
      // Gen II-IV "???" moves (Curse) surface as `unknown` in PokeAPI
      move.type === 'unknown' || move.type in data.typeChart,
      `${id} move ${move.slug}: type "${move.type}" does not exist in this game's chart`,
    );
    check(
      ['physical', 'special', 'status'].includes(move.damageClass),
      `${id} move ${move.slug}: bad damage class "${move.damageClass}"`,
    );
    check(
      Number.isInteger(move.generation) &&
        move.generation >= 1 &&
        move.generation <= data.meta.generation,
      `${id} move ${move.slug}: generation ${move.generation} after the game`,
    );
    check(
      move.power === null || (move.power >= 0 && move.power <= 250),
      `${id} move ${move.slug}: power out of range`,
    );
    check(
      move.name.en.length > 0 && move.name.es.length > 0,
      `${id} move ${move.slug}: empty localized name`,
    );
  }
  for (const p of data.pokemon) {
    for (const [, method] of p.moves) {
      check(MOVE_METHODS.includes(method), `${id} ${p.slug}: unsupported learn method "${method}"`);
    }
  }

  /* ability dictionary: refs resolve, no unused rows, generation guard */
  const referencedAbilities = new Set<string>();
  for (const p of data.pokemon) {
    for (const a of p.abilities) {
      referencedAbilities.add(a.slug);
      const info = data.abilities[a.slug];
      check(!!info, `${id} ${p.slug}: ability "${a.slug}" missing from the dictionary`);
      if (!info) continue;
      check(
        a.inGame === info.generation <= data.meta.generation,
        `${id} ${p.slug}: ability ${a.slug} has a wrong inGame flag`,
      );
      check(a.name.en.length > 0 && a.name.es.length > 0, `${id} ${p.slug}: ability without name`);
    }
  }
  for (const [slug, info] of Object.entries(data.abilities)) {
    check(
      referencedAbilities.has(slug),
      `${id}: ability "${slug}" is in the dictionary but unused`,
    );
    check(info.slug === slug, `${id}: ability key "${slug}" does not match its slug`);
    check(
      Number.isInteger(info.generation) && info.generation >= 3 && info.generation <= 9,
      `${id} ability ${slug}: generation ${info.generation} out of range`,
    );
    check(
      info.name.en.length > 0 && info.name.es.length > 0,
      `${id} ability ${slug}: empty localized name`,
    );
    check(info.effect.en.length > 0, `${id} ability ${slug}: empty English effect`);
  }

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
      check(
        Object.keys(data.abilities).length === 0,
        'red-blue: Gen 1 must not ship an ability dictionary',
      );
      check(
        learnSlugs(data, 'charizard').has('flamethrower'),
        'red-blue: charizard must learn flamethrower',
      );
      check(
        learnSlugs(data, 'pikachu').has('thunderbolt'),
        'red-blue: pikachu must learn thunderbolt',
      );
      const machop = learnSlugs(data, 'machop');
      check(
        !machop.has('brick-break') && !machop.has('rock-smash'),
        'red-blue: machop must not learn fighting TMs from later generations',
      );
      check(
        moveInfo(data, 'flamethrower')?.power === 95,
        'red-blue: flamethrower must keep the Gen-I 95 power',
      );
      check(
        moveInfo(data, 'tackle')?.power === 35,
        'red-blue: tackle must keep the Gen-I 35 power',
      );
      check(
        moveInfo(data, 'thunder')?.power === 120,
        'red-blue: thunder must keep the Gen-I 120 power',
      );
      check(
        moveInfo(data, 'blizzard')?.accuracy === 90,
        'red-blue: blizzard must keep the Gen-I 90 accuracy',
      );
      check(moveInfo(data, 'bite')?.type === 'normal', 'red-blue: bite must be Normal in Gen I');
      check(
        moveInfo(data, 'karate-chop')?.type === 'normal',
        'red-blue: karate-chop must be Normal in Gen I',
      );
      check(learnSlugs(data, 'charizard').has('fly'), 'red-blue: charizard must learn HM02 Fly');
      check(
        learnSlugs(data, 'butterfree').has('flash'),
        'red-blue: butterfree must learn HM05 Flash',
      );
      check(learnSlugs(data, 'diglett').has('cut'), 'red-blue: diglett must learn HM01 Cut');
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
      check(
        Object.keys(data.abilities).length === 0,
        'gold-silver: Gen 2 must not ship an ability dictionary',
      );
      check(learnSlugs(data, 'cyndaquil').has('ember'), 'gold-silver: cyndaquil must learn ember');
      check(moveInfo(data, 'bite')?.type === 'dark', 'gold-silver: bite must be Dark from Gen II');
      check(
        moveInfo(data, 'tackle')?.power === 35,
        'gold-silver: tackle must keep 35 power in Gen II',
      );
      break;
    }
    case 'emerald': {
      check(data.typeChart['fairy'] === undefined, 'emerald: Fairy must not exist in Gen 3');
      check(
        countEffectiveness(data.typeChart, 'dark', 'steel') === 0.5,
        'emerald: Steel resists Dark in Gen 3',
      );
      const mudkip = learnSlugs(data, 'mudkip');
      check(
        mudkip.has('water-gun') && mudkip.has('surf'),
        'emerald: mudkip must learn water gun and surf',
      );
      check(
        moveInfo(data, 'flamethrower')?.power === 95,
        'emerald: flamethrower must still have 95 power in Gen III',
      );
      check(
        moveInfo(data, 'crunch')?.damageClass === 'special',
        'emerald: crunch must be special in Gen III (type-based split)',
      );
      check(
        Object.keys(data.abilities).length > 0,
        'emerald: the ability dictionary must not be empty',
      );
      check(
        data.abilities['levitate']?.name.es === 'Levitación' &&
          (data.abilities['levitate']?.effect.es ?? '').includes('Tierra'),
        'emerald: levitate must carry its Spanish name and effect',
      );
      const wingull = data.pokemon.find((p) => p.slug === 'wingull');
      check(
        wingull?.abilities.some((a) => a.slug === 'keen-eye' && a.inGame) ?? false,
        'emerald: wingull must have keen-eye in game',
      );
      check(
        data.pokemon.some((p) => p.abilities.some((a) => !a.inGame)),
        'emerald: later-generation abilities must be flagged as not in game',
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
