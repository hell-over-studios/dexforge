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
