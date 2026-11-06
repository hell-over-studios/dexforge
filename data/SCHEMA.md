# Curated data — rules & schema

Hand-curated complement to PokeAPI encounter data.

## Why

PokeAPI `pokemon/{id}/encounters` only covers **wild** encounters. It misses:

- Starter/gift selections (`gift`),
- In-game trades (`trade`),
- Static encounters (legendaries, headbutt trees, rock-smash–artificial ones, overworld Pokémon) (`static`),
- Availability that only exists through evolving a pre-evolution obtainable in the game (`evolve`),
- Mystery Gift / distribution events (`event`).

## Location & naming

- One file per game id (same ids as `public/data games` list): `data/curated/<game-id>.json`.
- Entries are merged by the pipeline into the per-game JSON with `source: "curated"`, **never replacing** fetched wild data (both may coexist).
- Data quality target: verifiable in-game facts only. Cite in `notes` when possible ("Requires HM03 Surf", "Crystal only"…).
- Species must already belong to the game's dex; the pipeline throws if not (a species available only via evolution of a pre-evolution _not in the dex_ uses kind `evolve` with a note instead).

## Schema

```jsonc
{
  "game": "red-blue", // must match games.ts id
  "entries": [
    {
      "species": "charmander", // PokeAPI slug
      "kind": "gift",
      "location": { "en": "Pallet Town", "es": "Pueblo Paleta" },
      "method": "Starter",
      "versions": ["red", "blue"], // optional; omit = all versions
      "minLevel": 5,
      "maxLevel": 5,
      "rate": null,
      "notes": null,
    },
  ],
}
```

| kind     | Meaning                                                        | Example (`red-blue`)          |
| -------- | -------------------------------------------------------------- | ----------------------------- |
| `gift`   | given to the player                                            | starter                       |
| `trade`  | NPC wants your mon                                             | Poliwhirl→Jynx                |
| `static` | overworld / one-time catch                                     | legendary                     |
| `evolve` | only via evolving                                              | obtainable only via evolution |
| `event`  | distribution                                                   | Mew (Gen 1)                   |
| `wild`   | (usually from PokeAPI; use here only if you know better rates) | —                             |

## Tips for contributors

- Localize the _location_ (`{"en": "…", "es": "…"}`); method strings can stay English-ish for consistency since they are rendered as-is.
- In version-exclusive groups, fill `versions` with the **exact** member slugs ("red", "blue"…).
- Test locally: `pnpm run data -- --game <id> --verbose && pnpm test`.
