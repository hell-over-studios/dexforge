# Progress

Last updated: 2026-11-05

## Current version: v0.1.0 (pending owner review for release)

**In flight:** finalizing v0.1.0 (scaffold + docs + CI + data pipeline). Not yet tagged —
MINOR releases require owner approval (docs/PROMPT.md §6).

| Milestone                        | %   | Notes                                                                                                     |
| -------------------------------- | --- | --------------------------------------------------------------------------------------------------------- |
| v0.1.0 scaffold/docs/CI/pipeline | 95% | data for Red/Blue + Gold/Silver + Emerald generated, tests green, docs done; release needs owner approval |
| v0.2.0 team builder core         | 0%  | game selector, picker, sprites, 6-slot team, Playwright, deploy config                                    |
| v0.3.0 team analysis             | 0%  |                                                                                                           |
| v0.4.0 moves/offense             | 0%  |                                                                                                           |
| v0.5.0 encounters UI             | 0%  |                                                                                                           |
| v0.6.0 gym leaders               | 0%  |                                                                                                           |
| v1.0.0 share/polish              | 0%  |                                                                                                           |

## Done this session

- Full `/docs` system, AGENTS.md, community files (README ES/EN, CONTRIBUTING, CoC, MIT).
- Stack scaffold (Astro 5 + React + TS strict + Tailwind 4, pnpm, ESLint+Prettier, Vitest).
- Data pipeline `scripts/build.ts` with cache-first polite fetcher, per-game datasets in `/public/data`.
- Game-accurate type charts + `past_types` typing with unit tests (Gen 1 no Steel/Dark/Fairy, Gen 2–5 Steel resists Ghost/Dark, Magnemite electric-only in Gen 1).
- Wild encounters flattened per (area, version, method), localized ES/EN area names.
- Curated data system (`/data/curated`) with starter/gift/static seeds and validation.
- Minimal ES-default landing page reading `games.json` at build time.
- GitHub: labels, milestones, issue templates, PR template, collaborator issues.

## Next

1. Get v0.1.0 review package approved → tag release.
2. Start v0.2.0: game selector + Pokémon picker + team UI (use frontend-design/taste skills; Playwright via webapp-testing skill).

## Blockers

- None. Awaiting owner approval for v0.1.0 tagging only.
