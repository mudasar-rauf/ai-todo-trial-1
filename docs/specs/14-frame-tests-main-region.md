# Spec: #14 The frame's tests pass even when the main region is not empty

**Issue:** #14   **Plan:** [docs/plans/14-frame-tests-main-region.md](../plans/14-frame-tests-main-region.md)

## User story

As a developer changing the app frame, I want the frame's tests to fail when the main region holds anything while `VITE_FF_TASKS` is off, so that content leaking into the main region with the flag off is caught. Today `src/App.test.tsx` checks the region with `toHaveTextContent('')` (lines 18 and 37), which passes for any text, so it catches nothing.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | With the flag off, the frame's tests fail when the main region contains any element or text, and pass when it is empty. | issue |
| AC2 | Only `src/App.test.tsx` changes, and CI passes. | issue |
| AC3 | Both flag-off checks are tightened: the default frame test (flag unset, line 18) and the flag-set-to-`"false"` test (line 37). | derived (issue names both lines) |

## Out of scope

The task screen, and the tests with the flag on. Any change to `src/App.tsx` or other app code.
