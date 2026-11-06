# Progress

Last updated: 2026-11-05

## Current version: v0.1.0 (merged — pending owner review for release)

**Status:** milestone v0.1.0 is merged to `main` via PR #1 (CI green). **Not tagged** —
MINOR releases stop at the release boundary per docs/PROMPT.md §6: owner (Martin)
must approve the review package in docs/HANDOFF.md before `v0.1.0` is tagged and
published.

| Milestone                        | %    | Notes                                                                                                |
| -------------------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| v0.1.0 scaffold/docs/CI/pipeline | 100% | data 151/251/202 species, 22 tests green, `data:check` green, PR #1 merged; tag needs owner approval |
| v0.2.0 team builder core         | 0%   | game selector, picker, sprites, 6-slot team, Playwright, deploy config                               |
| v0.3.0 team analysis             | 0%   |                                                                                                      |
| v0.4.0 moves/offense             | 0%   |                                                                                                      |
| v0.5.0 encounters UI             | 0%   | curated-data issues #2–#4 opened for collaborators                                                   |
| v0.6.0 gym leaders               | 0%   | data-model issue #5 opened                                                                           |
| v1.0.0 share/polish              | 0%   |                                                                                                      |

## Done this session

- Full `/docs` system, AGENTS.md, community files (README ES/EN, CONTRIBUTING, CoC, MIT).
- Stack scaffold (Astro 5 + React + TS strict + Tailwind 4, pnpm, ESLint+Prettier, Vitest).
- Data pipeline `scripts/build.ts` + `scripts/lib/{process,http,games}.ts` with cache-first polite fetcher.
- **2026 PokeAPI schema adaptation** (the API changed under us mid-session — see docs/DATA_SOURCES.md):
  chart via `past_damage_relations` ("up to and including" semantics) + Gen-I patch table; typing via
  form-level `past_types`; per-version sprite groups (`gold`/`silver`, no `gold-silver` key); per-game
  dex membership (gold-silver = 251 species incl. Kanto).
- Datasets regenerated and verified: magnemite electric-only in RB, electric/steel in GS; clefable
  normal in GS; Steel resists Ghost & Dark in GS; Gen-I quirks patched (bug↔poison 2×, ghost→psychic 0…).
- Curated seeds (`/data/curated`) + SCHEMA doc; 22 vitest tests green; `data:check` green; CI green on PR.
- ES-default landing page reading `games.json` at build time.
- GitHub: labels, milestones, issue/PR templates, **collaborator issues #2–#9**.

## Next

1. Owner approves the v0.1.0 review package (docs/HANDOFF.md) → tag & release.
2. Start v0.2.0: game selector + Pokémon picker + team UI (frontend-design/taste skills; Playwright via webapp-testing skill).

## Blockers

- None technical. Awaiting owner approval for v0.1.0 tagging only.
