/**
 * Edition presentation (ADR-012 «Revista»): the version colors used on the
 * home-page edition cards and the game-page opener, plus small per-generation
 * facts the UI shows. Data facts (rosters, charts) still come only from the
 * generated datasets.
 */

/** version colors: the two halves of a paired release, or one solid edition */
const COVER: Record<string, readonly [string, string?]> = {
  'red-blue': ['#e3262b', '#2f6bd8'],
  yellow: ['#f5c400'],
  'gold-silver': ['#d9a520', '#aab4bf'],
  crystal: ['#5cc4dc'],
  'ruby-sapphire': ['#cf2338', '#2a4fc0'],
  emerald: ['#17a35e'],
  'firered-leafgreen': ['#ff6a1a', '#4cae3b'],
  'diamond-pearl': ['#7fa6cf', '#e5a1c0'],
  platinum: ['#9a9ca6'],
  'heartgold-soulsilver': ['#e0b33c', '#b9c4d1'],
  'black-white': ['#2a2a2a', '#ededed'],
  'black-2-white-2': ['#1f2a44', '#e3ecf6'],
  'x-y': ['#2a5bd7', '#d6262f'],
  'omega-ruby-alpha-sapphire': ['#c4122f', '#1d5fd1'],
  'sun-moon': ['#f39c12', '#6c5ce7'],
  'ultra-sun-ultra-moon': ['#ff6a13', '#3b2db5'],
  'sword-shield': ['#1f8fd6', '#d6246e'],
  'legends-arceus': ['#c9a227'],
  'scarlet-violet': ['#e0352b', '#7d3cc8'],
};

/** CSS background for an edition: diagonal split for paired versions */
export function editionBackground(gameId: string): string {
  const [a, b] = COVER[gameId] ?? ['#0e0e0e'];
  return b
    ? `linear-gradient(120deg, ${a} 0 52%, ${b} 52% 100%)`
    : `linear-gradient(120deg, ${a} 0 100%)`;
}

/**
 * Attacking types in that generation's chart: Gen 1 has 15 (no Dark, Steel,
 * Fairy), Gen 2–5 add Dark and Steel (17), Gen 6+ adds Fairy (18).
 */
export function typesInChart(generation: number): number {
  if (generation <= 1) return 15;
  return generation < 6 ? 17 : 18;
}
