# Spec: #8 Add a task with a title, notes, priority and due date

**Issue:** #8   **Plan:** [docs/plans/8-add-task.md](../plans/8-add-task.md)

## User story

As a person keeping a todo list, I want a composer where I type a title (and, if I like, notes, a priority and a due date) and press Enter, so the task appears at the top of my list straight away and I can type the next one. If I forget the title, I want to be told next to the Title field instead of getting a blank task.

This is F1 (Add) in [`docs/contracts/tasks.md`](../contracts/tasks.md). Only F1's files change (`src/features/add/addTask.ts`, `src/features/add/AddTaskForm.tsx`, and test files in `src/features/add/`), and the feature ships behind `VITE_FF_TASKS`.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Typing only a title and pressing Enter adds the task at the top of the list with priority none and no due date. | issue |
| AC2 | With all fields filled, the new row shows the notes, priority, and due date as entered. | issue |
| AC3 | An empty or spaces-only title adds nothing and shows the required-title error next to Title. | issue |
| AC4 | After adding, the form is empty and focus is back in Title. | issue |
| AC5 | Only F1's files change (plus tests in `src/features/add/`), and the composer is reachable only with `VITE_FF_TASKS=true`. | derived (issue's Outcome) |
| AC6 | The stored task's title (and notes) are trimmed, `dueDate` is `'YYYY-MM-DD'` or `null`, `completed` is false, and `createdAt`/`updatedAt` come from the injected `now`; `addTask` does not mutate its input. | derived (contract §1 and §4) |
| AC7 | Every composer control has a visible label, works by keyboard alone, and the title error is announced (tied to Title with `aria-invalid` and `aria-describedby`). | derived (contract §4 Accessibility) |

### Reading AC1's "priority none"

The contract's `Priority` is `'low' | 'medium' | 'high'` with `DEFAULT_PRIORITY = 'medium'`; there is no "none", and changing it is out of scope for this issue (contract §5). This spec reads "priority none" as **no priority chosen, so the task gets the contract default, `DEFAULT_PRIORITY`**. See the plan's open question 1: if "none" must be a real value, that is a contract issue of its own, and AC1 waits for it.

### Reading AC1/AC2's "list" and "row"

Rows are rendered by F2's `TaskList`, which is still a stub. F1 is responsible for the task reaching the store first in the list with the right fields; what a row looks like is F2's. AC1 and AC2 are verified in F1 at the store level (the list `TaskScreen` hands to `TaskList`, and what is saved), and on screen once F2 is merged.

## Out of scope

- The other features (F2–F6), the shared files in contract §3, and any contract change (contract §5).
- Showing rows, sorting, editing, persistence beyond what the store already does.
