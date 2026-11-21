/**
 * Minimal ES(default)/EN string table for static documents.
 * The full app i18n (v1.0) will build on this shape: select('[data-i18n]') swaps.
 */

export type Lang = 'es' | 'en';

export const dict = {
  'a11y.skip': { es: 'Saltar al contenido', en: 'Skip to content' },
  'nav.games': { es: 'Juegos', en: 'Games' },
  'nav.how': { es: 'Cómo funciona', en: 'How it works' },

  'hero.title1': { es: 'Tu equipo,', en: 'Your team,' },
  'hero.title2': { es: 'forjado para', en: 'forged for' },
  'hero.title3': { es: 'tu juego.', en: 'your game.' },
  'hero.sub': {
    es: 'Elige uno de los juegos disponibles y arma tu equipo de seis con la tabla de tipos exacta de esa generación. Debilidades, roles y cobertura, sin hojas de cálculo.',
    en: "Pick one of the supported games and build your team of six with that generation's exact type chart. Weaknesses, roles and coverage, without spreadsheets.",
  },
  'hero.cta': { es: 'Elige tu juego', en: 'Choose your game' },
  'hero.how': { es: 'Cómo funciona', en: 'How it works' },
  'hero.proof.games': { es: '3 juegos', en: '3 games' },
  'hero.proof.mons': { es: '604 Pokémon', en: '604 Pokémon' },
  'hero.proof.charts': { es: 'Tablas exactas', en: 'Exact charts' },
  'hero.caption': { es: 'Ruta 101 · Hoenn', en: 'Route 101 · Hoenn' },
  'hero.art': { es: 'Ilustraciones oficiales · PokeAPI', en: 'Official artwork · PokeAPI' },

  'selector.heading': { es: 'Elige tu juego', en: 'Choose your game' },
  'selector.sub': {
    es: 'Cada edición con su Pokédex regional y su tabla de tipos exacta, sin aproximaciones. Entra y empieza a montar el equipo.',
    en: 'Every edition with its own regional Pokédex and exact type chart, no approximations. Step in and start building.',
  },
  'selector.count': { es: '151 + 251 + 202 Pokémon', en: '151 + 251 + 202 Pokémon' },
  'selector.cta': { es: 'Entrar al taller', en: 'Enter the workshop' },
  'selector.missing': { es: '¿Falta tu juego?', en: 'Missing your game?' },
  'selector.missingLink': { es: 'Pídelo en GitHub', en: 'Request it on GitHub' },
  'selector.typesLabel': { es: 'tipos en la tabla', en: 'types in the chart' },

  'how.heading': { es: 'Del juego a la decisión.', en: 'From game to decision.' },
  'how.sub': {
    es: 'Tres pasos. Sin cuentas, sin anuncios y sin cambiar de pestaña.',
    en: 'Three steps. No accounts, no ads, no tab switching.',
  },
  'how.step1.title': { es: 'Elige tu juego', en: 'Pick your game' },
  'how.step1.text': {
    es: 'La edición que estás jugando, de Rojo/Azul a Rubí Omega. La app fija el reparto y la tabla de tipos de esa edición.',
    en: 'The edition you are playing, from Red/Blue to Omega Ruby. The app locks the roster and type chart of that release.',
  },
  'how.step2.title': { es: 'Arma tu equipo', en: 'Build your team' },
  'how.step2.text': {
    es: 'Busca por nombre o número, revisa stats y habilidades, y añade hasta seis Pokémon.',
    en: 'Search by name or number, check stats and abilities, and add up to six Pokémon.',
  },
  'how.step3.title': { es: 'Lee el análisis', en: 'Read the analysis' },
  'how.step3.text': {
    es: 'Debilidades compartidas, inmunidades, roles y medias de stats. Lo que necesitas para ajustar.',
    en: 'Shared weaknesses, immunities, roles and average stats. What you need to adjust.',
  },

  'features.heading': { es: 'Lo que ya está forjado.', en: "What's already forged." },
  'features.sub': {
    es: 'Funciones reales sobre datos reales. Nada de maquetas.',
    en: 'Real features on real data. No mockups.',
  },
  'f.defense.title': { es: 'Tabla defensiva', en: 'Defensive table' },
  'f.defense': {
    es: 'Tabla defensiva exacta por generación, con las rarezas de Gen I incluidas.',
    en: 'Exact defensive table per generation, Gen-I quirks included.',
  },
  'f.roles.title': { es: 'Roles y medias', en: 'Roles & averages' },
  'f.roles': {
    es: 'Radar de medias y un rol por miembro: sweep, muro, tanque o soporte.',
    en: 'Average radar and a role per member: sweeper, wall, tank or support.',
  },
  'f.share.title': { es: 'Compartir sin cuentas', en: 'Share without accounts' },
  'f.share': {
    es: 'Comparte el equipo por URL. Sin cuentas y sin guardar nada en un servidor.',
    en: 'Share the team by URL. No accounts, nothing stored on a server.',
  },
  'f.offense.title': { es: 'Cobertura ofensiva', en: 'Offensive coverage' },
  'f.offense': {
    es: 'Elige hasta cuatro movimientos por miembro y mira qué tipos no puedes golpear súper eficaz.',
    en: 'Pick up to four moves per member and see which types you cannot hit super effectively.',
  },

  'cta.heading': {
    es: 'Tu próxima partida empieza con un equipo.',
    en: 'Your next run starts with a team.',
  },
  'cta.sub': {
    es: 'Elige la región y forja el tuyo. Se guarda en tu navegador.',
    en: 'Pick the region and forge yours. It stays in your browser.',
  },
  'cta.button': { es: 'Empezar a forjar', en: 'Start forging' },

  'footer.disclaimer': {
    es: 'Proyecto de fans, sin afiliación con Nintendo, Game Freak ni The Pokémon Company. Pokémon y todos los nombres/efigies relacionados son propiedad de sus dueños.',
    en: 'Fan-made, not affiliated with Nintendo, Game Freak or The Pokémon Company. Pokémon and all related names/images are their property.',
  },
  'footer.license': { es: 'Código bajo licencia MIT.', en: 'Code licensed MIT.' },
  'footer.art': { es: 'Ilustraciones: PokeAPI', en: 'Artwork: PokeAPI' },

  'bar.label': { es: 'Acciones rápidas', en: 'Quick actions' },
  'bar.search': { es: 'Buscar', en: 'Search' },
  'bar.analysis': { es: 'Análisis', en: 'Analysis' },
  'bar.share': { es: 'Compartir', en: 'Share' },
  'game.back': { es: 'Volver al inicio', en: 'Back to home' },
  '404.kicker': { es: 'Error 404 · Fe de erratas', en: 'Error 404 · Errata' },
  '404.title': {
    es: 'Esta página se arrancó de la revista.',
    en: 'This page was torn out of the magazine.',
  },
  '404.text': {
    es: 'El enlace está roto o la página ya no existe. Si venías de un equipo compartido, pide que te lo copien otra vez.',
    en: 'The link is broken or the page is gone. If you came from a shared team, ask for the link again.',
  },
  '404.editions': { es: 'Ediciones disponibles', en: 'Available editions' },
  /* ADR-012 «Revista»: masthead, cover lines, game spread and analysis tabs */
  'mast.tagline': { es: 'Guía de equipos por juego', en: 'Team guide by game' },
  'strip.charts': {
    es: 'Tablas de tipos exactas por generación',
    en: 'Exact type charts per generation',
  },
  'strip.local': {
    es: 'Sin cuentas: se guarda en tu navegador',
    en: 'No accounts: saved in your browser',
  },
  'strip.fans': { es: 'Hecho por fans, código abierto', en: 'Fan-made, open source' },
  'cover.kicker': { es: 'Especial · Tu sexteto, analizado', en: 'Special · Your six, analyzed' },
  'cover.lineA': { es: 'Pokémon en 3 ediciones', en: 'Pokémon across 3 editions' },
  'cover.lineB': {
    es: 'Qué le duele a tu equipo, de un vistazo',
    en: 'What hurts your team, at a glance',
  },
  'cover.lineC': {
    es: 'Seis miembros, cuatro movimientos cada uno',
    en: 'Six members, four moves each',
  },
  'cover.sticker': { es: '¡Tablas exactas!', en: 'Exact charts!' },
  'selector.kicker': { es: 'Ediciones disponibles', en: 'Available editions' },
  'how.kicker': { es: 'Cómo se usa', en: 'How to use it' },
  'features.kicker': { es: 'En este número', en: 'In this issue' },
  'footer.colophon': { es: 'Colofón', en: 'Colophon' },
  'game.kicker': { es: 'Edición', en: 'Edition' },
  'game.types': { es: 'tipos en la tabla', en: 'types in the chart' },
  'tabs.label': { es: 'Análisis del equipo', en: 'Team analysis' },
  'tabs.defense': { es: 'Defensa', en: 'Defense' },
  'tabs.coverage': { es: 'Cobertura', en: 'Coverage' },
  'tabs.profile': { es: 'Perfil', en: 'Profile' },
  'game.dexStamp': { es: 'Pokédex regional', en: 'Regional Pokédex' },
  'lang.toggle': { es: 'English', en: 'Español' },
} as const;

export type DictKey = keyof typeof dict;
