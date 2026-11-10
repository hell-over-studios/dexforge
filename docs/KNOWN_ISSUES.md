# Known issues · data gaps · tech debt

Last updated: 2026-11-05 (v0.1.0)

## Data

| #   | Issue                                                                                                                              | Impact                                                  | Workaround / plan                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | PokeAPI encounters lack gifts, trades, statics, events, and HMs/Badge requirements                                                 | "Where to find" incomplete for some species             | `/data/curated` merge (done for starters + classic gifts/legendaries); open curated-data issues per game                                             |
| D2  | Gen 1–2 "Special" stat was a single stat; we expose the modern split with identical values                                         | Cosmetic inaccuracy for Gen 1–2 analysis                | Accept; can split display later                                                                                                                      |
| D3  | Abilities are the modern set; some Gen 3–5 games had different abilities (e.g. before Gen 5 changes)                               | Minor inaccuracies for old games                        | Track per-game; validate against dex when adding Johto/Kanto versions with distinct ability sets                                                     |
| D4  | All 251 Johto-dex species appear for Gold/Silver although some Kanto mons aren't obtainable in-game                                | Team builder may offer unobtainable mons                | v0.2 decision: restrict picker to species with ≥1 encounter (wild+curated); curated fills the rest                                                   |
| D5  | Encounter rates are per-version and per-method only; chance values are raw encounter-slot sums                                     | Rates shown are approximations of real spawn likelihood | Fine for v0.x; document in UI ("approximate")                                                                                                        |
| D6  | Spanish names come from PokeAPI and may differ from official ES namings in old games (e.g. "Ciudad Celeste" vs newer translations) | Minor UX mismatch                                       | Abilities + obvious location mistranslations fixed via `i18n-fixes.json`; many location areas still fall back to English (open `translation` issues) |
| D7  | `mew`/`celebi` event-only availability has no levels                                                                               | Cosmetic                                                | Fine                                                                                                                                                 |

## Tech

| #   | Issue                                                                           | Impact                           | Workaround / plan                                                                       |
| --- | ------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| T1  | Playwright not yet configured (arrives with v0.2.0 UI)                          | No E2E coverage                  | Milestone v0.2.0                                                                        |
| T2  | Full data rebuild requires ~2.3k network requests (~3–6 min) when cache is cold | CI can't regenerate data cheaply | CI validates static JSON instead (`pnpm data:check`); regeneration is a maintainer task |
| T3  | `mapPolite` worker count is fixed at 8; no max-time budget                      | Slow but safe                    | Fine                                                                                    |
| T4  | i18n is client-side DOM swapping for static docs                                | OK for v0.1 landing              | Replace with route-based i18n at v1.0                                                   |
