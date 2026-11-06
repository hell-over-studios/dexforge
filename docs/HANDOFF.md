# Handoff — where the last session stopped

Last updated: 2026-11-05 (session 1: v0.1.0 build, merged)

## Exactly where we stopped

- Milestone v0.1.0 is **complete and merged to `main`** via PR #1 (`feat/v0.1.0-scaffold`, CI green).
- **v0.1.0 is NOT tagged / released.** Per docs/PROMPT.md §6, MINOR releases stop at the release
  boundary: owner (Martin) must review the package below and give explicit approval.
- Collaborator issues #2–#9 opened (curated data per game, leader-data model, translations,
  a11y audit, design pass, docs).

## Review package for owner (v0.1.0) — actionable

**What to review:**
- Summary: scaffold + docs system + CI + data pipeline for Red/Blue (151), Gold/Silver (251), Emerald (202).
- GitHub PR: https://github.com/hell-over-studios/dexforge/pull/1 (merge commit `6f373fb`).
- Data: `public/data/` (games.json, types.json, red-blue 382 kB, gold-silver 801 kB, emerald 431 kB).
- Quality: 22 vitest tests green; `pnpm data:check` green; `pnpm pre-commit` green; CI workflow green.
- Screenshots: pending — no app UI yet beyond the ES-default landing page (`pnpm dev`).

**Proposed changelog** (ready): docs/CHANGELOG.md §[0.1.0].

**After approval, the owner (or next agent with approval relayed) does:**

```bash
git switch main && git pull
git tag -a v0.1.0 -m "v0.1.0 - scaffold, docs, CI, game-accurate data pipeline"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0" --notes-file <(sed -n '/## \[0.1.0\]/,$p' docs/CHANGELOG.md)
```

## What to do next (first work session after release)

Start **v0.2.0** (docs/ROADMAP.md): game selector + Pokémon picker + team of 6.

1. Read docs/AI_WORKFLOW.md and docs/ROADMAP.md.
2. Use the `frontend-design` / `taste-skill` / `apple-design` / `impeccable` skills for the real UI;
   `webapp-testing` skill for Playwright setup + smoke tests.
3. Build: game selector (3 games), picker with sprites, 6-slot team state (Zustand), URL state stub.
4. Deploy config (Cloudflare Pages or Vercel — ask owner which; docs/PROMPT.md says account is prepared).
5. Keep issues #7 (design) and #9 (docs/schema findings for next games) in sync.

## Commands to resume

```bash
pnpm install          # if fresh machine
pnpm data             # regenerate data (cache in scripts/.cache persists locally)
pnpm data:check       # validate
pnpm pre-commit       # lint+format+typecheck+test
pnpm build && pnpm preview
pnpm dev              # landing page
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
  - `generation/{n}.types` lists ONLY types *added* in that generation; `type/{id}.generation` marks
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
