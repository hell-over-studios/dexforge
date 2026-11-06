# Handoff — where the last session stopped

Last updated: 2026-11-05 (session 1: v0.1.0 build)

## Exactly where we stopped

- v0.1.0 milestone is **complete on the working tree and merged via PR** (branch `feat/v0.1.0-scaffold`).
- **v0.1.0 is NOT tagged / released yet.** Per docs/PROMPT.md §6, MINOR releases (`0.1.0` is one) stop at the release boundary:
  owner (Martin) must review the package below and give explicit approval.
  After approval: tag `v0.1.0`, create the GitHub release from `docs/CHANGELOG.md` section.

## Review package for owner (v0.1.0)

- Summary: scaffold + docs system + CI + data pipeline for Red/Blue, Gold/Silver, Emerald.
- Test results: 14 unit tests green, `data:check` validation green, CI workflow green on PR.
- Data: `public/data/` (games.json, types.json, red-blue.json, gold-silver.json, emerald.json).
- Docs: full set under `/docs` (start at PROGRESS.md).
- Screenshots: pending (app UI arrives in v0.2.0; no visual surface to capture yet beyond the landing page).

## What to do next (after approval)

1. Tag & release v0.1.0: `git tag -a v0.1.0 -m "v0.1.0 …"; git push origin v0.1.0` and create the release with the changelog text.
2. Start v0.2.0 (see docs/ROADMAP.md): game selector + Pokémon picker + team of 6.
   - Read docs/AI_WORKFLOW.md first. Use the `frontend-design`/`taste-skill`/`apple-design` skills for the real UI.
   - Write `src/lib/pokemon/` logic won't exist yet; UI first, analysis in v0.3.
   - Playwright setup + smoke tests (webapp-testing skill); deploy config for Cloudflare Pages.
3. Keep GitHub issues in sync with ROADMAP as things land.

## Commands to resume

```bash
pnpm install          # if fresh machine
pnpm data             # regenerate data (cache in scripts/.cache persists locally)
pnpm data:check       # validate
pnpm pre-commit       # lint+fmt+typecheck+test
pnpm build && pnpm preview
```

## State facts (so a fresh agent doesn't re-discover)

- pnpm 12.16.1 installed via `npm i -g pnpm` (corepack enable failed without admin).
- pnpm 11+ renamed `onlyBuiltDependencies` to `allowBuilds` in `pnpm-workspace.yaml` (esbuild + sharp approved there).
- `astro check` is the typecheck; `pnpm typecheck` runs `astro sync && astro check`.
- Data cache hot: scripts/.cache has generation, type, pokedex, species, forms, encounters, locations, evo-chains for Kanto/Johto/Hoenn (~2.3k entries, ~7 MB gz).
- The landing page reads `public/data/games.json` at build time via fs.
- Typechart logic detail: `past_damage_relations` (charts) = apply-from-entry-until-replaced → choose newest entry ≤ game gen; `past_types` (per-species) = exact generation match, else current types (this is what keeps Magnemite electric-only in Red/Blue but electric/steel in Gold/Silver, and Clefairy Normal in Gen 1 / Fairy in Gen 6+).
