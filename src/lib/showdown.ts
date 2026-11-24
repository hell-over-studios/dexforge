/**
 * Pokémon Showdown team text ⇄ Dexforge team (V1-01, #94). Pure, framework-free.
 *
 * Export writes the English species and move names Showdown expects. Import
 * reads the common Showdown/PokePaste shapes ("Nick (Species) (M) @ Item",
 * "Species @ Item", "- Move") and resolves everything against the selected
 * game's own dataset: species outside that game's dex and moves the species
 * cannot learn in that game are reported, never silently dropped.
 */
import type { GameData, GamePokemon } from './data-schema';
import { TEAM_SIZE } from './team';
import { MAX_MOVES } from './moves';

export interface ShowdownMember {
  id: number;
  moves: number[];
}

export interface ShowdownIssue {
  kind:
    'unknown-species' | 'unknown-move' | 'not-learnable' | 'too-many-members' | 'too-many-moves';
  /** the text as written in the paste */
  text: string;
  /** species it belongs to (for move issues) */
  species?: string;
}

export interface ShowdownImport {
  members: ShowdownMember[];
  issues: ShowdownIssue[];
}

/** "Mr. Mime" / "mr-mime" / "Mr Mime" -> "mrmime"; accents and case ignored */
export const showdownKey = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const REGIONS: Record<string, string> = {
  alola: 'Alola',
  galar: 'Galar',
  hisui: 'Hisui',
  paldea: 'Paldea',
};

/**
 * Showdown species name: regional forms are `Base-Region` (`Raichu-Alola`,
 * `Meowth-Galar`), Paldean Tauros keeps its breed (`Tauros-Paldea-Combat`).
 */
function showdownSpecies(mon: GamePokemon): string {
  if (!mon.formSlug.startsWith(`${mon.slug}-`)) return mon.name.en;
  const parts = mon.formSlug.slice(mon.slug.length + 1).split('-');
  const region = REGIONS[parts[0]];
  if (!region) return mon.name.en;
  const base = mon.name.en.replace(/^(Alolan|Galarian|Hisuian|Paldean) /, '');
  const breed = parts[0] === 'paldea' && parts.includes('breed') ? `-${cap(parts[1])}` : '';
  return `${base}-${region}${breed}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Team -> Showdown text (one block per member, blank line between blocks). */
export function exportShowdown(members: ShowdownMember[], game: GameData): string {
  const byId = new Map(game.pokemon.map((p) => [p.id, p]));
  return members
    .map((m) => {
      const mon = byId.get(m.id);
      if (!mon) return null;
      const lines = [showdownSpecies(mon)];
      for (const moveId of m.moves.slice(0, MAX_MOVES)) {
        const move = game.moves[String(moveId)];
        if (move) lines.push(`- ${move.name.en}`);
      }
      return lines.join('\n');
    })
    .filter((block): block is string => block !== null)
    .join('\n\n');
}

/** species from a Showdown header line: "Nick (Species) (M) @ Item" */
function speciesFromHeader(line: string): string {
  const head = line.split('@')[0].trim();
  const groups = [...head.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  const named = groups.filter((g) => !/^[MF]$/i.test(g));
  if (named.length > 0) return named[named.length - 1];
  return head.replace(/\((?:M|F)\)/gi, '').trim();
}

/** Showdown text -> team for this game, with everything that did not fit. */
export function importShowdown(text: string, game: GameData): ShowdownImport {
  const speciesByKey = new Map<string, GamePokemon>();
  for (const p of game.pokemon) {
    for (const name of [
      p.name.en,
      p.name.es,
      p.slug,
      p.formSlug,
      p.formSlug.replace(/-breed$/, ''),
    ]) {
      speciesByKey.set(showdownKey(name), p);
    }
  }
  const moveByKey = new Map<string, number>();
  for (const [id, info] of Object.entries(game.moves)) {
    for (const name of [info.name.en, info.name.es, info.slug]) {
      moveByKey.set(showdownKey(name), Number(id));
    }
  }

  const members: ShowdownMember[] = [];
  const issues: ShowdownIssue[] = [];
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0);

  for (const lines of blocks) {
    const speciesText = speciesFromHeader(lines[0]);
    const mon = speciesByKey.get(showdownKey(speciesText));
    if (!mon) {
      issues.push({ kind: 'unknown-species', text: speciesText });
      continue;
    }
    if (members.length >= TEAM_SIZE) {
      issues.push({ kind: 'too-many-members', text: mon.name.en });
      continue;
    }
    if (members.some((m) => m.id === mon.id)) continue;

    const learnable = new Set(mon.moves.map(([moveId]) => moveId));
    const moves: number[] = [];
    for (const line of lines.slice(1)) {
      if (!line.startsWith('-')) continue;
      const moveText = line
        .replace(/^-\s*/, '')
        .replace(/\s*\[.*\]$/, '')
        .trim();
      const moveId = moveByKey.get(showdownKey(moveText));
      if (moveId === undefined) {
        issues.push({ kind: 'unknown-move', text: moveText, species: mon.name.en });
      } else if (!learnable.has(moveId)) {
        issues.push({ kind: 'not-learnable', text: moveText, species: mon.name.en });
      } else if (moves.length >= MAX_MOVES) {
        issues.push({ kind: 'too-many-moves', text: moveText, species: mon.name.en });
      } else if (!moves.includes(moveId)) {
        moves.push(moveId);
      }
    }
    members.push({ id: mon.id, moves });
  }
  return { members, issues };
}
