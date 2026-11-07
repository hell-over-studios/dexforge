# Handoff — where the last session stopped

Last updated: 2026-11-06 (session 2: pixel-cozy foundation + task breakdown)

## Exactly where we stopped

- v0.1.0 is merged to `main` (PR #1) and **still NOT tagged** — awaiting explicit owner approval
  (review package below).
- Owner directive landed (2026-11-06): **pixel art + cozy visual direction (ADR-008)** and
  **smaller PRs / finer task breakdown (ADR-009)** — recorded in `docs/PROMPT_CHANGES.md` (PR #10).
- v0.2.0 expanded into PR-sized tasks **T2.1–T2.11 = GitHub issues #12–#22** (v0.2.0 milestone).
- **PR #24 merged (session end, CI green pre/post-merge):** T2.1 + T2.2 — ADR-008 design tokens
  (bark/parchment/ember palette, Pixelify Sans + Nunito, 2px borders, hard offset shadows,
  `pixelated` + `dither` utilities), font links in `Base.astro`, fully tokenized landing,
  pixel favicon. Issues #12/#13 → done on the board.
- Board workflow note: GitHub CLI needed a one-time `project` scope (`gh auth refresh -s project -h github.com`)
  before `gh project …` commands worked; agent tokens must not lose this scope on rotation.
- `main` is green (CI pass on merge commit `3c2aede`).

## Review package for owner (v0.1.0) — still actionable

**What to review:**

- Summary: scaffold + docs system + CI + data pipeline for Red/Blue (151), Gold/Silver (251), Emerald (202).
- GitHub PR: https://github.com/hell-over-studios/dexforge/pull/1 (merge commit `6f373fb`).
- Data: `public/data/` (games.json, types.json, red-blue 382 kB, gold-silver 801 kB, emerald 431 kB).
- Quality: 22 vitest tests green; `pnpm data:check` green; `pnpm pre-commit` green; CI workflow green.
- Screenshots: pending — landing page now pixel-cozy themed (`pnpm dev`).

**Owner decisions requested (multiple):**

1. Approve tagging `v0.1.0` (bash block below).
2. Deploy platform for T2.11: **Cloudflare Pages vs Vercel** (docs/PROMPT.md says account is prepared).

**After approval, the owner (or next agent with approval relayed) does:**

```bash
git switch main && git pull
git tag -a v0.1.0 -m "v0.1.0 - scaffold, docs, CI, game-accurate data pipeline"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0" --notes-file <(sed -n '/## \[0.1.0\]/,$p' docs/CHANGELOG.md)
```

## What to do next (first work of next session)

Continue v0.2.0 in small PRs (issues #12–#22, board Ready/Backlog):

1. **T2.3 game selector (#14)** — next PR. Static Astro section from `games.json`, pixel-cozy cards.
2. T2.4 picker data layer (#15) → T2.5 picker UI (#16): keep `src/lib/dex.ts` separate from the React island.
3. T2.6/T2.7 detail drawer + sprite viewer; T2.8 Zustand team of 6; T2.9 URL stub; T2.10 Playwright; T2.11 deploy (blocked on owner platform choice).
4. Before each PR: `pnpm pre-commit` locally; merge only after `gh pr checks --watch` is green; after merge, watch the `main` run once.
5. Keep the board in sync: branch → In progress; PR → In review (+link PR); merge → Done.

## Commands to resume

```bash
pnpm install          # if fresh machine
pnpm data             # regenerate data (cache in scripts/.cache persists locally)
pnpm data:check       # validate
pnpm pre-commit       # lint+format+typecheck+test
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
