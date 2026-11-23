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
  'sun-moon': entry(722, 'Rowlet', ['grass', 'flying']),
  'ultra-sun-ultra-moon': entry(800, 'Necrozma', ['psychic']),
};

/**
 * Example team per game (UX-12, #88): six species available in that game's
 * regional dex (checked by tests/showcase.test.ts against the datasets), so a
 * first visit can see the whole analysis in one click.
 */
export const EXAMPLE_TEAMS: Record<string, number[]> = {
  'red-blue': [3, 26, 112, 121, 143, 65],
  yellow: [25, 6, 131, 143, 65, 112],
  'gold-silver': [157, 181, 130, 208, 196, 214],
  crystal: [157, 181, 130, 208, 196, 214],
  'ruby-sapphire': [260, 282, 310, 334, 306, 373],
  emerald: [260, 282, 310, 334, 306, 257],
  'firered-leafgreen': [6, 135, 131, 143, 65, 112],
  'diamond-pearl': [392, 448, 445, 419, 407, 405],
  platinum: [392, 448, 445, 419, 468, 405],
  'heartgold-soulsilver': [157, 181, 130, 208, 196, 214],
  'black-white': [500, 530, 609, 553, 635, 547],
  'black-2-white-2': [503, 530, 609, 553, 635, 596],
  'x-y': [658, 448, 700, 715, 681, 697],
  'omega-ruby-alpha-sapphire': [260, 282, 310, 334, 306, 373],
  'sun-moon': [724, 26, 745, 748, 784, 738],
  'ultra-sun-ultra-moon': [727, 26, 745, 748, 784, 738],
};
