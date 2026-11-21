# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- “Cómo calculamos” page (UX-13, #89): the fixed game-accuracy rules plus, per generation, the types that do not exist yet and every type-chart cell that differs from the newest generation — computed at build time from the datasets (`src/lib/chart-diff.ts`). Linked from the footer and the analysis tabs.
- Magazine-style 404 page (UX-15, #91): “Esta página se arrancó de la revista”, with the way home and links to every edition (ES/EN).
- Example team per edition (UX-12, #88): an empty workbench offers “Probar con un equipo de ejemplo” (six species checked against each game’s dex by `tests/showcase.test.ts`), and “Vaciar” clears the whole team with the same “Deshacer” toast.
- 11 more games, Gen 1–6 (14 in total): Yellow, Crystal, Ruby/Sapphire, FireRed/LeafGreen, Diamond/Pearl, Platinum, HeartGold/SoulSilver, Black/White, Black 2/White 2, X/Y and Omega Ruby/Alpha Sapphire, each with its own regional Pokédex, game-accurate type chart (18 types with Fairy from Gen 6), learnsets and abilities. The home page groups editions by generation; edition colors and per-generation type counts live in `src/lib/editions.ts`; `data:check` derives the expected chart size from the generation and adds Yellow, Platinum and X/Y spot checks.

### Changed

- Index filters (UX-08, #84; UX-06, #82): type and role chips under the search, plus “Buscar quién resiste a X” on each “Lo que más duele” card, which lists the Pokémon of that game that resist or ignore that attacking type (game-accurate chart). Pure `filterDex` in `src/lib/dex.ts`.
- Team sheet (UX-01, #77): a click on a member card opens that Pokémon in the index drawer instead of removing it; a separate ✕ removes it and a toast offers “Deshacer” for 6 s.
- Full team (UX-02, #78): adding a seventh Pokémon no longer drops the oldest member; the drawer asks whom to replace and clears that member’s moves.
- Index (UX-03, #79): rows of Pokémon already in the team show “En tu equipo · casilla N”.
- Analysis tabs (UX-04, #80): Defensa and Cobertura show a live count of problems (types that hit 2+ members; types nobody hits super effectively once moves are picked). The tab bar is now the `AnalysisTabs` island; counts come from `src/lib/tab-counts.ts`.
- Data loading (UX-05, #81): `loadGame`/`loadTypeMeta` share one promise per dataset, so a game page downloads and parses `emerald.json` (~700 KB) once instead of once per island; failed loads are evicted for retry.
- Visual identity v3 «Revista» (ADR-012, design team decision): the site now reads as a strategy-guide magazine — newsprint ground, black masthead and footer, process yellow/cyan/magenta with fixed meanings (act / good / hurts), Anton headlines with condensed Archivo labels, halftone and hard black shadows, official artwork as cut-outs. New anvil-Pokédex logo (`LogoMark.astro`, favicon). The landing is a magazine cover and games are "editions"; the pixel diorama (`PixelScene`) is removed.
- Game workbench: an edition opener, then **Tu sexteto** across the top (six cards with type-color halftone, slot number, artwork cut-out, chips, role and move pips; empty slots say what to do), and a two-column desk — the index (search + in-place drawer, its own scroll) and the analysis in **tabs** (Defensa / Cobertura / Perfil, keyboard-accessible, sticky on desktop). `TeamSlots` is now its own island; role labels moved to `src/lib/roles.ts`.
- Defensive analysis opens with **"Lo que más duele"**: the three attacking types that hit the most members, each with the members it hurts; the heatmap uses magenta for weaknesses, cyan for resists and black for immunities.

### Fixed

- Pokédex list type chips showed the raw slug (`WATER`, `GROUND`) instead of the localized type name; they now use `types.json` names like the drawer and analysis panels.
- Encounter location names are now localized: `scripts/lib/place-names.ts` turns `Road N` into `Ruta N`, translates qualifiers and maps base places through the new curated dictionary `data/curated/place-names.json` (unknown places keep English instead of a guessed name). English names say `Route N`, and slug fallbacks plus a German `Wandert durch Johto` entry are repaired. 7 unit tests.

### Added

- Where-to-find data layer (T5.1, issue #72): `src/lib/encounters.ts` turns each Pokémon’s static `encounters` array into display sections. PokeAPI reports gifts, trades and statics as `kind: "wild"`, so categories come from the method (wild / gift / trade / static / event / evolve); rows that only differ by version collapse into one entry with version chips, exact repeats are dropped, and rows sort by category then location. Localized method labels cover the Gen I–III methods while unknown/curated strings pass through, and helpers format level ranges, rates and version names. 15 unit tests, including real Emerald and Red/Blue data.

## [0.4.0] - 2026-11-18

Moves, abilities and offensive coverage: game-accurate learnsets, a per-Pokémon move
picker with shareable move slots, an offensive coverage panel and ability details, on
the pixel-cozy v2 «Pergamino» identity. Tagged at `5cdacef`; owner-approved 2026-11-18.

### Added

- Moves data pipeline (T4.1, issue #54): every game dataset now ships a version-group-filtered learnset per Pokémon (`moves: [moveId, method, level]`) plus a pruned move dictionary keyed by national move id (EN/ES name, game-accurate type/power/accuracy/PP and damage class). Learnsets ride along in the `pokemon/{form}` payload PokeAPI already caches, so the pipeline only fetches `move/{slug}` for the union of learnable moves. `past_values` are applied per field (Gen-I Bite/Karate Chop/Gust are Normal, Thunder/Fire Blast/Blizzard keep 120 power, Gen-I Blizzard keeps 90 accuracy, Gen-III Crunch is special); Gen 1–3 damage classes derive from type; Gen-I HM gaps are filled from Yellow's identical machine pool; Deoxys uses its Emerald Speed form. `pnpm data:check` now enforces learnset refs, generation limits, levels, types and spot facts for all three games. No UI changes yet (T4.2).
- Abilities view (T4.4, issue #57): each game dataset now carries a pruned `abilities` dictionary (EN/ES name, one-line effect, introduction generation) and every `SpeciesAbility` exposes `inGame`. In the drawer, abilities are in-place expanders showing the effect, an `oculta` marker, a `no en este juego` marker for abilities introduced after the game's generation (Emerald's later-gen slots included) and the team members that share the ability ("También en tu equipo"). Red/Blue and Gold/Silver keep no abilities (Gen III feature). `pnpm data:check` validates ability refs, unused entries, generation ranges and `inGame`, and the Playwright suite covers expand/collapse, peer highlight, the not-in-game marker and ES↔EN copy at desktop and mobile widths.
- Offensive coverage (T4.3, issue #56): a second analysis panel answers “which types can the team hit super effectively?” from the moves picked in the drawer plus each game’s own chart. Desktop shows a defender × member matrix with each member’s best multiplier (moss = 2×+, ember = resisted, ink = immune); mobile lists the types each member answers. A callout names every type no member reaches 2× against, and the copy notes that status and fixed-damage moves are excluded (they do not use the chart for damage). `src/lib/coverage.ts` is pure and unit-tested, and Playwright covers the empty states, gap updates, status exclusion, removal and ES↔EN.
- Move picker (T4.2, issue #55): team members now show four move slots in the detail drawer plus an in-place learnset list (name/slug search, localized type chips, physical/special/status, power/accuracy/PP and level/TM/tutor/egg method) sourced from the version-group-accurate dataset. A fifth pick replaces the oldest, slots remove in place, and choices persist in the team store. Share links gain a `v2` payload (`v2.<game>.<pokemon>[:<moves>]`, max 4 moves per member) while old `v1` links keep working with empty moves; incoming links are consumed after seeding so reloads keep newer local picks. Drawer type labels are now localized (ES/EN), and a Playwright flow covers filter/replace/remove, keyboard toggling, the v2 share round-trip, ES↔EN copy and 360px overflow.

### Changed

- Visual identity v2 «Pergamino» (ADR-008 revision): parchment panels over a deep forest ground, ink text, ember primary actions, larger pixel display type, solid canonical type chips and a field-journal landing with a paper-framed pixel diorama staging official artwork. Shared `SiteHeader`/`SiteFooter` now mount from `Base.astro`; the legacy `bark-*`/`parchment-*` aliases and the `dither` utility are gone now that every screen is on the v2 tokens. Product truth recorded in `PRODUCT.md`, direction contract in `.impeccable/surfaces/home.md`.
- Game page v2 workbench: paper header with a regional-Pokédex stamp, picker and team sheets side by side (team sticky on desktop), in-place detail drawer with ink stat bars and solid type chips. Behavior unchanged (ARIA combobox, share URL, official artwork only). New `useLang` hook removes the `?lang=en` hydration mismatch and lets islands follow the in-page language toggle.
- Analysis panels v2: `DefenseCharts` is a calm paper heatmap (quiet ×1 cells, ember for weaknesses, moss for resists, ink for immunities) with a paper notes block, and `TeamProfile` is a paper profile sheet (ink radar grid, ember polygon, role chips, two-column roster on wide screens).

## [0.3.0] - 2026-11-10

Team analysis: game-accurate defensive table, team stat radar with role heuristic,
and first-pass suggestions, on top of the static per-game datasets (never calls
PokeAPI at runtime). Tagged at `86bfd39`; owner-approved 2026-11-10.

### Added

- Team-analysis data layer (T3.1, issue #41): `src/lib/analysis.ts` with pure `effectiveness` (multiplier composition capped at 4x), `analyzeTeam` (per-member + per-attacking-type profiles in canonical type order) and `analyzeFromData`, always using each game's own `typeChart` (Gen-I quirks for Red/Blue; Steel/Dark for Gold/Silver and Emerald). Unit-tested with synthetic charts and real emitted-JSON invariants; no UI yet (T3.2 next).
- Defensive analysis panel (T3.2, issue #42): `DefenseCharts` island on the game page under the picker + `loadTypeMeta` (localized type names + colors). Mobile-first stacked per-member cards (<md) and a full attacker × member matrix on ≥md; chips are value-coded (ember = ×2/×4 weakness, moss = resistances, dusk = ×0), type dots use the canonical per-type colors, everything is aria-labelled in ES/EN, and the panel shows a cozy empty state until the team has members. 360px and e2e verified.
- Team profile panel (T3.3, issue #43): `src/lib/roles.ts` + `TeamProfile` island: hand-rolled SVG radar of the team's average base stats (ADR-005, no chart libraries, fully static) and a role chip per member with official artwork. The role heuristic is documented v1 (sweeper / special-sweeper / wall / tank / support). Unit-tested; 360px and e2e verified.
- Suggestions v1 (T3.4, issue #44): `src/lib/summary.ts` — defensive summary heuristics over a TeamProfile: shared weaknesses (≥2 members at ×2+), member immunities, and team-wide resists (everything ≤×½, deliberately excluding neutral-everywhere notes). Rendered as cozy localized text lines ("Notas") under the defensive table; unit-tested with Gen-I chart fixtures (Gengar/Golbat: shared psychic weakness, normal immunity, fighting NOT 0x per the GEN1_PATCHES record); 360px and e2e verified.

### Fixed

- Spanish localization of data (issue #6, owner PR #51, merged during this stretch): ability names fetched from PokeAPI and localized (European Spanish `es`, with `es-419` fallback); curated override file `data/curated/i18n-fixes.json` corrects location names PokeAPI leaves untranslated or mistranslates (e.g. Saffron City, Silph Co., Cerulean Cave, Seafoam Islands, Power Plant, Victory Road, Route 101).

## [0.2.0] - 2026-11-10

Team builder core: pixel-cozy design foundation, game selector, Pokémon picker with
detail drawer (expands in place), sprites (official artwork only), team of 6, share
by URL, Playwright e2e, and a live GitHub Pages deploy. Tagged at `45e5267`;
code-complete since 2026-11-08, owner-approved 2026-11-10.

### Added

- GitHub Projects v2 Kanban board for issue triage and assignment (ADR-010), documented in `docs/BOARD.md`: six Status columns, Priority/Area/Size fields, and an initial classification of issues #2–#22.
- Pixel art + cozy design foundation (ADR-008): token set in `src/styles/global.css` (warm bark/parchment/ember palette, Pixelify Sans display + Nunito body fonts, hard offset shadow utilities, `pixelated` sprite utility, subtle `dither` texture, chunky focus ring), font loading in the base layout, an 8×8 pixel pokéball favicon, and a fully tokenized landing page.
- Game selector screen (T2.3): static pixel-cozy `GameSelector` component feeding off `/public/data/games.json` at build time (zero client JS), ES/EN game labels via `data-i18n-pair`, and static `/juego/<id>` placeholder pages so the cards are real, keyboard-conditional links.
- Picker data layer (T2.4): `src/lib/dex.ts` — slim per-game dex index (`DexEntry`: slug, ES/EN names, both dex numbers, game-accurate types, game sprite with official-artwork fallback) built from the static `<game>.json`, accent- and case-insensitive ES/EN/slug/id substring search, and a client `loadDexIndex` fetcher; 13 new unit tests (35 total).
- Pokémon picker (T2.5): React island on `/juego/<id>` with ARIA combobox/listbox keyboard navigation (arrows/Enter/Escape, auto-extending 60-row pages), pixel-crisp sprite avatars, ES/EN copy in-island, pixel-cozy loading/empty states, and a minimal selection summary panel pending the detail drawer.
- GitHub Pages deploy (T2.11, ADR-011): Actions workflow deploying the static build on every `main` push; `site`/`base` config with base-aware internal URLs (`src/lib/paths.ts`); site serves at `https://hell-over-studios.github.io/dexforge/`.
- Pokémon detail drawer (T2.6): pixel-cozy panel on row select — canonical type badges colored from `/data/types.json` (fail-open neutral chips), six quantized pixel stat bars (10% steps), abilities with hidden marker, dex/height/weight; `loadGame`/`loadTypeColors` in `src/lib/dex.ts`.
- Team of 6 (T2.8): pure toggle semantics (present→remove · space→append · full→replace oldest) with a zustand `persist` store keyed per game (`dexforge-team`); pixel slot frames with pure-CSS empty art, accessible slot-remove buttons, and a drawer team button with `aria-live` result note; 11 tests.
- Share-by-URL stub (T2.9): `?t=v1.<gameId>.<idBase36…>` encode/decode (`src/lib/share.ts`, strict decode + sanitize), copy-link button with pixel toast and reduced-motion-safe animation, incoming `?t=` seeds the current game's team; 10 round-trip tests.
- Playwright e2e (T2.10): in-repo `playwright.config.ts` (Chromium desktop + Pixel 5 projects, built-site `preview` webServer), `E2E · Chromium` CI job with report artifact on failure, `test:e2e` script, and a full-loop smoke: pick game → add 6 → share URL → fresh-context restore → reload restore.

### Changed

- Owner directive log: `docs/PROMPT_CHANGES.md` (visual direction + smaller PRs → ADR-008/ADR-009); ROADMAP v0.2.0 expanded into PR-sized tasks with GitHub issues #12–#22.

- **Detail drawer expands in place (owner request 2026-11-08):** selecting a Pokémon now opens the detail panel right under the clicked picker row instead of pinning above the list; it scrolls minimally into view (`block: nearest`, smooth unless `prefers-reduced-motion`), keyboard Enter keeps the chosen row on screen after the query clears, and a top-anchored fallback remains only when the row is outside the visible window.
- **Species visuals: official artwork ONLY (owner directive 2026-11-07).** Picker rows, team slots and the detail drawer use `sprites.official`; the sprite-kind toggles (game / shiny / animated / HOME) and their fallback-chain module (`src/lib/sprites.ts`) were withdrawn along with its 13 tests. Full sprite data stays in the datasets for a possible future decision. DexEntry.alt text now names the artwork; species images render smooth (no `pixelated`).
- `stats` bars use quantized 10% steps for the pixel look; drawer sprite rendering splits pixel (`game`/`shiny`/`animated` → `pixelated`) from smooth (`artwork`/`home`) sources.

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

[Unreleased]: https://github.com/hell-over-studios/dexforge/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/hell-over-studios/dexforge/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hell-over-studios/dexforge/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hell-over-studios/dexforge/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hell-over-studios/dexforge/releases/tag/v0.1.0
