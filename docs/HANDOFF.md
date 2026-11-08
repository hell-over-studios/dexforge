# Handoff — where the last session stopped

Last updated: 2026-11-07 (session 4: T2.6–T2.10 — **v0.2.0 code-complete**)

## Exactly where we stopped

- **All 11 v0.2.0 tasks are merged to `main`**: T2.1–T2.5 + T2.11 (session 3) and today
  T2.6–T2.10 via PRs **#33, #34, #35, #36, #37** (issues #17–#21 closed and Done on the board).
  Every merge was preceded by `pnpm pre-commit` + `gh pr checks --watch` green and followed by
  a green `main` CI + Deploy run (the no-merge-before-green rule held all day).
- **No tags exist yet.** Both `v0.1.0` and `v0.2.0` need owner approval at the MINOR release
  boundary (docs/PROMPT.md §6) — review packages below.
- Site is LIVE on GitHub Pages and includes the full v0.2 loop:
  https://hell-over-studios.github.io/dexforge/ (home → pick game → search → drawer → team → share).
- Tests: **69 unit tests (6 files)** + **2 Playwright e2e** (Chromium desktop + Pixel 5) + e2e CI job.
- The e2e runs the **built** site (`pnpm preview` webServer at the `/dexforge` base) — dev-server
  hydration race avoided by design; `pnpm test:e2e` = build + playwright test.

## Today's PRs (T2.6–T2.10)

- **#33 T2.6** `src/components/PokemonDetail.tsx`: drawer with canonical type badges colored from
  `/data/types.json` (`loadTypeColors` in `src/lib/dex.ts`), 6 quantized pixel stat bars, abilities,
  dex/height/weight; replaced the T2.5 summary panel. Verified at 360 px.
- **#34 T2.7** `src/lib/sprites.ts` fallback chains (game→artwork→home · shiny→game→artwork ·
  animated→game→artwork · artwork→home→game) + pixel-kind rule; drawer sprite toggles with
  unavailable markers, species+kind.alt text, `aria-live` fallback note; 13 tests incl. real-JSON invariants.
- **#35 T2.8** `src/lib/team.ts` pure toggle semantics (present→remove · space→append · full→replace
  oldest) + zustand `persist` (`dexforge-team`, per game); `TeamSlots` pixel frames (pure-CSS empty art);
  drawer team button + `aria-live` note; 11 tests.
- **#36 T2.9** `src/lib/share.ts` `?t=v1.<game>.<idBase36…>` (strict decode, sanitized both ways);
  copy-link + pixel toast (reduced-motion frozen by global CSS); incoming `?t=` seeds the current
  game's team; 10 round-trip tests.
- **#37 T2.10** `playwright.config.ts` + `e2e/team.spec.ts` (full loop: home → Emerald → add 6 →
  copy link → fresh-context restore → reload restore) + `E2E · Chromium` CI job (report artifact on
  failure). ESLint gained an `e2e/**/*.ts` globals block.

## Review packages for owner — TWO releases awaiting approval

1. **v0.1.0** — scaffold, docs, CI, data pipeline (details unchanged from session 3).
2. **v0.2.0** — team builder core: pixel-cozy tokens/shell, game selector, picker (+ drawer,
   sprites), team of 6, share-by-URL, Playwright e2e + CI, GitHub Pages deploy.

**What to look at:** the live site (flow above), `docs/CHANGELOG.md` [Unreleased] (= v0.2.0
content), `docs/ROADMAP.md` (T2.1–T2.11 all `[x]`), merged PRs #24–#37, `pnpm pre-commit`,
`pnpm test:e2e`, `pnpm data:check`.

**Owner decisions requested:**

1. Approve tagging **v0.1.0**.
2. Approve tagging **v0.2.0**.

**After approval, the owner (or next agent with approval relayed) does (PowerShell-safe version
instead of bash process substitution):**

```powershell
git switch main; git pull
# v0.1.0 tags the HISTORICAL PR #1 merge commit, NOT HEAD (HEAD now contains v0.2 work)
git tag -a v0.1.0 6f373fb -m "v0.1.0 - scaffold, docs, CI, game-accurate data pipeline"
git tag -a v0.2.0 -m "v0.2.0 - team builder core (picker, drawer, sprites, team, share, e2e, Pages)"
git push origin v0.1.0 v0.2.0
# release notes: extract each CHANGELOG section to a temp file first, then:
gh release create v0.1.0 --target v0.1.0 --title "v0.1.0" --notes-file $notes
gh release create v0.2.0 --target v0.2.0 --title "v0.2.0" --notes-file $notes
```

(If only one release is approved, tag only that one; do not batch silently.)

## What to do next (first work of next session)

1. Owner releases may land (above); update CHANGELOG link refs and the board/milestones after tagging.
2. Kick off **v0.3.0 team analysis** per `docs/ROADMAP.md` + ADR-009 in the PR-sized-task style:
   open `T3.x` issues (defensive 18×18 game-accurate chart first — the data layer already carries
   per-game charts; then stat radar (lightweight SVG, no heavy lib), average stats/roles,
   suggestion heuristics), then pick them off one PR at a time.
3. PR discipline unchanged: `pnpm pre-commit` locally; `gh pr checks --watch --fail-fast` before
   merge; watch `main` after merge; board: branch→In progress, PR→In review, merge→Done.
4. Content Easter eggs/quality items from the T2.10 run (none open).

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
pnpm pre-commit       # lint+format+typecheck+test (69 tests)
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
