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

- **Status:** Superseded by ADR-012 «Revista» (2026-11-19). Originally accepted (owner directive, 2026-11-06)
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

### Revision 2026-11-16 — Pixel-cozy v2 «Pergamino» (owner directive)

- **Status:** Accepted · **Date:** 2026-11-16
- **Context:** After v0.3.0 the owner rejected the current rendition outright ("No me gusta para nada como esta visualmente") while keeping the pixel-cozy mandate. The warm-bark/dark-panel world read as a generic dark dashboard and hid the product's field-journal character. The renovation was done with the Impeccable design workflow (PRODUCT.md + surface brief) and shipped in PR-sized slices under ADR-009.
- **Decision:**
  - **Ground and surfaces:** page ground becomes deep forest (`#08130d` → `#143021`); content sits on **parchment panels** (`#fbf5e6` / `#f4e8cf`) with **ink** text (`#241c12`). Ember (`#f7931e`) stays the primary action color; moss (`#62a85a`) is the secondary/"good" accent. Dark bands keep the forest and paper grain.
  - **Typography:** Pixelify Sans + Nunito stay, but display sizes grow (landing hero up to `4.6rem`, section headings `4xl–5xl`) and body copy moves to `14–18px` with generous leading on paper.
  - **Composition:** field-journal at the trailhead. The landing stages a paper-framed **pixel diorama** (`PixelScene`) with official artwork of the featured species, tape corners and a caption plate, then three game cards styled as trail markers. The game page becomes a parchment workbench (picker + team) with the analysis panels below as calm paper sheets.
  - **Type chips:** solid canonical type colors with ink text and a 2px ink border, uppercase Pixelify Sans at `0.7rem` — legible, not pastel.
  - **Shape and depth:** square corners, 2px ink borders, hard ink offset shadows (4–6px), paper/forest dither grain. No blur, glow or glass.
  - **Shared shell:** `SiteHeader`/`SiteFooter` mounted by `Base.astro`; every route inherits the same wordmark, nav, language toggle and disclaimer.
  - **Migration:** the `bark-*`/`parchment-*` aliases and the `dither` utility bridged the rollout and were removed once every screen (landing, game workbench, analysis panels) was on the v2 tokens.
- **Alternatives:** keep the bark rendition and only polish spacing (rejected: owner dislikes the world itself); parchment-only light theme (rejected: loses the cozy dusk forest and the diorama contrast).
- **Consequences:** Tokens are the contract (`forest-*`, `paper-*`, `ink-*`, `ember-*`, `moss-*`); `PRODUCT.md` and `.impeccable/surfaces/home.md` record the direction; `DESIGN.md` must be written once the game page lands. New UI reviews for the v2 world: paper panel, ink text, hard shadow, solid type chips, field-journal composition.

## ADR-011 — Deploy target: GitHub Pages via Actions

- **Status:** Accepted (owner directive, 2026-11-07)
- **Context:** T2.11 needed the deploy target. The owner delegated the platform choice and suggested GitHub Pages; PROMPT.md rules (static site, no runtime PokeAPI calls, no paid services) fit Pages perfectly. Actions-based deployment also fits the self-merge autonomy (no external account linking).
- **Decision:** Deploy the static build to **GitHub Pages** from `main` via `actions/upload-pages-artifact` + `actions/deploy-pages` (workflow `.github/workflows/deploy.yml`, also `workflow_dispatch`). Site serves at `https://hell-over-studios.github.io/dexforge/` → `astro.config.mjs` sets `site` + `base: '/dexforge'`. All internal URLs are built with `src/lib/paths.ts` (`withBase`/`siteBase` from `import.meta.env.BASE_URL`); the picker dataset fetch is base-aware too. Repo-side hardening limited to what Pages allows: `<meta name="referrer" content="strict-origin-when-cross-origin">` (custom HTTP headers are not configurable on Pages).
- **Alternatives:** Cloudflare Pages / Vercel (richer header/edge control but need account linking), raw `gh-pages` branch (obsolete pattern).
- **Consequences:** Zero extra infra cost; deploys on every `main` push (green CI is checked in CI workflow but Pages deploys independently — docs must keep "never merge red" discipline). Internal links MUST use `withBase`, never bare `/…` hrefs (lint via review discipline; a broken base path fails only in preview). Pages ignores URL features like redirects/headers.

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

## ADR-012 — Visual direction «Revista» (magazine) + anvil-Pokédex logo

- **Status:** Accepted (design team decision, 2026-11-19). Supersedes ADR-008 and its «Pergamino» revision.
- **Context:** The design lead explored five personalities for the site (Pokédex hardware, strategy magazine, tactics board, candy stickers, scientific archive) on top of the already-approved usability changes (team sheet on top, a workbench with the index and the analysis side by side, a "what hurts most" summary, localized chips and places). The team picked the **strategy magazine** personality and the **anvil-Pokédex fusion** logo.
- **Decision:**
  - **World:** an early-2000s strategy-guide magazine. Newsprint ground (`paper-*`), black press ink (`ink-*`), black masthead/footer bands (`forest-*` now means black), process **yellow** for primary actions (`ember-*`), process **cyan** for "good" (`moss-*`: resists, immunities, coverage) and process **magenta** for "it hurts" (new `magenta-*`: weaknesses, alerts, kickers). Token names are kept so every island migrates by value; only the new meaning got a new ramp.
  - **Type:** _Anton_ for headlines and big numbers (`font-headline`, h1–h3 in the base layer); _Archivo_ with its width axis for condensed uppercase labels (`kicker`, `font-display`) and body copy. Both cover Latin-Extended.
  - **Shape and texture:** 2–3px black rules, hard black offset shadows (4–10px), halftone dot screens (`halftone`, `paper-grain`, `forest-grain`) and outline-following cut-out shadows on official artwork (`cutout`). Type chips become rounded pills. No blur, glow or glass.
  - **Composition:** the landing is a magazine cover (headline, cover lines, the Hoenn trio as cut-outs, a sticker); games are "editions" in their version colors. The game page opens like an edition, then shows **Tu sexteto** (six cards: type-color halftone, slot number, artwork cut-out, name tag, chips, role, move pips) and a two-column desk: the **index** (search + in-place drawer, scrolls on its own) and the **analysis tabs** (Defensa / Cobertura / Perfil, WAI-ARIA tabs, sticky on desktop). Defense opens with **"Lo que más duele"**: the three attacking types that hit the most members, with who suffers them.
  - **Logo:** the Pokédex forged into an anvil (lens and status lights on the top face, horn on the left, a spark above), pixel art drawn as SVG rects in `src/components/LogoMark.astro` and `public/favicon.svg`.
  - **Unchanged:** official artwork only for species (owner directive 2026-11-07), no ripped 3D models, mobile-first, keyboard + contrast, `prefers-reduced-motion`, Spanish default + English, no runtime PokeAPI.
- **Alternatives:** keep «Pergamino»; the other four explored personalities.
- **Consequences:** The pixel diorama (`PixelScene`) is removed. `PRODUCT.md`, `.impeccable/surfaces/home.md`, `AGENTS.md` and `docs/AI_WORKFLOW.md` point here. UI reviews now check the magazine world: black rules, hard shadows, Anton/Archivo, and press colors with their meaning (yellow = act, cyan = good, magenta = hurts).
