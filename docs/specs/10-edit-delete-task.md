# Spec: #10 Edit a task, and delete one after confirming

**Issue:** #10   **Plan:** [docs/plans/10-edit-delete-task.md](../plans/10-edit-delete-task.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md), feature F3

## User story

As a person keeping a task list, I want to change a task's title, notes, priority or due date, and to delete a task I no longer need, so that the list stays accurate. Editing happens in a dialog opened from the row's Edit action. Deleting happens only after I confirm in a dialog that names the task, so I cannot lose one by a stray click.

This is F3 in `docs/contracts/tasks.md`. Only F3's files change (`src/features/edit/`), and the work ships behind `VITE_FF_TASKS`, which is off by default.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Edit opens a dialog prefilled with the task; Save updates the row; Cancel or Escape changes nothing. | issue |
| AC2 | Saving with an empty title is blocked with the required-title error. | issue |
| AC3 | Delete opens a dialog naming the task; Cancel keeps it; Delete removes it. | issue |
| AC4 | Closing the edit dialog returns focus to the row's Edit button; after a delete, focus is in the composer's Title. | issue |
| AC5 | `updateTask` and `deleteTask` are pure: they never mutate their input, and return the same array for an unknown id (and `updateTask` also when the patch changes nothing). `updateTask` sets `updatedAt` to `now` on the task it changes, trims the title, and leaves `id`, `completed` and `createdAt` alone. | derived (contract §4) |
| AC6 | A title of only spaces counts as empty (AC2). Task text in both dialogs is rendered as text, never as HTML. Every control in both dialogs has an accessible name and works with the keyboard alone. | derived (contract §1, §4) |
| AC7 | Only F3's files change, and `npm run typecheck`, `lint`, `test`, `build` and `test:e2e` pass. | derived (issue's Outcome and "Not in this issue") |

## Out of scope

- The composer (F1), the list and its rows (F2), filtering (F4), persistence (F5), and screen-level accessibility tests (F6).
- The shared files in section 3 of `docs/contracts/tasks.md`, and any contract change (section 5).
- Undo after delete.
