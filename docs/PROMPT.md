# PROMPT ORIGINALE / ORIGINAL PROMPT

> Verbatim original prompt that created this project. DO NOT EDIT.
> If requirements change, add `docs/PROMPT_CHANGES.md` instead.

---

You are the lead autonomous engineer of an open-source project called "Dexforge".
Work independently. Only stop to ask me for review at the checkpoints defined below.

# 1. PRODUCT

Dexforge is a fan-made web app where the user picks a main-series Pokémon game
(e.g. Red/Blue, Gold/Silver, Emerald, Black/White, X/Y, Sword/Shield, Scarlet/Violet...)
and builds a team of up to 6 Pokémon available in THAT game. The app shows:

- Per-Pokémon: stats, types, abilities, and sprites/models of that Pokémon.
- Team analysis: defensive table (18 types: weak / resist / immune counts, with
  game-accurate type chart: no Dark/Steel in Gen 1, no Fairy before Gen 6, Steel
  resisting Ghost/Dark in Gen 2-5, etc. Use PokeAPI `past_damage_relations`).
- Offensive coverage based on chosen moves, and types the team can't hit super effectively.
- Stat radar chart, team average, and role detection (fast, tank, physical/special attacker).
- Suggestions ("your team lacks Rock coverage", "4/6 are weak to Ice").
- WHERE TO FIND each Pokémon in the selected game (route, method, level, rate,
  version exclusives, required HM/badges). PokeAPI encounter data is incomplete for
  gifts, trades, static encounters and evolutions: complement with a hand-curated
  JSON in /data/curated and show "obtained by evolving X" when appropriate.
- Gym leader / Elite Four matchup view: how the team fares vs each leader.
- Share team via URL (state in the URL, no accounts), save several teams in
  localStorage, import/export Pokémon Showdown format.
- UI languages: Spanish (default) and English.

# 2. VISUALS (important)

When a Pokémon is selected, display its visuals prominently:

- Default: the sprite from the SELECTED GAME (`sprites.versions.<generation>.<version>`),
  falling back to official-artwork if missing.
- Toggle between: game sprite, shiny, animated (`sprites.other.showdown`),
  official artwork, and Pokémon HOME render.
- Do NOT use ripped 3D models from the games (copyright). 3D is a future optional feature.
- Smooth, polished transitions (use the apple-design, animate and frontend-design skills).
- Fully responsive (mobile first) and accessible (keyboard, contrast, reduced motion).

# 3. STACK (do not change without writing an ADR in /docs/DECISIONS.md)

- Astro + React islands, TypeScript (strict), Tailwind CSS.
- State: Zustand or nanostores. Charts: Recharts or a lightweight SVG radar.
- Data: a Node/TS script in /scripts that downloads from https://pokeapi.co/docs/v2,
  processes it and emits static JSON in /public/data (per game). The deployed site
  must NEVER call PokeAPI at runtime. Cache raw responses locally in /scripts/.cache
  (gitignored) and be polite with rate limits.
- Tests: Vitest (unit, especially type chart and team analysis logic), Playwright (key flows).
- Lint/format: ESLint + Prettier. CI: GitHub Actions (lint, typecheck, test, build).
- Deploy target: Cloudflare Pages or Vercel (config included, I connect the account).
- Package manager: pnpm.

# 4. SKILLS

Check my installed skills and use them when relevant: frontend-design, impeccable,
taste-skill, apple-design, animate, webapp-testing. Avoid generic "AI template" looks.

# 5. THE /docs FOLDER (mandatory, keep it updated at EVERY work session)

Create and maintain:

- docs/PROMPT.md -> this exact original prompt, verbatim, never edited
  (if requirements change, add docs/PROMPT_CHANGES.md)
- docs/PROGRESS.md -> current version, what's done, in progress, next, blockers,
  with % per milestone and date of last update
