# Dexforge — Project board

The project uses a **GitHub Projects v2 board** as the single Kanban view over the
repository's issue tracker. Issues remain the source of truth: the board only adds
status, priority, area and size fields on top of them (see ADR-010).

> **Board:** https://github.com/orgs/hell-over-studios/projects/1
>
> **Repo:** https://github.com/hell-over-studios/dexforge

## Provisioning status (2026-11-05)

- Project `#1` created in the `hell-over-studios` organization, private, with the
  `Kanban` board view and fields above.
- All 19 open issues (#2–#9 and #12–#22) are loaded and classified: 7 **Ready**,
  11 **Backlog**, 1 **Blocked**.
- **One-time UI step:** board views must be grouped with **Column by → Status**.
  GitHub's API exposes `groupByFields`/`verticalGroupByFields` as read-only, so this
  last setting cannot be automated; do it once in the view (View menu → Column by).
- The project is **not linked to the repository yet** (`gh project link` requires
  repository write access). An org owner can link it from the project settings so it
  appears in the repo's Projects tab.

## Columns (Status field)

| Column          | Meaning                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| **Backlog**     | Validated work that is not ready to start yet (dependencies, later version). |
| **Ready**       | Acceptance criteria written, no blockers, can be picked up immediately.      |
| **In progress** | Actively being worked on; a branch exists. WIP limit: 3 items per person.    |
| **In review**   | PR open and waiting for CI/review. Linked PR must be in the item.            |
| **Blocked**     | Cannot move forward; the blocking reason is written as an item comment.      |
| **Done**        | PR merged (or issue closed) and docs updated.                                |

## Fields

| Field        | Values                                        | Rule                                                                               |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Status**   | see columns above                             | Every item lives in exactly one column.                                            |
| **Priority** | `P0`, `P1`, `P2`, `P3`                        | `P0` release-blocking · `P1` next up · `P2` normal · `P3` nice-to-have.            |
| **Area**     | `Frontend`, `Data`, `Design`, `Docs`, `Infra` | Primary area touched by the PR.                                                    |
| **Size**     | `S`, `M`, `L`                                 | S ≤ ~100 lines · M ≤ ~250 · L ≤ ~400 (ADR-009). `L` must be split before starting. |

Milestone, labels and assignees stay on the issue; Projects mirrors them automatically
when the item is linked to the repository issue.

## Workflow

1. **Pick work** from the top of **Ready** (respect Priority, then Size).
2. Create the branch (`feat/…` or `fix/…`) and move the item to **In progress**,
   assigning yourself.
3. Open the PR; move the item to **In review** and link the PR in the item.
4. After merge, move it to **Done** and update `docs/PROGRESS.md` /
   `docs/CHANGELOG.md` if applicable.
5. If something cannot progress, move it to **Blocked** and add a comment with the
   reason and the unblocking condition.

## Initial classification (2026-11-05)

| #   | Item                                   | Status  | Priority | Area     | Size |
| --- | -------------------------------------- | ------- | -------- | -------- | ---- |
| 2   | red-blue — curate encounter data       | Ready   | P2       | Data     | L    |
| 3   | gold-silver — curate encounter data    | Ready   | P2       | Data     | L    |
| 4   | emerald — curate encounter data        | Ready   | P2       | Data     | L    |
| 5   | Gym leader & Elite Four data model     | Backlog | P2       | Data     | M    |
| 6   | Verify PokeAPI ES names                | Ready   | P3       | Data     | S    |
| 7   | Accessibility audit of landing         | Ready   | P2       | Design   | S    |
| 8   | Landing/game-selector visual pass      | Backlog | P3       | Design   | L    |
| 9   | DATA_SOURCES.md — 2026 schema findings | Ready   | P2       | Docs     | S    |
| 12  | T2.1 design tokens & pixel-cozy base   | Done    | P1       | Design   | M    |
| 13  | T2.2 app shell & layout                | Done    | P1       | Frontend | M    |
| 14  | T2.3 game selector screen              | Done    | P1       | Frontend | S    |
| 15  | T2.4 picker data layer                 | Done    | P1       | Data     | M    |
| 16  | T2.5 picker UI                         | Done    | P1       | Frontend | M    |
| 17  | T2.6 Pokémon detail drawer             | Done    | P2       | Frontend | S    |
| 18  | T2.7 sprite viewer                     | Done    | P2       | Frontend | M    |
| 19  | T2.8 team of 6                         | Done    | P1       | Frontend | M    |
| 20  | T2.9 share-by-URL stub                 | Done    | P2       | Frontend | S    |
| 21  | T2.10 Playwright setup + smoke e2e     | Done    | P2       | Infra    | M    |
| 22  | T2.11 deploy config                    | Done    | P1       | Infra    | S    |

## Maintenance

Add an issue to the board and set its fields (requires the `project` scope on the
GitHub CLI: `gh auth refresh -s project`):

```bash
gh project item-add <project-number> --owner hell-over-studios \
  --url https://github.com/hell-over-studios/dexforge/issues/<n> --format json

gh project field-list <project-number> --owner hell-over-studios --format json
gh project item-list  <project-number> --owner hell-over-studios --format json

gh project item-edit --project-id <project-id> --id <item-id> \
  --field-id <field-id> --single-select-option-id <option-id>
```

When `docs/ROADMAP.md` changes, update the board in the same PR: new PR-sized tasks
become issues, issues become board items, and the table above is refreshed (status
changes from normal workflow are also committed here, in small doc-only PRs).

> **Note for agents:** `gh project …` requires the `project` OAuth scope on the CLI
> token (`gh auth refresh -s project -h github.com`, one-time device flow). Without it
> status/field writes fail with "missing required scopes [read:project]".
