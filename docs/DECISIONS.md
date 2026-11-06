# Dexforge — Decision Log (ADR style)

Format: **ADR-NNN — Title** · Status · Date · Context · Decision · Alternatives · Consequences.

## ADR-001 — pnpm as package manager

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** Prompt mandates pnpm; Node 24 had no pnpm preinstalled; corepack enable failed without admin rights.
- **Decision:** Install pnpm via `npm i -g pnpm`; pin `packageManager` in package.json; CI uses `pnpm/action-setup` which honors it.
- **Alternatives:** npm, yarn, corepack shims.
- **Consequences:** Local dev needs a user-global pnpm install once. `pnpm-lock.yaml` is committed.

## ADR-002 — Static JSON data pipeline instead of runtime API

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** Deployed site must never call PokeAPI at runtime (prompt hard requirement); lexicographically large dataset but immutable per game.
- **Decision:** Node/TS script in `/scripts` downloads (cache-first into `scripts/.cache`, gitignored), processes and emits static JSON to `/public/data` per game. Runs on demand and in CI data-verification job against the cache or fresh fetch.
- **Alternatives:** Serverless proxy at runtime; full DB (SQLite/D1); fetching PokeAPI client-side.
- **Consequences:** Adding a game = extend `scripts/lib/games.ts` + run pipeline. Data staleness is explicit (files carry `generatedAt`). Game-accuracy requires preprocessing `past_types`/`past_damage_relations` — done once at build.

