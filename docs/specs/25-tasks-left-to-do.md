# Spec: #25 Show how many tasks are left to do

**Issue:** #25   **Plan:** [docs/plans/25-tasks-left-to-do.md](../plans/25-tasks-left-to-do.md)

## User story

As someone using the to-do app, I want the task screen to say how many of my tasks are not yet done, so that I see what is left at a glance.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Below the task list, the screen says "N tasks left", where N is the number of tasks not marked done. | issue |
| AC2 | With one task left it says "1 task left"; with none it says "No tasks left". | issue |
| AC3 | The count updates at once when a task is added, completed or reopened, without a reload. | issue |
| AC4 | A unit test covers the three wordings, and the existing tests still pass. | issue |
| AC5 | N counts every task not marked done, whatever the filter or search shows; and the line still shows when no task is visible (below the empty state instead of the list). | derived (AC1 says "the number of tasks not marked done", not "visible tasks") |
| AC6 | A change in the count is announced to assistive technology politely, without moving focus. | derived (contract section 4, accessibility) |
| AC7 | With `VITE_FF_TASKS` off, the main region stays empty, as today. | derived (flag rule, contract section 6) |
| AC8 | `docs/contracts/tasks.md` lists the new feature's files, exports and prop type, and its contract test passes. | derived (contract section 5: this issue changes the contract, so it updates the document) |

## Out of scope

Filtering the list by done or not done (that is F4's). Any change to `Task`, the storage, the reducer or `useTasks`.
