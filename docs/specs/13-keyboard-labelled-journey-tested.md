# Spec: #13 Keyboard-only use, labelled controls, and the add-complete-reload journey, tested

**Issue:** #13   **Plan:** [docs/plans/13-keyboard-labelled-journey-tested.md](../plans/13-keyboard-labelled-journey-tested.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md), feature F6

## User story

As a person who uses the task list with a keyboard, a screen reader, or a phone, I want every part of the finished task screen to work without a mouse, to name every control, to show where focus is, to tell me when there is nothing to show, and to keep my tasks across a reload, so that I can rely on it whatever way I use it. As the team, we want tests that prove this, so that a later change cannot quietly break it.

This is F6 in `docs/contracts/tasks.md`. It fills in F6's one component (`TaskEmptyState`) and adds tests in F6's three places only: `src/features/empty/`, `src/features/accessibility/` and `e2e/tasks.spec.ts`. It needs F1 to F5 merged first. It ships behind `VITE_FF_TASKS`, which is off by default.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | Without a mouse, add, complete, edit, delete, filter, search, and clear completed all work with Tab, Shift+Tab, Enter, Space, and Escape. | issue |
| AC2 | Every focused control shows a visible focus indicator. | issue |
| AC3 | The devtools accessibility tree shows no unnamed buttons, inputs, checkboxes, or selects. | issue |
| AC4 | First visit with empty storage shows the empty state. | issue |
| AC5 | At 375px width there is no horizontal scroll and every control is usable. | issue |
| AC6 | `npm run test:e2e` passes in the desktop and mobile projects. | issue |
| AC7 | The journey: add a task, complete it, reload, and the task is still there and still complete. | issue (Outcome) |
| AC8 | `TaskEmptyState` says there are no tasks yet when `totalCount` is 0, and that nothing matches otherwise; its text is rendered as text. | derived (contract §2, F6) |
| AC9 | Only F6's places change (`src/features/empty/`, `src/features/accessibility/`, `e2e/tasks.spec.ts`), no shared file and no contract changes, and `npm run typecheck`, `lint`, `test`, `build` and `test:e2e` pass. | derived (issue's Outcome and "Not in this issue") |

## Out of scope

- Fixing a feature a test shows broken: that is the feature's own issue (F1 #8, F2 #9, F3 #10, F4 #11, F5 #12, or a new one).
- The shared files in section 3 of `docs/contracts/tasks.md`, including `playwright.config.ts`, and any change to the contract (section 5).
- New dependencies (for example an axe package): `package.json` is a shared file.
