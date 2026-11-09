# Dexforge — Data sources & mapping

Last updated: 2026-11-05 · v0.1.0

## PokeAPI endpoints used (build time only — never at runtime)

| Endpoint                              | Why                                                                                             | Notes                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /api/v2/generation/{id}`         | version groups, pokedexes, **type chart**                                                       | `past_damage_relations` / `damage_relations` per type inside generation data |
| `GET /api/v2/pokedex/{slug}`          | regional dex entries for a game                                                                 | first species of the union (`national` ids filled from species)              |
| `GET /api/v2/pokemon-species/{id}`    | EN/ES names, `past_types` (game-accurate types), capture rate, evolution chain, variety pointer |                                                                              |
| `GET /api/v2/pokemon/{slug}`          | stats, current types, abilities, dimensions, **sprites** (versions/other), base XP              | per-form                                                                     |
| `GET /api/v2/pokemon/{id}/encounters` | wild encounters                                                                                 | versions filtered to group members                                           |
| `GET /api/v2/location-area/{slug}`    | localized area names (EN/ES)                                                                    | also parent `location` for nicer labels                                      |
| `GET /api/v2/evolution-chain/{id}`    | flattened family for "obtained by evolving X"                                                   |                                                                              |
| `GET /api/v2/type/{slug}`             | EN/ES type names                                                                                |                                                                              |
| `GET /api/v2/ability/{slug}`          | EN/ES ability names                                                                             | deduped set per game                                                         |

Images at runtime come from `https://raw.githubusercontent.com/PokeAPI/sprites/**`
(URLs are stored at build time; no PokeAPI API calls).

Sprite priority (per prompt §2): `sprites.versions.<gen>.<version-group>` → shiny same source →
official artwork fallback → optional showdown/HOME toggles.

## Game → version-group → generation → pokedex mapping

| id            | Versions     | Generation           | Type chart source | Pokedex (slug)   | Sprite version-group |
| ------------- | ------------ | -------------------- | ----------------- | ---------------- | -------------------- |
| `red-blue`    | red, blue    | 1 (`generation-i`)   | generation-i      | `kanto`          | `gen-i/red-blue`     |
| `gold-silver` | gold, silver | 2 (`generation-ii`)  | generation-ii     | `original-johto` | `gen-ii/gold-silver` |
| `emerald`     | emerald      | 3 (`generation-iii`) | generation-iii    | `hoenn`          | `gen-iii/emerald`    |

Rules baked into `scripts/lib/games.ts`:

- New games append there only; the pipeline derives everything else.
- A game id is a _version group_ (Red and Blue share dex/chart), version exclusives come from encounter `version` details.
  Explicitly a whole region's dex, not the "modernized" `national` dex.
- A game id is a _version group_ (Red and Blue share dex/chart); version exclusives come from per-`version` encounter details.
- Separate version groups stay separate: `emerald` (not ruby-sapphire), `crystal` (not gold-silver), because their dexes/encounters differ.

## Game-accuracy rules (see ADR-003)

1. Types: `past_types` entries apply to their _exact_ generation (PokeAPI convention: an entry exists only where typing differed). Use the entry matching the game's generation; otherwise the form's current types (correctly returns Steel to Magnemite in Gen 2+ and Fairy to Clefairy only from Gen 6).
2. Type chart: from the game's generation object, using `past_damage_relations` (listeners: chart constants apply from that generation onwards until replaced, so pick the newest entry with generation ≤ game gen; fallback current `damage_relations`).
3. Abilities: absent in Gen 1–2 → empty array.
4. Stats: PokeAPI exposes the modern 6-stat split. For Gen 1–2 the single "Special" stat was duplicated into `specialAttack`/`specialDefense` with the same value — known approximation, documented in KNOWN_ISSUES.
5. Evolution: "obtained by evolving X" is resolved from the flattened family chain, only when the pre-evolution is obtainable in that game (curated data decides obtainability of the pre-evolution).

## Known PokeAPI gaps

- Encounters: only wild data. Missing: starter gifts, trades, static encounters, events → `/data/curated`.
- Encounter `location_area.name` values are slugs not localized; we fetch `location-area/{slug}` for EN/ES names.
- Official games have "available in this game" semantics that PokeAPI does not enforce — quality of listing equals pokedex quality (kept per-game, filters nothing automatically).
- Encounter `location_area.name` values are slugs, not localized; we fetch `location-area/{slug}` for EN/ES names.
- Some dexes include entries with `past` numbers missing; build logs any mismatch (`species listed in dex but no pokemon form` etc.) — resolve per case, never invent redirects here.
- `past_types` has gaps for some older forms (rare, mostly cosmetic regional forms not in old dexes).

## Localization (ES)

- Standard: **European Spanish (`es`)** is the canonical ES locale, matching the official
  es-ES game releases. `es-419` (Latin American) strings are only used as a fallback when an
  `es` entry is missing in PokeAPI (see `getName`/`localName` in `scripts/lib/process.ts`).
- Species and type names come straight from PokeAPI's `es` entries (they match the official
  es-ES names for Gen 1–3).
- Ability names are now fetched from `ability/{slug}` and localized through the same path;
  previously the pipeline stored the English slug for both locales.
- Location-area names are the weak spot: PokeAPI ships no Spanish for most of them, so the
  pipeline falls back to the English name. Obvious/wrong translations are corrected in
  `/data/curated/i18n-fixes.json` (keyed by location-area slug) and applied at build time.
  Further translations are welcome via PRs editing that file.
- Game-quirk differences (e.g. old-game wording) stay in the curated encounter locations,
  not in the global override file.

## Curated data

- Location: `/data/curated/<game-id>.json` — schema & rules in `/data/SCHEMA.md`; validated by the pipeline + tests; evolves via PR (community-friendly).
- Missing availability info (gifts, trades, statics) is never invented — curated entries must reference species already present in the game's dex.