## ADR-003 — Derived "game-accuracy" strategy

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** PokeAPI models _current_ truth; Gen 1/2 Magnemite is electric-only, Fairy types don't exist pre-Gen 6, type charts changed over time.
- **Decision:** Use `species.past_types` (choose the entry describing the game's generation) for game-accurate types; build type charts from `generation.past_damage_relations` / current `damage_relations` for the game's generation. If a species lacks a usable past entry, fall back to current types and log a data gap at build.
- **Alternatives:** Hand-maintained type chart JSON; current types with a disclaimer.
- **Consequences:** Data is accurate for Gen 1–5 games without manual charts; tests lock key chart facts (e.g. Gen 2–5 Steel resists Ghost/Dark, no Fairy pre-Gen 6, Gen 1 no Dark/Steel).

## ADR-004 — Curated encounters live in `/data/curated` and are merged at build

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** PokeAPI encounter data covers wild encounters only, missing gifts, trades, statics and "evolve X" availability.
- **Decision:** Hand-curated JSON per game at `/data/curated/<game-id>.json` (schema in `data/SCHEMA.md`), reviewed via PR (good for community). The pipeline merges it into the per-game JSON with `source: "curated"`.
- **Alternatives:** Separate runtime curated file fetched by the UI; client-side merge.
- **Consequences:** One data file to download per game; curation errors are caught in CI validation; merge logic must be tolerant (`species` resolves by slug first, warns on failure and continues).

## ADR-005 — Custom SVG radar chart instead of a chart library

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** The prompt allows Recharts "or a lightweight SVG radar". Recharts adds ~90 kB gzip and a React-only API for one chart.
- **Decision:** Hand-rolled SVG radar (~150 LOC React component), fully styleable, animated with CSS/SVG transitions, reduced-motion aware.
- **Alternatives:** Recharts, Chart.js, ECharts.
- **Consequences:** More code to own; zero dependency weight; perfect fit for the visual language.

## ADR-006 — Lint/format tooling

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** Astro + React + TS monorepo-lite.
- **Decision:** ESLint flat config with `eslint-plugin-astro`, `typescript-eslint` (recommended), `eslint-plugin-react-hooks`, `eslint-config-prettier`; Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`. Formatting is Prettier's job; ESLint handles correctness.
- **Alternatives:** Biome.
- **Consequences:** Two config files, standard ecosystem.

## ADR-007 — Repo & release workflow (autonomy rules)

- **Status:** Accepted · **Date:** 2026-11-05
- **Context:** Human owner wants autonomous agent progress with control at MINOR/MAJOR boundaries.
- **Decision:** All work lands via `feat/<version>` branches → PR → CI green → self-merge for PATCH-level work; v0.1.0 (first MINOR) stops before tagging for owner review. Docs (`PROGRESS`, `HANDOFF`, `CHANGELOG`) updated before every session end.
- **Alternatives:** Direct-to-main pushes (rejected: loses CI gate and review trail).
- **Consequences:** `main` should always be releasable-quality; tags only after owner approval for x.Y.0 / X.0.0.

## ADR-008 — Visual direction: pixel art + cozy

- **Status:** Accepted (owner directive, 2026-11-06)
- **Context:** The prompt only said "avoid generic AI-template looks" and listed required UI behaviors (game-sprite default, toggles, smooth transitions, mobile-first, reduced motion). The owner explicitly chose a **pixel art + cozy** style. It must also harmonize with the sprites themselves, which are low-res pixel art by nature.
- **Decision:**
  - **Typography:** display font = _Pixelify Sans_ (a genuine pixel font; selected because it covers Latin-Extended, so Spanish á é í ó ú ñ work); body = _Nunito_ (warm rounded humanist sans for readability at small sizes). System fallbacks maintained.
  - **Palette:** warm "campfire dusk" theme — warm dark bark background with cream/parchment text (cozy, non-harsh), ember/amber accents. Dark by default `(cozy ≠ high-contrast sterile dark)`. Type badges keep the 18 canonical type colors as slightly desaturated variants with AA-checked text.
  - **Shapes:** no border-radius glow aesthetics: square/2px-rounded corners, 2px chunky borders and hard offset "pixel" shadows (`4px 4px 0`), no soft blur/glass. Subtle dither/checker textures allowed at very low alpha.
  - **Sprites/imagery:** every Pokémon render uses `image-rendering: pixelated` at integer scale factors to stay crisp; official artwork and HOME renders are shown as-is (they're smooth art). Avatars/decoration may use procedural dithered patterns.
  - **Motion:** small, springy, reduced-motion aware (global 0.01ms clamp already in place); pixel "pop" transitions (blink/step-fade) preferred over slide/parallax.
  - **Imagery rules unchanged:** no ripped 3D models, no official assets beyond the sprites PokeAPI serves.
- **Alternatives:** neon instrumented dark (v0.1 placeholder), light parchment-only theme, glassmorphism.
- **Consequences:** All UI components must adopt the tokens in `src/styles/global.css`; any future component PR reviews for pixel/cozy consistency (chunky border? font used? contrast? reduced motion?).

## ADR-009 — Task granularity: PR-sized tickets and small pull requests

- **Status:** Accepted (owner directive, 2026-11-06)
- **Context:** The owner asked for smaller PRs and finer-grained task breakdown to keep reviews tractable and reduce risk for AI-driven merges.
- **Decision:** ROADMAP milestones are expanded into **PR-sized task units** (each = one branch + PR): ≤ ~400 changed code lines excluding generated data, or one cohesive screen/feature slice. GitHub issues track these units (labels + milestone + acceptance criteria) rather than whole milestones. If work grows past the budget, split it before starting.
- **Alternatives:** one big PR per milestone (v0.1.0 pattern); trunk-based development.
- **Consequences:** More PRs (and a bit more CI overhead) but each is individually revertable and reviewable; recent history is easier to audit. The v0.1.0 mega-PR (#1) remains a one-time bootstrap exception.

## ADR-010 — GitHub Projects v2 as the Kanban board

- **Status:** Accepted (owner directive, 2026-11-06)
- **Context:** ADR-009 turned the roadmap into ~20 PR-sized issues. Labels and milestones alone do not show what is ready, in progress, blocked or in review, and the owner asked for a Kanban board to assign and visualize the issues.
- **Decision:** Maintain one GitHub Projects v2 board (org-owned, linked to the repo) as a **view** over issues — issues stay the source of truth. Columns are the built-in `Status` field (`Backlog`, `Ready`, `In progress`, `In review`, `Blocked`, `Done`); custom fields are `Priority` (`P0`–`P3`), `Area` and `Size` (`S`/`M`/`L`). `docs/BOARD.md` documents the columns, rubric, initial classification and `gh` maintenance commands.
- **Alternatives:** An in-app `/board` page reading the GitHub API (extra runtime code, still cannot assign issues); Trello/Notion (external account, duplicates the issue tracker); labels/milestones only (no workflow state).
- **Consequences:** Automating the board needs the `project` scope on `gh` (one-time `gh auth refresh -s project`). Board fields must be kept in sync when ROADMAP tasks or issue scope change; the board never holds data that exists only there.
