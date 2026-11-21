# Spec: #15 An unexpected error in the task screen blanks the whole page

**Issue:** #15   **Plan:** [docs/plans/15-unexpected-error-blanks-page.md](../plans/15-unexpected-error-blanks-page.md)

## User story

As someone using the to-do app, when the task screen hits an error nobody expected, I want the app's header to stay and the main region to tell me something went wrong and let me reload, so that I am not left looking at an empty page.

Today a save that fails with anything other than `TaskStorageError` is rethrown inside an effect in `src/tasks/useTasks.ts`; with no error boundary, React unmounts the whole app.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | When the task screen throws, during render or in an effect, the banner landmark stays and the main region shows a message that something went wrong and a Reload button. | issue |
| AC2 | Reload reloads the page. | issue |
| AC3 | The error is still logged to the console. | issue |
| AC4 | A failed save that throws `TaskStorageError` is handled as it is today, unchanged. | issue |
| AC5 | A test makes the task screen throw and checks the message and the button. | issue |
| AC6 | Section 3 of `docs/contracts/tasks.md` lists any new shared file, and CI passes. | issue |
| AC7 | With `VITE_FF_TASKS` off, the main region stays empty, as today; the fallback only exists where the task screen does. | derived (flag rule, contract section 6) |
| AC8 | The fallback message is announced to assistive technology and the Reload button has an accessible name and works with the keyboard. | derived (contract section 4, accessibility) |

## Out of scope

Changing `src/tasks/useTasks.ts` or any contract type. `src/App.test.tsx`, which another issue changes. The features (`src/features/`).
