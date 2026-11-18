# Dexforge — Data sources & mapping

Last updated: 2026-11-17 (v0.4.0 moves pipeline)

## PokeAPI endpoints used (build time only — never at runtime)

| Endpoint                              | Why                                                                                   | Notes                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `GET /api/v2/pokedex/{slug}`          | regional dex entries for a game                                                       | membership also defines the fetched species set      |
| `GET /api/v2/pokemon-species/{id}`    | EN/ES names, generation, capture rate, evolution chain, default variety pointer       | species-level only; typing history moved to the form |
| `GET /api/v2/pokemon/{slug}`          | stats, current types, abilities, dimensions, **sprites**, **full learnset** (`moves`) | per-form; learnsets come free with this payload      |
| `GET /api/v2/pokemon/{id}/encounters` | wild encounters                                                                       | versions filtered to group members                   |
| `GET /api/v2/move/{slug}`             | move type/class/power/accuracy/PP, generation, EN/ES names, `past_values`             | union of moves learnable in the selected games       |
| `GET /api/v2/location-area/{slug}`    | localized area names (EN/ES)                                                          | also parent `location` for nicer labels              |
| `GET /api/v2/evolution-chain/{id}`    | flattened family for "obtained by evolving X"                                         |                                                      |
| `GET /api/v2/type/{slug}`             | EN/ES type names + game-accurate chart (`past_damage_relations`)                      |                                                      |
| `GET /api/v2/ability/{slug}`          | EN/ES ability names                                                                   | deduped set per game                                 |

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
6. Moves: `pokemon/{form}.moves` already carries every version group; the pipeline keeps only the game's group, one row per move (priority level-up > machine > tutor > egg, lowest level on ties) and drops learn methods we do not model (`light-ball-egg`, `colosseum-purification`…). The union of move slugs is fetched once and each dataset keeps only the moves it references.
7. Move stats: PokeAPI's `past_values` entries are **per-field change records** (an entry holds the value in effect _before_ its version group and only the fields that changed there). For each field pick the oldest entry whose generation is still greater than the game's, then fall back to the current value. This keeps Gen-I Bite Normal, Thunder/Fire Blast/Blizzard at 120 power, Blizzard at 90 accuracy and Gen-III Crunch special. Damage class follows the type in Gen 1–3 (the per-move split starts in Gen 4); Gen II–IV `???` moves (Curse) carry `type: "unknown"`.
8. Form per game: when a species' default form has no rows for the game's version group, the pipeline uses the variety that does and takes its stats/sprites too — Deoxys is Speed form in Emerald, the only such case in the launch games.

## Known PokeAPI gaps

- Encounters: only wild data. Missing: starter gifts, trades, static encounters, events → `/data/curated`.
- Encounter `location_area.name` values are slugs not localized; we fetch `location-area/{slug}` for EN/ES names.
- Official games have "available in this game" semantics that PokeAPI does not enforce — quality of listing equals pokedex quality (kept per-game, filters nothing automatically).
- Encounter `location_area.name` values are slugs, not localized; we fetch `location-area/{slug}` for EN/ES names.
- Some dexes include entries with `past` numbers missing; build logs any mismatch (`species listed in dex but no pokemon form` etc.) — resolve per case, never invent redirects here.
- `past_types` has gaps for some older forms (rare, mostly cosmetic regional forms not in old dexes).
- Gen-I HM compatibility is incomplete in the `red-blue` group: a few rows only exist under `yellow` (Charizard + Fly, Butterfree/Venonat/Venomoth + Flash, Diglett/Dugtrio/Kabutops + Cut). `red-blue` unions machine rows from `yellow` as a same-generation fallback (`machineFallbackGroups` in `scripts/lib/games.ts`); level-up rows stay version-group exact.
- `pokemon/{default-form}` has no Emerald learnset for Deoxys (the game ships the Speed form); handled by the per-game variety fallback above. If a future dex has another game-locked form, extend that fallback rather than hardcoding a species.
- Moves whose Gen II–IV type is `???` (Curse) come back as `unknown` type; there is no chart row for it, so validators allow it explicitly.

## Localization (ES)

- Standard: **European Spanish (`es`)** is the canonical ES locale, matching the official
  es-ES game releases. `es-419` (Latin American) strings are only used as a fallback when an
  `es` entry is missing in PokeAPI (see `getName`/`localName` in `scripts/lib/process.ts`).
- Species and type names come straight from PokeAPI's `es` entries (they match the official
  es-ES names for Gen 1–3).
- Ability names are now fetched from `ability/{slug}` and localized through the same path;
  previously the pipeline stored the English slug for both locales.
- Move names come from `move/{slug}.names` through the same `es` → `es-419` → `en` chain;
  all 346 fetched moves resolve a real Spanish name. Curated overrides live under the
  `moves` key of `/data/curated/i18n-fixes.json` (keyed by move slug).
- Location-area names are the weak spot: PokeAPI ships no Spanish for most of them, so the
  pipeline falls back to the English name. Obvious/wrong translations are corrected in
  `/data/curated/i18n-fixes.json` (keyed by location-area slug) and applied at build time.
  Further translations are welcome via PRs editing that file.
- Game-quirk differences (e.g. old-game wording) stay in the curated encounter locations,
  not in the global override file.

## Curated data

- Location: `/data/curated/<game-id>.json` — schema & rules in `/data/SCHEMA.md`; validated by the pipeline + tests; evolves via PR (community-friendly).
- Missing availability info (gifts, trades, statics) is never invented — curated entries must reference species already present in the game's dex.
