# Contributing to Dexforge

Fan-made, open source — welcome! Reading `docs/ROADMAP.md` and `docs/PROMPT.md` gives
you the full picture in two files; this guide is the practical version.

## Good first contributions

- **Curate encounter data** (`data/curated`) — starter gifts, trades, statics per game.
  See `data/SCHEMA.md` and the `curated-data` + `good first issue` labels.
- **Gym leader / Elite Four data** per game (model lands in v0.6.0).
- **Spanish name fixes / translations** (`translation` label).
- **Accessibility audits**, themes, docs (`accessibility`, `design`, `docs` labels).

## Workflow

1. Fork or branch from `main` (`feat/…`, `fix/…`, `data/…`).
2. Make changes; run `pnpm pre-commit` (lint, format, typecheck, tests).
3. For curated data: cite your source in the PR (in-game checks > wikis).
4. Open a PR using the template; keep it small; CI must be green.

## Local setup

```bash
pnpm install
pnpm data        # build /public/data from PokeAPI (cached, polite)
pnpm dev         # start the app
```

## Rules

- No ripped 3D models or official assets beyond the sprites PokeAPI publishes.
- No secrets in commits; no runtime calls to PokeAPI from the deployed site.
- Conventional Commits; TypeScript strict; docs stay in sync with code.
- Be kind: see CODE_OF_CONDUCT.md.
