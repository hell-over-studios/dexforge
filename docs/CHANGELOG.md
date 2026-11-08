# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub Projects v2 Kanban board for issue triage and assignment (ADR-010), documented in `docs/BOARD.md`: six Status columns, Priority/Area/Size fields, and an initial classification of issues #2–#22.
- Pixel art + cozy design foundation (ADR-008): token set in `src/styles/global.css` (warm bark/parchment/ember palette, Pixelify Sans display + Nunito body fonts, hard offset shadow utilities, `pixelated` sprite utility, subtle `dither` texture, chunky focus ring), font loading in the base layout, an 8×8 pixel pokéball favicon, and a fully tokenized landing page.
- Game selector screen (T2.3): static pixel-cozy `GameSelector` component feeding off `/public/data/games.json` at build time (zero client JS), ES/EN game labels via `data-i18n-pair`, and static `/juego/<id>` placeholder pages so the cards are real, keyboard-conditional links.
- Picker data layer (T2.4): `src/lib/dex.ts` — slim per-game dex index (`DexEntry`: slug, ES/EN names, both dex numbers, game-accurate types, game sprite with official-artwork fallback) built from the static `<game>.json`, accent- and case-insensitive ES/EN/slug/id substring search, and a client `loadDexIndex` fetcher; 13 new unit tests (35 total).
- Pokémon picker (T2.5): React island on `/juego/<id>` with ARIA combobox/listbox keyboard navigation (arrows/Enter/Escape, auto-extending 60-row pages), pixel-crisp sprite avatars, ES/EN copy in-island, pixel-cozy loading/empty states, and a minimal selection summary panel pending the detail drawer.
- GitHub Pages deploy (T2.11, ADR-011): Actions workflow deploying the static build on every `main` push; `site`/`base` config with base-aware internal URLs (`src/lib/paths.ts`); site serves at `https://hell-over-studios.github.io/dexforge/`.
- Pokémon detail drawer (T2.6): pixel-cozy panel on row select — canonical type badges colored from `/data/types.json` (fail-open neutral chips), six quantized pixel stat bars (10% steps), abilities with hidden marker, dex/height/weight; `loadGame`/`loadTypeColors` in `src/lib/dex.ts`.
- Sprite viewer (T2.7): game / shiny / animated (showdown) / official artwork / HOME toggles with a documented, unit-tested fallback chain (`src/lib/sprites.ts`), `pixelated` rendering for pixel kinds (game/shiny/animated; artwork/HOME are smooth), unavailable-kind markers, localized alt text naming species + shown kind, and an `aria-live` fallback note; 13 tests incl. real-emitted-JSON invariants.
- Team of 6 (T2.8): pure toggle semantics (present→remove · space→append · full→replace oldest) with a zustand `persist` store keyed per game (`dexforge-team`); pixel slot frames with pure-CSS empty art, accessible slot-remove buttons, and a drawer team button with `aria-live` result note; 11 tests.
- Share-by-URL stub (T2.9): `?t=v1.<gameId>.<idBase36…>` encode/decode (`src/lib/share.ts`, strict decode + sanitize), copy-link button with pixel toast and reduced-motion-safe animation, incoming `?t=` seeds the current game's team; 10 round-trip tests.
- Playwright e2e (T2.10): in-repo `playwright.config.ts` (Chromium desktop + Pixel 5 projects, built-site `preview` webServer), `E2E · Chromium` CI job with report artifact on failure, `test:e2e` script, and a full-loop smoke: pick game → add 6 → share URL → fresh-context restore → reload restore.

### Changed

- Owner directive log: `docs/PROMPT_CHANGES.md` (visual direction + smaller PRs → ADR-008/ADR-009); ROADMAP v0.2.0 expanded into PR-sized tasks with GitHub issues #12–#22.

### Changed

- **Species visuals: official artwork ONLY (owner directive 2026-11-07).** Picker rows, team slots and the detail drawer use `sprites.official`; the sprite-kind toggles (game / shiny / animated / HOME) and their fallback-chain module (`src/lib/sprites.ts`) were withdrawn along with its 13 tests. Full sprite data stays in the datasets for a possible future decision. DexEntry.alt text now names the artwork; species images render smooth (no `pixelated`).
- Test counts grew to 56 unit tests (5 files) + 2 Playwright e2e (desktop and mobile viewport projects).
- `stats` bars use quantized 10% steps for the pixel look; drawer sprite rendering splits pixel (`game`/`shiny`/`animated` → `pixelated`) from smooth (`artwork`/`home`) sources.

### Planned for v0.3.0

- Team analysis: defensive table, stat radar, average stats/roles, suggestion engine.

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
