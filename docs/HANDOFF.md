# Handoff — where the last session stopped

Last updated: 2026-11-20 (UX backlog + UX-01…UX-05 on stacked PRs)

## Exactly where we stopped

- **v0.4.0 «Moves & offensive coverage» is released.** Owner approved it on 2026-11-18;
  tag `v0.4.0` @ `5cdacef`, release published at
  https://github.com/hell-over-studios/dexforge/releases/tag/v0.4.0 and the milestone is
  closed. Issues #54–#57 are closed and Done on the board.
- Shipped this stretch (2026-11-10 → 18):
  - **PRs #59–#62** — visual identity v2 «Pergamino»: field-journal landing, shared
    header/footer from `Base.astro`, paper game workbench with the in-place drawer and
    calm analysis panels. Product truth in `PRODUCT.md`, direction contract in
    `.impeccable/surfaces/home.md`.
  - **PR #63 (T4.1, #54)** — moves pipeline: per-game version-group-filtered learnsets +
    pruned move dictionary; `past_values` applied per field; Gen-I HM gaps filled from
    Yellow; `data:check` invariants.
  - **PR #64 (T4.4, #57)** — abilities dictionary + `inGame`, drawer expanders with effect,
    hidden/not-in-game markers and team peers.
  - **PR #65 (T4.2 part 1, #55)** — `src/lib/moves.ts`, persisted `moves` map +
    `toggleMove`, share **v2** payload with v1 compatibility, `?t=` consumption.
  - **PR #66 (T4.2 part 2, #55)** — `MovePicker` drawer UI (four slots, learnset search +
    type filters, replace-oldest), localized drawer type labels, `e2e/moves.spec.ts`.
  - **PR #67 (T4.3, #56)** — `src/lib/coverage.ts` + `OffensiveCoverage` panel: matrix,
    mobile per-member answers and the “no super-effective hit” callout.
- **Tests: 146 unit tests in 13 files + 8 Playwright e2e** (Chromium desktop + Pixel 5);
  `data:check`, build and CI green.
