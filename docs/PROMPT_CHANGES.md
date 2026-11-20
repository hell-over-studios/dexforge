# Prompt Changes log

`docs/PROMPT.md` is the verbatim product contract and is **never edited**.
Any owner-approved change to requirements is recorded here with date and effect.

## 2026-11-06 — Design direction change (#1) & PR discipline (#2) — Owner directive

**Owner:** Martin, via session chat.

### Change 1 — Visual direction: "pixel art" + "cozy" (amends §2, first sentence)

> "Regarding the design, I'd like the interface to have a 'pixel art' and 'cozy' style."

- Replaces the neutral v0.1 placeholder look and the earlier "instrumented dark Pokédex" leanings.
- §2's functional requirements are unchanged: game sprite of the selected game is the default visual,
  shiny/animated/artwork/HOME toggles, no ripped 3D models, smooth transitions, mobile-first,
  `prefers-reduced-motion`, keyboard + contrast.
- Concretized as ADR-008 in `docs/DECISIONS.md` (fonts, palette, component rules). See also
  `src/styles/global.css` design tokens.

### Change 2 — Task granularity & PR scope (amends §6 workflow guidance)

> "Break down the tasks and issues a bit more, and ensure the pull requests are smaller in scope."

- ROADMAP milestones are now expanded into **PR-sized tasks** (each maps to one small branch + PR).
- PR size budget: one cohesive change — roughly ≤ ~400 changed lines (excluding generated data),
  or a single screen/feature slice. If a task grows past that, **split it first**.
- GitHub issues are opened per PR-sized task (labels + milestone + acceptance criteria), not per milestone.
- Same self-merge autonomy for PATCH-level and in-milestone work applies, per PR.

Recorded by the lead engineer agent; no other clauses of `docs/PROMPT.md` are affected.

### Change 3 -- Species visuals: official artwork ONLY (amends T2.7 scope from the ADR-008-era spec)

> "Quita el sprite de cada pokemon, unicamente la ilustracion, no uses las demas"
> (2026-11-07, session chat)

- Every species visual now uses **only the official artwork** (sprites.official): picker rows,
  team slots, and the detail drawer.
- The sprite-kind toggles (game / shiny / animated showdown / HOME) and their documented fallback
  chain are withdrawn; src/lib/sprites.ts was removed along with its tests. The pixelated
  utility stays for future pixel-art elements, but species images render smooth.
- The full sprite data (game/shiny/showdown/home) is still emitted by the data pipeline and may
  return behind a future owner decision; no data-format change.

## 2026-11-16 — Visual direction revision: Pixel-cozy v2 «Pergamino» — Owner directive

**Owner:** Martin, via session chat.

### Change 4 — Rendition of the pixel-cozy world (amends ADR-008, not §2)

> "No me gusta para nada como esta visualmente, utiliza las skills que sean necesarias y cambia el diseño"
> (2026-11-16, session chat)

- Keeps the owner's pixel art + cozy mandate and the official-artwork-only rule; replaces the warm-bark/dark-panel rendition with **parchment panels over a deep forest ground**, larger pixel display type, a field-journal composition and solid legible type chips.
- §2 functional requirements are unchanged: game-scoped data, official artwork only, mobile-first, keyboard + contrast, `prefers-reduced-motion`, no runtime PokeAPI.
- Recorded as the ADR-008 revision in `docs/DECISIONS.md`; direction contract in `.impeccable/surfaces/home.md`; product truth in `PRODUCT.md`.
- Rollout is sliced per ADR-009: landing + shared shell, then the game-page picker/team/detail, then the analysis panels.

Recorded by the lead engineer agent; no other clauses of `docs/PROMPT.md` are affected.

## 2026-11-19 — Visual direction «Revista» and anvil-Pokédex logo — Design team decision

**Source:** the project's design lead, relaying the team's decision in session chat.

### Change 5 — Site personality (replaces ADR-008 / «Pergamino»; §2 unchanged)

- After reviewing five explored personalities, the team chose the **strategy magazine** («Revista») and asked for it to be implemented with care, together with the already-approved usability changes.
- Logo: the **anvil-Pokédex fusion** (option 2 of the logo sheet).
- §2 functional requirements are unchanged: game-scoped data, official artwork only, mobile-first, keyboard + contrast, `prefers-reduced-motion`, no runtime PokeAPI.
- Recorded as ADR-012 in `docs/DECISIONS.md`.

Recorded by the lead engineer agent; no other clauses of `docs/PROMPT.md` are affected.
