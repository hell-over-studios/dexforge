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

- [ ] Game selector (per supported game, version-group aware)
- [ ] Pokémon picker (search + list of the selected game's dex)
- [ ] Pokémon detail drawer: stats, types, abilities, sprites
- [ ] Sprite viewer: game sprite / shiny / animated / artwork / HOME + fallbacks
- [ ] Team of 6 with add/remove/replace
- [ ] Zustand store + URL state sketch
- [ ] Playwright smoke tests (key flows)
- [ ] Deploy config (Cloudflare Pages / Vercel)

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
