/**
 * Build-time showcase species for the landing page. IDs were verified against
 * the generated per-game datasets (all featured species are available in the
 * game they represent). The URL pattern is the same `sprites.official` value
 * emitted by the data pipeline (PokeAPI official artwork).
 */
export interface ShowcaseEntry {
  id: number;
  name: { es: string; en: string };
  types: string[];
  artwork: string;
}

const officialArtwork = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const entry = (id: number, name: string, types: string[]): ShowcaseEntry => ({
  id,
  name: { es: name, en: name },
  types,
  artwork: officialArtwork(id),
});

/** Hero diorama: the Hoenn starters on Route 101. */
export const HERO_TRIO: ShowcaseEntry[] = [
  entry(252, 'Treecko', ['grass']),
  entry(255, 'Torchic', ['fire']),
  entry(258, 'Mudkip', ['water']),
];

/** One representative per supported game. */
export const GAME_FEATURED: Record<string, ShowcaseEntry> = {
  'red-blue': entry(25, 'Pikachu', ['electric']),
  yellow: entry(25, 'Pikachu', ['electric']),
  'gold-silver': entry(155, 'Cyndaquil', ['fire']),
  crystal: entry(245, 'Suicune', ['water']),
  'ruby-sapphire': entry(382, 'Kyogre', ['water']),
  emerald: entry(254, 'Sceptile', ['grass']),
  'firered-leafgreen': entry(6, 'Charizard', ['fire', 'flying']),
  'diamond-pearl': entry(393, 'Piplup', ['water']),
  platinum: entry(487, 'Giratina', ['ghost', 'dragon']),
  'heartgold-soulsilver': entry(249, 'Lugia', ['psychic', 'flying']),
  'black-white': entry(495, 'Snivy', ['grass']),
  'black-2-white-2': entry(646, 'Kyurem', ['dragon', 'ice']),
  'x-y': entry(716, 'Xerneas', ['fairy']),
  'omega-ruby-alpha-sapphire': entry(383, 'Groudon', ['ground']),
};
