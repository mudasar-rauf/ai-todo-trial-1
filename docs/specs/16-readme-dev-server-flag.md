# Spec: #16 The README says the dev server opens a browser, and its flag example fails on Windows

**Issue:** #16   **Plan:** [docs/plans/16-readme-dev-server-flag.md](../plans/16-readme-dev-server-flag.md)

## User story

As someone running the app from the README on macOS, Linux or Windows, I want it to say truthfully what `npm run dev` does and how to turn on the task screen in my shell, so that I can open the app and see the task screen without guessing.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | The README says the dev server serves the app at <http://localhost:5173/>, for the reader to open, and still says what happens when the port is taken. | issue |
| AC2 | It shows how to turn on `VITE_FF_TASKS` in a POSIX shell, in PowerShell and in cmd. | issue |
| AC3 | Only `README.md` changes. | issue |
| AC4 | Each of the three flag commands, typed as written, sets `VITE_FF_TASKS` to exactly `true` (`src/flags.ts` compares with `=== 'true'`, so a trailing space, as `set VITE_FF_TASKS=true && npm run dev` gives in cmd, leaves the task screen off). | derived (issue's Outcome: "describes running the app correctly") |

## Out of scope

Changing the dev server, its port, or how the flag works (issue). Any file other than `README.md` (besides this spec and its plan).