- docs/ROADMAP.md -> milestones mapped to versions
- docs/ARCHITECTURE.md -> folder structure, data flow, JSON schemas, diagrams (mermaid)
- docs/DECISIONS.md -> ADR-style log: decision, alternatives, reason, date
- docs/DATA_SOURCES.md -> PokeAPI endpoints used, known gaps, curated data rules,
  game -> version-group -> generation -> pokedex mapping
- docs/KNOWN_ISSUES.md -> bugs, data gaps, tech debt
- docs/AI_WORKFLOW.md -> how AI agents must work in this repo (rules below),
  lessons learned, mistakes to avoid, useful prompts
- docs/HANDOFF.md -> rewritten at the END of each session: exactly where you
  stopped, what to do next, commands to resume. A fresh
  agent with zero memory must be able to continue from it.
- docs/CHANGELOG.md -> Keep a Changelog format
  Also create at the repo root: AGENTS.md (short; points to /docs, lists commands,
  conventions and the autonomy rules below), README.md (bilingual ES/EN, screenshots
  later), CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE (MIT), DISCLAIMER section in README:
  "Fan-made, not affiliated with Nintendo, Game Freak or The Pokémon Company.
  Pokémon and all related names/images are their property."

# 6. AUTONOMY AND REVIEW RULES

Versioning follows SemVer.

- PATCH (x.y.Z) and small features inside the current milestone: do them yourself.
  Work on a branch, open a PR with `gh`, make sure CI passes, and merge it yourself.
  No need to ask me.
- MINOR (x.Y.0) and MAJOR (X.0.0) releases (e.g. 1.0.0 -> 1.1.0): STOP before
  releasing. Prepare a review package: summary of changes, screenshots, test results,
  updated docs, and a proposed changelog. Wait for my explicit approval, then tag
  and publish the release.
- Also ask me before: changing the stack, adding paid services, deleting data,
  rewriting large parts of the architecture, or anything legally uncertain.
- Commits: Conventional Commits. Small, frequent commits. Never commit secrets.
- Before any session ends: run lint, typecheck and tests, update docs/PROGRESS.md,
  docs/HANDOFF.md and the changelog.
- If stuck on the same problem after 3 attempts, document it in KNOWN_ISSUES.md,
  open an issue, and move to the next task instead of looping.

# 7. GITHUB ISSUES FOR COLLABORATORS

Use the `gh` CLI. Create labels: good first issue, help wanted, bug, enhancement,
data, curated-data, translation, design, docs, accessibility, game:<name>.
Create the milestones and open well-written issues (context, acceptance criteria,
files to touch, hints) for tasks that people can take, e.g.:

- Curate encounter data for each game (one issue per game, tagged curated-data + good first issue)
- Add gym leader data per game
- Translations and Spanish name fixes
- Accessibility audits, new themes, Nuzlocke mode, 3D viewer exploration
  Also add issue templates (bug, feature, data correction) and a PR template.
  Keep issues in sync with docs/ROADMAP.md.

# 8. MILESTONES

v0.1.0 Repo scaffold, docs, CI, data pipeline for 2-3 games (Red/Blue, Gold/Silver, Emerald)
v0.2.0 Game selector, Pokémon picker with game sprites, team of 6
v0.3.0 Stats, radar chart, defensive type analysis (game-accurate)
v0.4.0 Moves, abilities and offensive coverage per game
v0.5.0 Encounter locations + curated data
v0.6.0 Gym leaders / Elite Four matchups
v1.0.0 Share by URL, Showdown import/export, localStorage teams, ES/EN, polish
v1.1.0+ More games, Nuzlocke mode, etc.

# 9. START NOW

1. Read this prompt fully. Do not ask questions unless truly blocked.
2. Initialize the repo and git, create docs/PROMPT.md with this prompt verbatim.
3. Create all docs files and AGENTS.md.
4. Build milestone v0.1.0 autonomously, then continue through v0.x patch-level work.
5. Stop and request review at the first MINOR release boundary, as defined above.
