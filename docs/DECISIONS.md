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
