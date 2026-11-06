# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v0.2.0

- Game selector, Pokémon picker with game sprites, team of 6, Playwright smoke tests, deploy config.

## [0.1.0] - 2026-11-05

Project bootstrap milestone: repository scaffold, documentation system, CI, and the
data pipeline that turns PokeAPI into static, game-accurate JSON.

### Added

- Project scaffold: Astro 5 + React islands, TypeScript strict, Tailwind CSS v4, pnpm.
- Minimal landing page (Spanish default) as a placeholder for the future app.
- Data pipeline `/scripts/build.ts`: cache-first, polite PokeAPI fetcher with rate limiting and retries; emits static JSON (`games.json`, `types.json`, per-game dataset) to `/public/data`.
- Game-accurate type charts (Gen 1–3) derived from `past_damage_relations`, with unit tests locking historical rules (no Steel/Dark in Gen 1, no Fairy pre-Gen 6, Steel resists Ghost/Dark in Gen 2–5).
- Game-accurate typing via `past_types` (e.g. Magnemite is Electric-only in Red/Blue).
- Wild encounter processing per game with version filtering and localized area names.
- Curated data system: `/data/curated` schema + merge at build time + validation.
- `/public/data/games.json` registry (Red/Blue, Gold/Silver, Emerald).
- Documentation system under `/docs` (see AGENTS.md), AGENTS.md, README (ES/EN), CONTRIBUTING, CODE_OF_CONDUCT, MIT LICENSE, disclaimer.
- CI workflow: lint + typecheck + test + build on every push/PR.
- ESLint (flat) + Prettier configs, editorconfig.
- GitHub community files: labels, milestones, issue templates (bug / feature / data correction), PR template, initial collaborator issues.

[Unreleased]: https://github.com/hell-over-studios/dexforge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hell-over-studios/dexforge/releases/tag/v0.1.0
