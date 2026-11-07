/**
 * Minimal ES(default)/EN string table for static documents.
 * The full app i18n (v1.0) will build on this shape: select('[data-i18n]') swaps.
 */

export type Lang = 'es' | 'en';

export const dict = {
  'app.tagline': {
    es: 'Construye tu equipo Pokémon para cualquier juego principal: debilidades, cobertura, capturas y rivales. De fans, de todos.',
    en: 'Build your Pokémon team for any main-series game: weaknesses, coverage, encounters and rivals. Fan-made, for everyone.',
  },
  'app.supported': { es: 'Elige tu juego', en: 'Choose your game' },
  'app.soon': {
    es: 'El creador de equipos llega en las próximas versiones — elige tu juego para empezar.',
    en: 'The team builder arrives in upcoming releases — pick your game to get started.',
  },
  'selector.cta': { es: 'Elegir este juego', en: 'Pick this game' },
  'game.back': { es: 'Volver al inicio', en: 'Back to home' },
  'game.soon-title': {
    es: 'El creador de equipos llega pronto',
    en: 'The team builder is coming soon',
  },
  'game.soon': {
    es: 'La selección de Pokémon para este juego llega en las próximas versiones — los datos ya están listos.',
    en: 'Pokémon selection for this game arrives in upcoming releases — the data is already ready.',
  },
  'app.features': { es: 'Qué traerá la app', en: "What's coming" },
  'f.analysis': {
    es: 'Tabla defensiva y cobertura ofensiva, con el chart exacto de cada generación.',
    en: 'Defensive table and offensive coverage, with the exact chart of each generation.',
  },
  'f.locations': {
    es: 'Dónde encontrar a cada uno: ruta, método, nivel, probabilidad y exclusivos.',
    en: 'Where to find each one: route, method, level, rate and exclusives.',
  },
  'f.gym': {
    es: 'Cómo aguanta tu equipo contra líderes de gimnasio y el Alto Mando.',
    en: 'How your team fares against gym leaders and the Elite Four.',
  },
  'f.share': {
    es: 'Comparte tu equipo por URL, expórtalo al formato Showdown y guárdalo sin cuentas.',
    en: 'Share teams by URL, export to Showdown format, save them with no accounts.',
  },
  'footer.disclaimer': {
    es: 'Proyecto de fans, sin afiliación con Nintendo, Game Freak ni The Pokémon Company. Pokémon y todos los nombres/efigies relacionados son propiedad de sus dueños.',
    en: 'Fan-made, not affiliated with Nintendo, Game Freak or The Pokémon Company. Pokémon and all related names/images are their property.',
  },
  'footer.license': { es: 'Código bajo licencia MIT.', en: 'Code licensed MIT.' },
  'lang.toggle': { es: 'English', en: 'Español' },
} as const;

export type DictKey = keyof typeof dict;
