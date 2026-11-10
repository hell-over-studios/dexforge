# Progress

Last updated: 2026-11-10

## Current version: v0.3.0 code-complete (v0.1.0 / v0.2.0 / v0.3.0 tags all pending owner approval)

**Status:** all v0.3.0 tasks (T3.1–T3.4) are merged to `main` (PRs #47–#50), CI + Pages Deploy
green; the site includes the full analysis stack. **No MINOR release is tagged** — `v0.1.0`,
`v0.2.0` and now `v0.3.0` stop at the release boundary per docs/PROMPT.md §6: owner (Martin)
must approve the review packages in docs/HANDOFF.md.

| Milestone                        | %    | Notes                                                                                                                                                |
| -------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1.0 scaffold/docs/CI/pipeline | 100% | data 151/251/202 species, 22 tests green, `data:check` green, PR #1 merged; tag needs owner approval                                                 |
| v0.2.0 team builder core         | 100% | **code-complete** (PRs #24–#37): picker, drawer, sprites, team-of-6, share-URL, e2e, live on Pages — **tag needs owner approval (MINOR)**            |
| v0.3.0 team analysis             | 100% | **code-complete** (PRs #47–#50 + #39/#46 fixes): analysis layer, defensive table, radar+roles, suggestions v1 — **tag needs owner approval (MINOR)** |
| v0.4.0 moves/offense             | 0%   | next — triage into PR-sized issues                                                                                                                   |
| v0.5.0 encounters UI             | 0%   | curated-data issues #2–#4 opened for collaborators                                                                                                   |
| v0.6.0 gym leaders               | 0%   | data-model issue #5 opened                                                                                                                           |
| v1.0.0 share/polish              | 0%   |                                                                                                                                                      |

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
- **GitHub Projects v2 Kanban board** (ADR-010, `docs/BOARD.md`): six Status columns
  (Backlog → Done), Priority/Area/Size fields, and all issues #2–#22 classified.
- **Owner directive (2026-11-06) — pixel art + cozy + smaller PRs** (recorded in `docs/PROMPT_CHANGES.md`
  as ADR-008/ADR-009, PR #10): v0.2.0 expanded into PR-sized tasks T2.1–T2.11 (issues #12–#22).

## Done this session (2026-11-08 → 10 — v0.3.0 complete)

- **Carried from the previous stretch (both owner directives from 2026-11-07):**
  - **PR #40 (issue #39):** species visuals = official artwork ONLY (`sprites.official`
    resolver; no modern static renderers) across drawer/picker.
  - **PR #46 (issue #45):** detail drawer expands **in place** under the selected picker
    row (keyboard-anchored past 60 entries, top-block fallback, layout not destroyed by
    scroll; gate respects `prefers-reduced-motion`).
- **PR #47 (T3.1, #41):** `src/lib/analysis.ts` — pure team-analysis layer over each game's
  own `typeChart` (Gen-I quirks for Red/Blue; Steel/Dark added in Gold/Silver+). Disproved a
  stale handoff claim: the `buildTypeChart` pipeline was ALREADY game-accurate (steel immune
  to poison since Gen 2; RB fire→ghost = 1), so zero pipeline changes; proof from the cache
  documented in an issue #41 comment. 11 tests.
- **PR #48 (T3.2, #42):** `DefenseCharts` island + `loadTypeMeta()` in `dex.ts` — mobile
  stacked per-member cards (<md) / desktop attacker × member matrix (≥md), value-coded chips
  (ember ×2/×4, moss resist, dusk ×0/×1) with per-type colored dots, ES/EN aria labels, cozy
  empty state. Values spot-checked vs real charts (Skarmory Gen 3: fire ×2, electric ×2 via
  flying, ground/poison ×0, bug ×¼).
- **PR #49 (T3.3, #43):** `src/lib/roles.ts` + `TeamProfile` island — hand-rolled static SVG
  radar of team average stats (ADR-005: no chart libraries) + documented v1 role heuristic
  per member (sweeper / special-sweeper / wall / tank / support; "other armor ≥55 OR hp ≥90"
  wall rule so Blissey 10/135/255 counts as wall).
- **PR #50 (T3.4, #44):** `src/lib/summary.ts` `summarizeDefenses` suggestions v1 — shared
  weaknesses (≥2 members at ×2+), member immunities, team-wide resists (everybody ≤×½;
  neutral-everywhere deliberately NOT a note) rendered as cozy "Notas" lines (⚠/⬡/▐) inside
  DefenseCharts (no extra data loads). Gen-I fixture: Gengar/Golbat share psychic weakness,
  keep normal immunity, and get NO fighting immunity (repo's GEN1_PATCHES: fighting→ghost
  0.5 in Gen I, 0 from Gen II).
- **PR #52 (docs, self-initiated):** prettier formatting of `docs/KNOWN_ISSUES.md` — it
  landed UNFORMATTED via #51 (owner's own ES-name i18n fix, merged from another workspace
  with its own CHANGELOG entry) and broke `main` CI at Format check; `main` CI + Deploy
  green again after merge.
- Suite after the session: **82 unit tests in 8 files** + 2 Playwright e2e, all green.
- Board #39 / #41–#45 all Done; CHANGELOG [Unreleased] carries artwork/drawer/i18n/analysis
  entries; v0.3.0 milestone closed.

## Done this session (2026-11-07 — session 4: T2.6–T2.10, v0.2.0 finished)

- **PR #33 (T2.6, #17):** Pokémon detail drawer — canonical type badges colored from `/data/types.json`
  (`loadTypeColors`), 6 quantized pixel stat bars, abilities (incl. hidden), dex/height/weight; replaces the
  T2.5 summary panel. Verified in-browser at 360 px.
- **PR #34 (T2.7, #18):** sprite viewer — `src/lib/sprites.ts` formalizes fallback chains
  (game→artwork→home; shiny→game→artwork; animated→game→artwork; artwork→home→game), pixel-kinds render
  `pixelated`, unavailable toggles marked, localized alt text names species + shown kind, `aria-live`
  fallback note; 13 new tests incl. real-JSON invariants (48 tests).
- **PR #35 (T2.8, #19):** team of 6 — pure `toggleMember` (toggle off / append / full→replace oldest) +
  zustand `persist` store (`dexforge-team`, per game); pixel slot frames (pure-CSS empty art), accessible
  slot-remove buttons, drawer team button with `aria-live` result note. 11 tests (59 total).
- **PR #36 (T2.9, #20):** share-by-URL stub — `?t=v1.<game>.<idBase36…>` encode/decode in `src/lib/share.ts`
  (strict decode, sanitized both ways), copy-link button + pixel toast (reduced-motion frozen by global
  CSS), `?t=` seeds the team for the current game. 10 tests (69 total).
- **PR #37 (T2.10, #21):** real Playwright in-repo (`playwright.config.ts`, chromium desktop + Pixel 5
  projects) + `E2E · Chromium` CI job + first full-loop smoke (home → pick Emerald → add 6 → share URL →
  fresh context restores → reload restores). 69 unit tests + 2 e2e green.
- All of #17–#21 closed & Done on the board within their PR cycle; `main` CI + Deploy green after every merge.

## Done this session (2026-11-06)

- PR #10: docs — design direction (ADR-008) + task granularity (ADR-009); PR #11: prettier fix (kept `main` green).
- **PR #24 (merged, CI green pre- and post-merge):** pixel art + cozy foundation —
  design tokens in `src/styles/global.css` (bark/parchment/ember palette, Pixelify Sans + Nunito,
  2px borders, hard offset shadows, `pixelated` + `dither` utilities, focus ring), font links in
  `Base.astro`, landing page fully tokenized, pixel pokéball favicon. 4 files, +142/−58.
- **PR #27:** T2.3 game selector — static `GameSelector` cards from `games.json`, `/juego/<id>` stub pages, ES/EN labels via `data-i18n-pair`.
- **PR #28:** T2.4 picker data layer — `src/lib/dex.ts` (index normalization + accent-insensitive ES/EN/slug/id search), 13 new unit tests (35 total).
- **PR #29:** T2.5 picker React island — ARIA combobox/listbox, full keyboard nav with auto-pagination (60/page), pixel-crisp sprite avatars, ES/EN in-island copy, selected-summary panel (pre-T2.6). Verified in headless Chromium against `pnpm preview`.
- Board workflow: #12/#13/#14/#15/#16 → Done (issues closed; `gh project` needs the `project` scope — granted today via device flow).
- **T2.11 deploy landed (PR #31, ADR-011): owner picked GitHub Pages. Site is LIVE at
  https://hell-over-studios.github.io/dexforge/ and verified in a real browser (picker + search work live).**
  Issues #22/#17→Next; board #22 → Done.
- Lessons learned appended (never merge before CI green; gh CLI quoting/scope pitfalls).

## Next

1. Owner approvals pending: **tag `v0.1.0`, `v0.2.0` and `v0.3.0`** (review packages + the
   PowerShell recipe in docs/HANDOFF.md).
2. Then v0.4.0 "Moves & offensive coverage": pull the milestone from GitHub and triage into
   PR-sized issues in the T3.x style (each = one issue + one small PR, board-linked).
3. Keep the board in sync when ROADMAP tasks or milestones change (`docs/BOARD.md`).

## Blockers

- Only the pending owner approvals: release tags v0.1.0, v0.2.0 and v0.3.0 (all MINOR).