- **Release executed:** CHANGELOG `[Unreleased]` folded into `[0.4.0] - 2026-11-18` (PR
  #69, tag commit `5cdacef`), annotated tag pushed, GitHub release published from that
  section and milestone v0.4.0 closed. **v0.5.0 re-arms the same MINOR gate** — tag only
  after explicit owner approval.

## Latest (2026-11-20)

- UX backlog: issues #77–#97. Done on a stack of PRs (#98 → #99 → #100 → #101 → UX-05),
  each based on the previous branch; merge them in that order (GitHub retargets as each
  base branch is deleted). Next in line: UX-06 (#82) "Lo que más duele" → filter the index.
- New pieces: `src/lib/events.ts` (cross-island open-member event), `insertAt`/`replaceAt`
  - store `insert`/`replace`, `AnalysisTabs` island + `src/lib/tab-counts.ts`, shared
    dataset cache in `src/lib/dex.ts` (`clearDataCache` for tests).
- e2e gotchas: the index marker says “casilla N” (not “N/6”) so `getByText('6/6')` stays
  unique; tab names include their badge (“Defensa 3 alertas”).
- Playwright was bumped by `pnpm install`; run `pnpm exec playwright install chromium
chromium-headless-shell` on a fresh machine.

## Previous (2026-11-19)

- Branch `feat/revista-identity` (stacked on `fix/spanish-type-and-place-names`): visual
  identity v3 «Revista» (ADR-012). The PR targets the fix branch so its diff stays clean; merge
  the fix PR first, then retarget/merge this one. **Do not merge without the owner's go-ahead.**
- Workbench structure changed: `TeamSlots` is its own island at the top of
  `src/pages/juego/[id].astro`; `Picker` is only the index column; the three analysis islands
  live in hidden-until-selected tab panels (they hydrate on first show). The coverage e2e
  opens the "Cobertura" tab first.
- `e2e`: `ul[role="list"]` must stay unique on the game page (the team sheet); `getByText('6/6')`
  relies on the counter being the only "n/6" text.
- Local preview: `.claude/launch.json` (untracked) runs `pnpm dev` on port 4321.

## Previous (2026-11-18, late)

- Branch `fix/spanish-type-and-place-names`: Pokédex list chips show localized type names;
  encounter location names are localized at build time (`scripts/lib/place-names.ts`,
  dictionary `data/curated/place-names.json`, documented in `data/SCHEMA.md`). The owner
  asked for a PR only: **do not merge it without their go-ahead**.
- The regeneration also picked up upstream PokeAPI edits (10 Emerald ability effect texts
  in Spanish, Sneasel → Sneasler now `use-item` Razor Claw). Expected, not a regression.
- `scripts/.cache` was empty on this machine, so `pnpm data` fetched everything again
  (~10 min). It is warm now.
- 11 location areas remain English on purpose (no verified official Spanish name); add them
  to `place-names.json` once checked.
- The owner is exploring a new UI personality (design boards outside the repo). Hold the
  big workbench redesign until a direction is chosen.

## Open decisions / watch-outs

- Offensive coverage counts **only damaging moves with base power**; status and
  fixed-damage moves are excluded by design (the panel says so). Do not “fix” that.
- Share encoding emits **v1** while nobody has moves and **v2** once any member does;
  both decoders and the strict caps (6 members / 4 moves) must stay.
- The move picker is **team-only** (non-members get a one-line hint) — intentional.
- `?t=` is consumed with `history.replaceState` after seeding so reloads keep newer
  local picks; don't re-apply stale links.
- Coverage gaps use the **2×** threshold against single types (no dual-type math).

## v0.2.0 context (kept short)

v0.2.0 was finished in session 4 via PRs #24–#37 plus the two owner-directive fixes
#40 (official-artwork visuals) and #46 (drawer expands in place); live site
https://hell-over-studios.github.io/dexforge/ (home → game → picker → drawer → team →
analysis panels). Full detail in docs/CHANGELOG.md [0.2.0].

## Releases

v0.1.0 / v0.2.0 / v0.3.0 / v0.4.0 are tagged and published (SHAs 6f373fb / 45e5267 /
86bfd39 / 5cdacef) and their GitHub milestones are closed. The CHANGELOG carries
per-release sections. **v0.5.0 will re-arm the same MINOR gate: tag only after explicit
owner approval.**

## What to do next (first work of next session)

1. Start **v0.5.0 "Encounters & curated data"**: where-to-find UX (route, method, level,
   rate, exclusives, HM/badge requirements) and the curated-data UI (“obtained by evolving
   X”, gifts, trades, statics). Curated datasets are issues #2–#4 (Ready).
2. PR discipline unchanged: one small cohesive PR, `pnpm pre-commit` locally,
   `gh pr checks --watch --fail-fast` before merge, watch `main` after merge (CI + Deploy),
   board branch→In progress / merge→Done.
3. Formatting gotcha (from #51/#52): `docs/*.md` are covered by `prettier --check`; run
   `pnpm format` before committing docs edited with other tools.
4. Release discipline: v0.5.0 is a MINOR too — stop before tagging and ask the owner.

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
pnpm pre-commit       # lint+format+typecheck+test (146 tests in 13 files)
pnpm test:e2e         # build + Playwright (8 e2e, desktop+mobile projects)
pnpm build && pnpm preview
pnpm dev              # pixel-cozy landing page
```

## State facts (so a fresh agent doesn't re-discover)

- pnpm 12.16.1 installed via `npm i -g pnpm` (corepack failed without admin).
- pnpm ≥11 renamed `onlyBuiltDependencies` → `allowBuilds` in `pnpm-workspace.yaml` (esbuild + sharp approved there).
- `pnpm typecheck` = `astro sync && astro check`.
- Data cache hot: `scripts/.cache/pokeapi/` (~9 MB; `pokemon`, `pokemon-species`, `move`,
  `ability`, `type`, `location-area`, `evolution-chain`, `generation`, `pokedex`). Species/forms
  and encounters were re-fetched after the schema purge — the OLD pre-schema payloads were
  deleted deliberately.
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
- Design tokens live in `src/styles/global.css` (`@theme`): forest (page ground),
  paper (panels), ink (text/borders), ember (primary actions) and moss (“good” states)
  ramps, plus the pixel display / rounded body type. New components must use tokens —
  never hard-code colors.
- `gh project ...` commands require the `project` OAuth scope: `gh auth refresh -s project -h github.com`
  (one-time device flow). Board sync scripts: see docs/BOARD.md §Maintenance.
- `gh` in PowerShell: stderr from successful commands raises NativeCommandError noise —
  `2>&1 | Select-Object/-Out-String` it or ignore; PR bodies always via `--body-file`.
- Board field IDs (stable): project PVT_kwDOD5srcc4BqaR8, Status PVTSSF_lADOD5srcc4BqaR8zhoxicY,
  In progress 7a004a76, Done 90873f97.
- Playwright browsers install path: `%LOCALAPPDATA%\ms-playwright` (chromium headless shell currently v1254).
