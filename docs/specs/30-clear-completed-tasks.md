# Spec: #30 Clear completed tasks in one go

**Issue:** #30   **Plan:** [docs/plans/30-clear-completed-tasks.md](../plans/30-clear-completed-tasks.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md), feature F4

## User story

As a person keeping a task list, I want to remove every completed task at once with a "Clear completed" button, so that finished work stops cluttering the list, while every task I still have to do stays.

This is the "clear" part of F4 (Filter, search, clear) in `docs/contracts/tasks.md`. Only F4's files change, and the work ships behind the task screen's existing `VITE_FF_TASKS` flag (contract, section 6). It adds no flag of its own.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | `clearCompleted(tasks)` returns the tasks that are not completed, in their order. It never changes its input, and it returns the same array when no task is completed (the contract, section 4). | issue |
| AC2 | The filter bar shows a "Clear completed (N)" button, where N is `completedCount`. With no completed task it stays in place, marked `aria-disabled="true"`, and choosing it does nothing. | issue |
| AC3 | Choosing it with the mouse, or with Enter or Space, calls `onClearCompleted` once. On the task screen, the completed tasks go and the active ones stay listed. | issue |
| AC4 | After a clear, focus stays on the button, which now reads "Clear completed (0)" and is `aria-disabled`. Focus is never lost to the page (the contract, section 4). | issue |
| AC5 | `src/features/filter/clearCompleted.test.ts` covers AC1, and `src/features/filter/TaskFilterBar.test.tsx` covers AC2 to AC4, rendering `TaskScreen` with tasks from `makeTask` where it needs the whole screen. The existing tests, `src/tasks/contractDoc.test.ts` among them, still pass, and CI passes. | issue |
| AC6 | The button's accessible name is its visible text, "Clear completed (N)"; it stays reachable with Tab while `aria-disabled` and shows a visible focus. A clear with nothing completed saves nothing (the store sees the same array). | derived (contract, section 4) |

## Out of scope

- Filtering by status and searching: `filterTasks`, and the bar's status and search controls, which a later issue adds to the same files.
- A confirmation or an undo.
- Any change to `docs/contracts/tasks.md`, `src/tasks/`, or another feature's files.
