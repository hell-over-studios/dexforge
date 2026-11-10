# Handoff — where the last session stopped

Last updated: 2026-11-10 (sessions 5–6: artwork + in-place drawer owner directives, then
**v0.3.0 complete** — T3.1–T3.4)

## Exactly where we stopped

- **v0.3.0 "Team analysis" is fully merged to `main`** and deployed to Pages:
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
  - Each PR: `pnpm pre-commit` + e2e green before merge; `main` CI + Deploy green after.
- Between T3.3 and T3.4 the OWNER merged **PR #51** (`fix(i18n)` ability/location ES names,
  issue #6) from another workspace — it landed `docs/KNOWN_ISSUES.md` unformatted and broke
  `main` CI at Format check; fixed via PR #52 (`docs:` whitespace-only). If touching data
  again, that PR also introduced `data/curated/i18n-fixes.json` + a hook in `scripts/build.ts`.
- Tests: **82 unit tests in 8 files** + **2 Playwright e2e** (Chromium desktop + Pixel 5).
- Owner said "ok bien, continua" (2026-11-08) — autonomous PR-by-PR shipping is approved;
  MINOR tag approvals remain the only owner-gated steps.
- **No tags exist yet.** THREE releases await owner approval: v0.1.0, v0.2.0, v0.3.0
  (review packages below). Work continues in the next milestone without blocking on them.

## Handoff — previous milestone context (kept for the release recipe)

- v0.2.0 was finished in session 4 via PRs #33–#37 (drawer, sprites, team, share, e2e).
- Site is LIVE: https://hell-over-studios.github.io/dexforge/ (home → game → picker →
  drawer → team → analysis panels).

## Review packages for owner — THREE releases awaiting approval

1. **v0.1.0** — scaffold, docs, CI, data pipeline (details unchanged from session 3).
2. **v0.2.0** — team builder core: pixel-cozy tokens/shell, game selector, picker (with
   in-place drawer via PR #46), sprites (official-artwork default per PR #40), team of 6,
   share-by-URL, Playwright e2e + CI, GitHub Pages deploy.
3. **v0.3.0** — team analysis: `src/lib/analysis.ts` + `src/lib/summary.ts` data layers,
   `DefenseCharts` (defensive table + notes), `TeamProfile` (radar + roles), game-accurate
   Gen-I quirks preserved.

**What to look at:** the live site (add a team and read the two new analysis panels),
`docs/CHANGELOG.md` [Unreleased], `docs/ROADMAP.md` (T3.1–T3.4 all `[x]`), merged PRs
#47–#50, board items #41–#44, `pnpm pre-commit`, `pnpm test:e2e`.

**Owner decisions requested:**

1. Approve tagging **v0.1.0**.
2. Approve tagging **v0.2.0**.
3. Approve tagging **v0.3.0**.

**After approval, the owner (or next agent with approval relayed) does (PowerShell-safe version
instead of bash process substitution):**

```powershell
git switch main; git pull
# v0.1.0 tags the HISTORICAL PR #1 merge commit, NOT HEAD (HEAD now contains v0.2/v0.3 work)
git tag -a v0.1.0 6f373fb -m "v0.1.0 - scaffold, docs, CI, game-accurate data pipeline"
git tag -a v0.2.0 45e5267 -m "v0.2.0 - team builder core (picker, drawer, sprites, team, share, e2e, Pages)"
git tag -a v0.3.0 -m "v0.3.0 - team analysis (defensive table, radar+roles, suggestions v1)"
git push origin v0.1.0 v0.2.0 v0.3.0
# release notes: extract each CHANGELOG section to a temp file first, then:
gh release create v0.1.0 --target v0.1.0 --title "v0.1.0" --notes-file $notes
gh release create v0.2.0 --target v0.2.0 --title "v0.2.0" --notes-file $notes
gh release create v0.3.0 --target v0.3.0 --title "v0.3.0" --notes-file $notes
```

(If only a subset is approved, tag only those; do not batch silently.)

## What to do next (first work of next session)

1. Owner releases may land (above); update CHANGELOG link refs and the board/milestones after tagging.
2. Kick off **v0.4.0 "Moves, abilities, offensive coverage"** per `docs/ROADMAP.md` + ADR-009:
   pull the milestone list (`gh api repos/hell-over-studios/dexforge/milestones`) and triage into
   PR-sized issues (T4.x numbering in the T2/T3 style: each issue carries acceptance criteria).
3. PR discipline unchanged: `pnpm pre-commit` locally; `gh pr checks --watch --fail-fast` before
   merge; watch `main` after merge (CI + Deploy); board: branch→In progress, merge→Done.
4. Formatting gotcha from #51/#52: never edit repo docs with tools that don't run Prettier
   before committing; `docs/*.md` are all covered by `pnpm format:check`.

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
