# Dexforge — Roadmap

Versioning follows [SemVer](https://semver.org/). MINOR/MAJOR releases require owner
review before tagging (see docs/PROMPT.md §6). This file is the single source of truth
for what must exist in each version; GitHub issues reference it.

## Legend

- [x] done · [~] in progress · [ ] todo
- ✎ = good first-issue friendly (see GitHub labels `good-first-issue`, `curated-data`)

## v0.1.0 — Scaffold & data pipeline

- [x] Repo scaffold (Astro + React + TS strict + Tailwind, pnpm)
- [x] Full `/docs` system + AGENTS.md + community files
- [x] CI (lint, typecheck, test, build) via GitHub Actions
- [x] Data pipeline `/scripts` (PokeAPI → static JSON in `/public/data`, cached, polite)
- [x] Game-accurate type charts from `past_damage_relations`
- [x] Games: Red/Blue, Gold/Silver, Emerald
- [x] Curated data schema + `/data/curated` seed
- [~] Minimal landing page (ES default) — placeholder until v0.2 game selector
- [~] GitHub labels, milestones, issue templates, first collaborator issues

## v0.2.0 — Team builder core

> Broken into PR-sized task units per ADR-009 (each bullet = one branch + one small PR;
> each has a matching GitHub issue with acceptance criteria).

- [ ] **T2.1** Design tokens & pixel-cozy foundation — Pixelify Sans + Nunito fonts, warm palette, 2px borders, hard shadows, `image-rendering: pixelated` util, dither pattern (ADR-008 tokens land in `src/styles/global.css`)
- [ ] **T2.2** App shell & layout — Astro layout with pixel header/footer, game-scoped nav slots, skip-link, tokenized landing page refresh
- [ ] **T2.3** Game selector — ES-default, three game cards from `games.json` (count, region, version-group), desktop/mobile layouts
- [ ] **T2.4** Pokémon picker (data layer) — client-side index over `<game>.json` filtered to species (slug, name ES/EN, dexNumber, types, sprite url) + search box behavior spec
- [ ] **T2.5** Pokémon picker UI — React island: searchable list with pixel avatars, keyboard nav, empty/loading states
- [ ] **T2.6** Pokémon detail drawer — stats bar, types, abilities, dex info; pixel-cozy panel
- [ ] **T2.7** Sprite viewer — toggles game sprite / shiny / animated (showdown) / official / HOME with documented fallback chain; `pixelated` only for game sprite & showdown
- [ ] **T2.8** Team of 6 — Zustand store, add/remove/replace, pixel slot frames
- [ ] **T2.9** URL state stub — encode game + team into `?t=…` (round-trip test)
- [ ] **T2.10** Playwright setup + smoke tests — config, first e2e (select game, add 6 Pokémon), CI job
- [ ] **T2.11** Deploy config — Cloudflare Pages or Vercel (⛔ ask owner for platform + account before starting)

## v0.3.0 — Team analysis

- [ ] Defensive table (18 types × weak/resist/immune, game-accurate chart)
- [ ] Stat radar chart (lightweight SVG, no heavy chart lib)
- [ ] Team average stats + role detection (fast / tank / physical / special)
- [ ] Suggestions engine (v1: coverage & weakness heuristics)

## v0.4.0 — Moves, abilities, offensive coverage

- [ ] Moves data per game (version-group filtered)
- [ ] Move picker per Pokémon
- [ ] Offensive coverage matrix + "types the team can't hit super effectively"
- [ ] Abilities detail view

## v0.5.0 — Encounters & curated data

- [ ] Where-to-find UX (route, method, level, rate, exclusives, HM/badge requirements)
- [ ] Curated data UI ("obtained by evolving X", gifts, trades, statics)
- [ ] ✎ Curation issues per game (community driven)

## v0.6.0 — Gym leaders / Elite Four

- [ ] Leader/E4 data model + per-game data files
- [ ] Matchup view: how the team fares vs each leader
- [ ] ✎ Leader data per game (community driven)

## v1.0.0 — Sharing & polish

- [ ] Share team by URL (state fully encoded)
- [ ] localStorage saved teams
- [ ] Pokémon Showdown import/export
- [ ] ES/EN UI languages (ES default)
- [ ] Accessibility pass, reduced motion, keyboard flows
- [ ] Polish, screenshots, landing refresh

## v1.1.0+ — Expansion

- [ ] More games (Ruby/Sapphire, Crystal, Yellow, FRLG, HGSS, Platinum, B2W2, X/Y, Sw/Sh…)
- [ ] Nuzlocke mode
- [ ] 3D viewer exploration (user-provided assets, no ripped models)
- [ ] More themes

## Out of scope (legal)

- Ripped 3D models from official games
- Any paid service / account system
