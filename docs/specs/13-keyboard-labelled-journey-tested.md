# Spec: #13 Keyboard-only use, labelled controls, and the add-complete-reload journey, tested

**Issue:** #13   **Plan:** [docs/plans/13-keyboard-labelled-journey-tested.md](../plans/13-keyboard-labelled-journey-tested.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md), feature F6

## User story

As a person who uses the task list with the keyboard, a screen reader, or a phone, I want every action on the task screen to work without a mouse, every control to have a name and a visible focus, a clear message when there is nothing to show, and my tasks to still be there after a reload, so that the list is usable however I reach it. Tests prove this on the finished screen.

This is F6 in `docs/contracts/tasks.md`. It adds tests in F6's places only (`src/features/empty/`, `src/features/accessibility/`, `e2e/tasks.spec.ts`), and fills in F6's one stub, `TaskEmptyState`, which the empty-state criterion needs. It needs F1 to F5 merged first. It ships behind `VITE_FF_TASKS`, which is off by default.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Without a mouse, add, complete, edit, delete, filter, search, and clear completed all work with Tab, Shift+Tab, Enter, Space, and Escape. | issue |
| AC2 | Every focused control shows a visible focus indicator. | issue |
| AC3 | The devtools accessibility tree shows no unnamed buttons, inputs, checkboxes, or selects. | issue |
| AC4 | First visit with empty storage shows the empty state. | issue |
| AC5 | At 375px width there is no horizontal scroll and every control is usable. | issue |
| AC6 | `npm run test:e2e` passes in the desktop and mobile projects. | issue |
| AC7 | The journey add, complete, reload survives: after a reload the added task is still there and still complete. | issue (Outcome) |
| AC8 | `TaskEmptyState` says "no tasks yet" when `totalCount` is 0, and "nothing matches" otherwise; its text is rendered as text, never as HTML. | derived (contract §2 F6) |
| AC9 | Only F6's places change; a fault the tests find in another feature is not fixed here. `npm run typecheck`, `lint`, `test`, `build` and `test:e2e` pass. | derived (issue's Outcome and "Not in this issue") |

## Out of scope

- Fixing a feature a test shows broken: that is the feature's own issue.
- The shared files in section 3 of `docs/contracts/tasks.md` (including `playwright.config.ts`), and any change to the contract.
- Turning `VITE_FF_TASKS` on for production or removing it (contract §6).
