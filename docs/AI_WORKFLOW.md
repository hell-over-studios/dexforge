# AI Workflow — how AI agents must work in this repo

Last updated: 2026-11-05

This file governs any AI agent (Codex, Claude, Copilot, humans acting like agents…) working on Dexforge. It is written so a fresh agent with zero memory can operate safely.

## Required reading order (start of EVERY session)

1. `docs/HANDOFF.md` — exact state where the previous session stopped.
2. `docs/PROGRESS.md` — milestone status.
3. `docs/ROADMAP.md` — what belongs to the next version.
4. `docs/PROMPT.md` — product contract (never edit it).
5. `docs/DECISIONS.md` — don't relitigate decided things.
6. `AGENTS.md` — commands & conventions.

## Session lifecycle

1. **Plan** — pick tasks from ROADMAP/HANDOFF; small chunks; write down what "done" is.
2. **Branch** — `feat/<short-name>` (never work on `main` directly; `fix/…` for patches).
3. **Implement** — Conventional Commits, small and frequent. Squash-worthy work-in-progress is fine on the branch.
4. **Verify** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Fix before continuing.
5. **Docs** — update the docs you touched (PROGRESS, CHANGELOG, ARCHITECTURE/DATA_SOURCES/KNOWN_ISSUES as applicable) **in the same session**.
6. **Ship** — PR via `gh`, wait for CI, merge yourself (PATCH-level work), delete branch.
7. **End of session** — rewrite `docs/HANDOFF.md` from scratch, update PROGRESS + HANDOFF + CHANGELOG on `main`.

## Autonomy boundaries (from docs/PROMPT.md §6 — hard rules)

- PATCH and small in-milestone features: fully autonomous (branch + PR + merge).
- MINOR (`x.Y.0`) / MAJOR (`X.0.0`) release: **STOP** — prepare a review package (summary, screenshots, test results, docs, proposed changelog) and wait for explicit owner approval before tagging/publishing.
- Ask first: stack changes (new ADR required), paid services, deleting data, large architecture rewrites, anything legally uncertain.

## Hard rules

- The deployed site must never call PokeAPI (only static `/public/data` + raw.githubusercontent sprites).
- Never commit secrets, caches (`scripts/.cache`), or generated data dumps outside `/public/data`.
- No ripped 3D game models. No paid services.
- TypeScript `strict` stays on; no `any` without a written excuse; no `eslint-disable` without a comment explaining why.
- UI: Spanish default, English present; mobile-first; respect `prefers-reduced-motion`.
- Stuck 3 attempts on the same problem → document in `KNOWN_ISSUES.md`, open a GitHub issue, move on. Never loop forever.
- If the task list changes: update `ROADMAP.md` and keep GitHub issues in sync.

## Lessons learned

_(Append as they happen. Mistakes documented here are mistakes not to repeat.)_

- (2026-11-05) Don't generate docs with accidental non-English fragments; proofread generated markdown files with a multilingual-symbol grep before committing.
- (2026-11-05) Write per-file first pass to disk rather than long in-memory chains; keeping files small keeps diffs reviewable.

## Useful prompts / techniques

- Data gaps: “run `pnpm run data -- --game <id> --verbose` and summarize logged gaps before touching curated JSON.”
- Branding of sprites never relies on unofficial CDNs — check the URLs each entry stores.
