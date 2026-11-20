# Spec: #6 README: how to run the app and its checks

**Issue:** #6   **Plan:** [docs/plans/6-readme-run-app-checks.md](../plans/6-readme-run-app-checks.md)

## User story

As someone who has just cloned the repository, I want the README to tell me which Node version to use, how to install the dependencies, how to run each check CI runs and how to start the app, so that I can run the app and its checks from the README alone.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | `README.md` says which Node version to use, and how to install the dependencies. | issue |
| AC2 | It names each script in `package.json` that CI runs (`typecheck`, `lint`, `test`, `build`, `test:e2e`), with one line on what each does. | issue |
| AC3 | It says how to start the dev server and where the app opens. | issue |
| AC4 | Only `README.md` changes, and CI passes. | issue |
| AC5 | Every command and fact the README gives matches the repository as it is: the Node range in `package.json` `engines` and the Node version in `.github/workflows/ci.yml`, the scripts in `package.json`, the dev server's port, and the `VITE_FF_TASKS` flag needed to see the task screen. | derived (issue's Outcome: "from the README alone") |

## Out of scope

Any change to the app, its scripts, its configuration or `.github/workflows/`.
