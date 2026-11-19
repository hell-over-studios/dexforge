/**
 * Spanish place names for encounter locations.
 *
 * PokeAPI ships Spanish names for almost no Gen 1–3 location areas, so the
 * Spanish UI used to fall back to English ("Road 102", "Meteor Falls (back)").
 * This module localizes those English names deterministically:
 *
 *   base name   — "Road N" → "Ruta N", everything else through the curated
 *                 dictionary in data/curated/place-names.json
 *   qualifier   — the "(…)" suffix: floors stay as-is (1F, B1F), known words
 *                 are translated and embedded places are localized recursively
 *
 * A base name that is not in the dictionary returns `null`: the caller keeps
 * the English text rather than guessing a wrong official name.
 */

export type PlaceDictionary = Record<string, string>;

const ROUTE = /^(?:Road|Route) (\d+)$/;
const FLOOR = /^B?\d+F$/;

/** Words that appear inside location qualifiers, longest first when matched. */
const QUALIFIER_WORDS: Record<string, string> = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
  middle: 'centro',
  entrance: 'entrada',
  outside: 'exterior',
  summit: 'cima',
  back: 'fondo',
  'small room': 'sala pequeña',
  'lower cave': 'cueva inferior',
  'upper cave': 'cueva superior',
  underwater: 'bajo el agua',
  'mach bike area': 'zona de la bici carrera',
  'acro bike area': 'zona de la bici acrobática',
  'expansion south': 'ampliación sur',
  'expansion north': 'ampliación norte',
  'north gate': 'puerta norte',
  roof: 'azotea',
  top: 'cima',
  "Bill's house": 'casa de Bill',
  "Mania's house": 'casa de Mania',
  "Steven's house": 'casa de Máximo',
  'Southwest House': 'casa del suroeste',
  NW: 'NO',
  SW: 'SO',
  NE: 'NE',
  SE: 'SE',
};

/**
 * Tidy the English name: curated fixes first (slug fallbacks such as
 * "Shoal-cave-b2f", a German "Wandert durch Johto"), then "Road 102" →
 * "Route 102" because the English games say Route.
 */
export function normalizePlaceEn(en: string, enFixes: PlaceDictionary = {}): string {
  return (enFixes[en] ?? en).replace(/\bRoad (\d+)\b/g, 'Route $1');
}

function translateBase(base: string, dict: PlaceDictionary): string | null {
  const route = ROUTE.exec(base);
  if (route) return `Ruta ${route[1]}`;
  return dict[base] ?? null;
}

function translateQualifierPart(part: string, dict: PlaceDictionary): string {
  const p = part.trim();
  if (FLOOR.test(p)) return p;
  const lower = p.toLowerCase();
  const word = QUALIFIER_WORDS[p] ?? QUALIFIER_WORDS[lower];
  if (word) return word;
  const towards = /^towards (.+)$/i.exec(p);
  if (towards) return `hacia ${translatePlaceEs(towards[1], dict) ?? towards[1]}`;
  const entrance = /^(.+) entrance$/.exec(p);
  if (entrance) return `entrada de ${translatePlaceEs(entrance[1], dict) ?? entrance[1]}`;
  const area = /^Area (\d+)$/i.exec(p);
  if (area) return `zona ${area[1]}`;
  return translatePlaceEs(p, dict) ?? p;
}

function translateQualifier(q: string, dict: PlaceDictionary): string {
  // "Area 1, east" / "1F/small room" / "north, towards Pewter City"
  return q
    .split(', ')
    .map((chunk) =>
      chunk
        .split('/')
        .map((piece) => translateQualifierPart(piece, dict))
        .join('/'),
    )
    .join(', ');
}

/**
 * Localize an English location name to Spanish, or `null` when the base
 * place is unknown (keep English instead of inventing a name).
 */
export function translatePlaceEs(en: string, dict: PlaceDictionary): string | null {
  const whole = dict[en];
  if (whole) return whole;
  const m = /^(.*?) \((.+)\)$/.exec(en.trim());
  const base = (m ? m[1] : en).trim();
  const translated = translateBase(base, dict);
  if (!translated) return null;
  return m ? `${translated} (${translateQualifier(m[2], dict)})` : translated;
}
