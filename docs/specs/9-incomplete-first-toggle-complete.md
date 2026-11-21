# Spec: #9 Show incomplete tasks first, and toggle a task complete

**Issue:** #9   **Plan:** [docs/plans/9-incomplete-first-toggle-complete.md](../plans/9-incomplete-first-toggle-complete.md)

## User story

As a person keeping a todo list, I want the tasks I still have to do at the top, newest first, and to tick a task off (or back on) with the mouse or the keyboard, so the list always shows what is left and I can record progress without hunting for it.

This is F2 (Order and complete) in [`docs/contracts/tasks.md`](../contracts/tasks.md). Only F2's files change (section 2 of the contract), and the work ships behind `VITE_FF_TASKS` (section 6).

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Incomplete tasks appear above completed ones; within each group the newest is first. | issue |
| AC2 | Checking a task moves it into the completed group; unchecking moves it back. | issue |
| AC3 | Each checkbox is reachable with Tab and toggles with Space. | issue |
| AC4 | Rows show title, notes when present, a priority badge unless priority is none, and the due date when set. | issue |
| AC5 | Only F2's files change (`src/features/complete/sortTasks.ts`, `toggleTask.ts`, `TaskList.tsx` and tests in `src/features/complete/`), the screen stays behind `VITE_FF_TASKS`, and CI passes. | derived (issue's Outcome) |
| AC6 | The functions follow the contract's rules (section 4): they never mutate their input; `toggleTask` flips `completed`, sets `updatedAt` to `now`, and returns the same array for an unknown id; each checkbox has an accessible name; task text is rendered as text, never HTML. | derived (contract) |

"Newest" means the latest `createdAt`. Toggling does not change `createdAt`, so a task keeps its place by age within whichever group it lands in.

The contract's `Priority` is `'low' | 'medium' | 'high'` and has no "none", so under today's contract every row shows a badge; see the plan's open questions.

## Out of scope

- The other features (F1, F3–F6), the shared files in section 3 of the contract, and any change to the contract, which needs an issue of its own (section 5).
