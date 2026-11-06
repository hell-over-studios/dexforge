# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v0.2.0

- Team builder core, per ADR-009 broken into PR-sized tasks T2.1–T2.11 (docs/ROADMAP.md).
- **T2.1** Pixel-art + cozy design foundation (ADR-008): tokens, fonts, landing refresh.

## [0.1.0] - 2026-11-05

Project bootstrap milestone: repository scaffold, documentation system, CI, and the
data pipeline that turns PokeAPI into static, game-accurate JSON.

### Added

- Project scaffold: Astro 5 + React islands, TypeScript strict, Tailwind CSS v4, pnpm.
- Minimal landing page (Spanish default) as a placeholder for the future app.
- Data pipeline `/scripts/build.ts`: cache-first, polite PokeAPI fetcher with rate limiting and retries; emits static JSON (`games.json`, `types.json`, per-game dataset) to `/public/data`.
- Datasets for the three launch games: Red/Blue (151 species, 15×15 chart), Gold/Silver (251 species via `original-johto`, 17×17 chart), Emerald (202 species, 17×17 chart).
- Game-accurate charts adapted to the **2026 PokeAPI schema**: `past_damage_relations` entries apply _up to and including_ their generation; chart cells restricted to types introduced ≤ game generation; Gen-I correction patch table (Bug↔Poison 2×, Ghost/Psychic 0×, Gen-I Ghost↔Ghost 0×, Ice→Fire neutral, Fighting→Ghost ½).
- Game-accurate typing via form-level `past_types` (2026 schema moved it off the species endpoint): Magnemite Electric-only in Gen 1, Electric/Steel from Gen 2; Clefable Normal through Gen 5, Fairy from Gen 6.
- Wild encounter processing per game with version filtering and localized (ES/EN) area names.
- Curated data system: `/data/curated` schema + merge at build time + validation; seeds for starters, classic gifts, statics and events per game.
- Sprite extraction per version group with fallbacks (gen-ii has no `gold-silver` group — separate `gold`/`silver` keys); Gen-I groups ship no shiny sprites.
- `/public/data/games.json` registry (Red/Blue, Gold/Silver, Emerald).
- Documentation system under `/docs` (see AGENTS.md), AGENTS.md, README (ES/EN), CONTRIBUTING, CODE_OF_CONDUCT, MIT LICENSE, disclaimer.
- CI workflow: lint + typecheck + test + build on every push/PR.
- ESLint (flat) + Prettier configs, editorconfig.
- GitHub community files: labels, milestones, issue templates (bug / feature / data correction), PR template, collaborator issues (#2–#9).

[Unreleased]: https://github.com/hell-over-studios/dexforge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hell-over-studios/dexforge/releases/tag/v0.1.0
