# Dexforge

**ES** · [English below](#english)

Construye tu equipo Pokémon para cualquier juego principal de la serie: estadísticas,
tabla de tipos exacta de cada generación, cobertura ofensiva, dónde capturar a cada
Pokémon y cómo aguanta tu equipo contra los líderes de gimnasio y el Alto Mando.
Comparte equipos por URL y expórtalos al formato de Pokémon Showdown.

> **Descargo de responsabilidad** — Proyecto de fans, sin afiliación con Nintendo,
> Game Freak ni The Pokémon Company. Pokémon y todos los nombres/efigies
> relacionados son propiedad de sus dueños.

## Estado

`v0.1.0` — andamio, documentación, CI y pipeline de datos (Red/Blue, Gold/Silver,
Emerald) desde [PokeAPI](https://pokeapi.co) hacia JSON estático y exacto por
generación. El selector de juego y el constructor de equipo llegan en `v0.2.0`
(see [docs/ROADMAP.md](docs/ROADMAP.md)).

## <a id="english"></a>English

Build your Pokémon team for any main-series game: stats, the exact type chart of
each generation, offensive coverage, where to catch each Pokémon, and how your
team fares against gym leaders and the Elite Four. Share teams by URL, export
them to Pokémon Showdown format.

> **Disclaimer** — Fan-made, not affiliated with Nintendo, Game Freak or The
> Pokémon Company. Pokémon and all related names/images are their property.

## Status

`v0.1.0` — scaffold, docs, CI and the data pipeline (Red/Blue, Gold/Silver,
Emerald) from [PokeAPI](https://pokeapi.co) into static, generation-accurate JSON.
The game selector and team builder arrive in `v0.2.0` (see
[docs/ROADMAP.md](docs/ROADMAP.md)).

## Development

```bash
pnpm install
pnpm data       # regenerate /public/data (PokeAPI → cached → static JSON)
pnpm dev        # dev server
pnpm test       # unit tests
pnpm pre-commit # lint + format + typecheck + tests
```

Docs index: [AGENTS.md](AGENTS.md) · [docs/](docs/) · task board in
[docs/BOARD.md](docs/BOARD.md) · game accuracy rules in
[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) · decisions in
[docs/DECISIONS.md](docs/DECISIONS.md).

## Tech

Astro 5 + React islands · TypeScript strict · Tailwind CSS v4 · Vitest ·
ESLint + Prettier · pnpm · GitHub Actions. Data pipeline in TypeScript under
`scripts/` — the deployed site never calls PokeAPI at runtime.

Sprites © Pokémon/Nintendo, served by [PokeAPI sprites](https://github.com/PokeAPI/sprites).
Game data © PokeAPI contributors (ODbL-compatible usage).

## License

[MIT](LICENSE) — see also the disclaimer above regarding Pokémon assets.
