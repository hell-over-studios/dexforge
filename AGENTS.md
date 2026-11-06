# AGENTS.md

Short guide for AI agents and humans working in this repo.

## Start here

1. **`docs/HANDOFF.md`** — what the last session did and where it stopped.
2. **`docs/PROGRESS.md`** + **`docs/ROADMAP.md`** — what's next and why.
3. **`docs/BOARD.md`** — Kanban board, columns/fields and current issue classification.
4. **`docs/PROMPT.md`** — the product contract (never edit it; changes go in `docs/PROMPT_CHANGES.md`).
5. **`docs/AI_WORKFLOW.md`** — full agent rules: session lifecycle, autonomy boundaries, hard rules, lessons learned.
6. **`docs/DECISIONS.md`** — decided things (don't relitigate without an ADR).

## Commands

```bash
corepack|npm i -g pnpm   # once (Node >= 20, .nvmrc pins 24)
pnpm install             # deps
pnpm dev                 # astro dev server
pnpm build               # static build to dist/
pnpm data [--game id]    # regenerate /public/data from PokeAPI (cached in scripts/.cache)
pnpm data:check          # validate generated data (no network)
pnpm lint / lint:fix     # eslint
pnpm format / format:check  # prettier
pnpm typecheck           # astro sync && astro check
pnpm test / test:watch   # vitest
pnpm pre-commit          # lint + format:check + typecheck + test (run before PRs)
```

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `data:`, `chore:`, `test:`…), small & frequent.
- TypeScript strict; no `any`; no `eslint-disable` without a reason comment.
- Branches: `feat/…`, `fix/…` → PR → green CI → merge. Never push to `main` directly.
- **The deployed site must never call PokeAPI.** Data arrives via `/scripts` → static JSON in `/public/data`.Curated data lives in `/data/curated` (schema: `data/SCHEMA.md`).
- UI: Spanish default + English, mobile-first, respect `prefers-reduced-motion`, **pixel art + cozy visual direction (ADR-008)**, no ripped 3D models, no paid services.
- **PR scope (ADR-009):** one PR = one small cohesive change (≤ ~400 code lines or one screen slice).
- Update `docs/PROGRESS.md`, `docs/HANDOFF.md` and `docs/CHANGELOG.md` before ending any session.

## Autonomy (see docs/PROMPT.md §6)

- PATCH + small in-milestone features: do it yourself (branch → PR → merge).
- MINOR/MAJOR releases: **stop before tagging**, prepare review package, wait for owner approval.
- Ask first: stack changes (new ADR), paid services, deleting data, big rewrites, legally-uncertain things.
- Stuck 3 attempts → document in `docs/KNOWN_ISSUES.md`, open an issue, move on.
