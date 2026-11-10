# Handoff — where the last session stopped

Last updated: 2026-11-10 (sessions 5–7: artwork + in-place drawer directives, v0.3.0
complete, **all three releases tagged & published**)

## Exactly where we stopped

- **v0.3.0 "Team analysis" is released.** Owner approved ALL pending MINOR releases on
  2026-11-10 ("acepto todo"); tags + GitHub releases are live:
  - `v0.1.0` @ `6f373fb` (PR #1 historical merge) → https://github.com/hell-over-studios/dexforge/releases/tag/v0.1.0
  - `v0.2.0` @ `45e5267` (includes the two owner-directive fixes #40/#46) → …/releases/tag/v0.2.0
  - `v0.3.0` @ `86bfd39` → …/releases/tag/v0.3.0
  - Release notes were cut per milestone from the pre-split CHANGELOG; the CHANGELOG is
    now restructured into `[0.1.0] / [0.2.0] / [0.3.0]` sections (docs PR #58).
  - GitHub milestones v0.2.0 and v0.3.0 are CLOSED.
- **v0.3.0 content, day-of-merging recap:**
  - PR #47 (T3.1, #41) `src/lib/analysis.ts` — pure per-game defensive analysis layer.
    NOTE: an earlier handoff claimed the typeChart pipeline needed fixes; that was WRONG
    (verified against the PokeAPI cache — steel has been immune to poison since Gen 2, RB
    fire→ghost genuinely = 1). No pipeline change was needed; proof is on issue #41.
  - PR #48 (T3.2, #42) `DefenseCharts` island (mobile cards / desktop matrix) +
    `loadTypeMeta()` in `src/lib/dex.ts`.
  - PR #49 (T3.3, #43) `src/lib/roles.ts` + `TeamProfile` island (static SVG radar + role
    heuristic v1).
  - PR #50 (T3.4, #44) `src/lib/summary.ts` + "Notas" block inside DefenseCharts
    (shared weaknesses / immunities / team-wide resists).
- Between T3.3 and T3.4 the OWNER merged **PR #51** (`fix(i18n)` ability/location ES names,
  issue #6) from another workspace — it landed `docs/KNOWN_ISSUES.md` unformatted and broke
  `main` CI at Format check; fixed via PR #52 (`docs:` whitespace-only). The PR also
  introduced `data/curated/i18n-fixes.json` + a hook in `scripts/build.ts` (counted into
  v0.3.0's release notes as a Fixed item).
- Tests: **82 unit tests in 8 files** + **2 Playwright e2e** (Chromium desktop + Pixel 5).
- Owner autonomy grant stands ("ok bien, continua", 2026-11-08; plus release approval
  2026-11-10). The MINOR tag gate re-arms at the end of v0.4.0.
- **v0.4.0 is triaged into PR-sized tasks** (milestone "v0.4.0 — Moves & offensive coverage"):
  issues **#54** (T4.1 moves data pipeline — Ready), **#57** (T4.4 abilities view — Ready),
  **#55** (T4.2 move picker + share v2 — Backlog, depends on #54), **#56** (T4.3 offense
  matrix — Backlog, depends on #54/#55).

## v0.2.0 context (kept short)

v0.2.0 was finished in session 4 via PRs #24–#37 plus the two owner-directive fixes
#40 (official-artwork visuals) and #46 (drawer expands in place); live site
https://hell-over-studios.github.io/dexforge/ (home → game → picker → drawer → team →
analysis panels). Full detail in docs/CHANGELOG.md [0.2.0].

## Releases (resolved 2026-11-10 — for the record)

All three MINOR releases were owner-approved ("acepto todo") and executed end-to-end:
tagging (see exact SHAs in the top block), pushing, and `gh release create` with notes cut
per milestone. The CHANGELOG was then restructured into `[0.1.0] / [0.2.0] / [0.3.0]`
sections with fresh compare link refs (docs PR #58). GitHub milestones v0.2.0 and v0.3.0
are closed. The same gate re-arms before tagging v0.4.0: STOP for owner approval again.

## What to do next (first work of next session)

1. Start **T4.1 (issue #54, Ready)** — moves data pipeline (version-group filtered
   learnsets). Candidate follow-ups while waiting for review: **T4.4 (issue #57)** abilities
   view (independent). T4.2 (#55) and T4.3 (#56) follow once T4.1 lands.
2. PR discipline unchanged: `pnpm pre-commit` locally; `gh pr checks --watch --fail-fast` before
   merge; watch `main` after merge (CI + Deploy); board: branch→In progress, merge→Done.
3. Formatting gotcha from #51/#52: never edit repo docs with tools that don't run Prettier
   before committing; `docs/*.md` are all covered by `pnpm format:check`.
4. Data-pipeline caveat for T4.1: the 2026 PokeAPI schema findings in `docs/DATA_SOURCES.md`
   - `HANDOFF.md` state facts below apply; the owner's #51 also added the i18n hook inside
     `scripts/build.ts` — read it before extending the pipeline.

### Environment notes for browser verification

- `python` + Playwright (pip + chromium) work on this machine; use the `webapp-testing` skill's
  `with_server.py` against `pnpm preview`. For repo e2e, `pnpm test:e2e` handles everything
  (build + serving + Chromium from `@playwright/test`).
- Verify React islands against **`pnpm preview`** — `pnpm dev` has a `before-hydration.js`
  dynamic-import race in headless Chromium (twice reproducible there, zero issues on preview).

## Commands to resume

```bash
pnpm install          # if fresh machine
pnpm data             # regenerate data (cache in scripts/.cache persists locally)
pnpm data:check       # validate
pnpm pre-commit       # lint+format+typecheck+test (82 tests in 8 files)
pnpm test:e2e         # build + Playwright (2 e2e, desktop+mobile projects)
pnpm build && pnpm preview
pnpm dev              # pixel-cozy landing page
```

## State facts (so a fresh agent doesn't re-discover)

- pnpm 12.16.1 installed via `npm i -g pnpm` (corepack failed without admin).
- pnpm ≥11 renamed `onlyBuiltDependencies` → `allowBuilds` in `pnpm-workspace.yaml` (esbuild + sharp approved there).
- `pnpm typecheck` = `astro sync && astro check`.
- Data cache hot: `scripts/.cache/pokeapi/` (~7 MB gz; species/forms/encounters re-fetched after the
  schema purge — the OLD pre-schema payloads were deleted deliberately).
- **2026 PokeAPI schema findings** (do not trust pre-2026 knowledge):
  - `past_types` lives on the FORM endpoint (`pokemon/{id}`), items are `{slot, type}`; an entry's
    generation is the last generation **up to and including** which those types applied → pick the
    entry with the smallest gen ≥ game gen, else current types.
  - `generation/{n}.types` lists ONLY types _added_ in that generation; `type/{id}.generation` marks
    introduction. There are 18 types (19/20 404; `unknown` exists and is excluded from charts).
  - `past_damage_relations` on `type/{id}`: same "up to and including" semantics; empty entries exist
    (e.g. electric has none) → fall back to `damage_relations` when no entry covers the game gen.
  - Gen-I quirks no longer exposed by the API → hard-coded `GEN1_PATCHES` in `scripts/lib/process.ts`.
  - Sprites: `versions['generation-ii']` has separate `gold`/`silver`/`crystal` keys (no `gold-silver`);
    shiny key is `front_shiny`; gen-i groups ship no shiny.
  - Johto dex slug is `original-johto` (251 entries, chikorita = #001 — matches in-game GSC numbering);
    hoenn ends at deoxys #202 (event-only, acceptable gap).
  - Old cached species payloads (pre-schema) LACKED `past_types`; forms fetched afterwards have it —
    if regenerating with a partially stale cache, purge `scripts/.cache/pokeapi/{pokemon,pokemon-species}`.
- The landing page reads `public/data/games.json` at build time via fs in `src/pages/index.astro`.
- Design tokens live in `src/styles/global.css` (`@theme`): raw oklch values, one ramp per surface
  (bark = backgrounds, parchment = text, ember = accents, moss = secondary). New components must
  use tokens — never hard-code colors.
- `gh project ...` commands require the `project` OAuth scope: `gh auth refresh -s project -h github.com`
  (one-time device flow). Board sync scripts: see docs/BOARD.md §Maintenance.
- `gh` in PowerShell: stderr from successful commands raises NativeCommandError noise —
  `2>&1 | Select-Object/-Out-String` it or ignore; PR bodies always via `--body-file`.
- Board field IDs (stable): project PVT_kwDOD5srcc4BqaR8, Status PVTSSF_lADOD5srcc4BqaR8zhoxicY,
  In progress 7a004a76, Done 90873f97.
- Playwright browsers install path: `%LOCALAPPDATA%\ms-playwright` (chromium headless shell currently v1254).
