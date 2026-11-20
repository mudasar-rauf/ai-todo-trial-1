# Spec: #2 Scaffold the app: an Astryx-themed frame with a header and a main region

**Issue:** #2   **Plan:** [docs/plans/2-scaffold-astryx-app-frame.md](../plans/2-scaffold-astryx-app-frame.md)

## User story

As a developer on the todo app, I want a Vite, React 19, TypeScript and Astryx project, with its checks and test runners set up, that renders an Astryx-themed frame with a header and an empty main region. Then later issues only add features into the main region, and none of them has to change `package.json` or the tooling.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | `npm run dev` shows a header with the app name and a main region below it, with none of Vite's demo content. | issue |
| AC2 | Text and spacing come from Astryx's theme-neutral: no default browser body margin, and Astryx's font. | issue |
| AC3 | The browser's accessibility tree has one banner landmark and one main landmark, and a Playwright test checks it. | issue |
| AC4 | `package.json` defines the scripts the repository's CI runs (`.github/workflows/ci.yml`, which cannot be changed): `typecheck`: TypeScript with no emit; `lint`: ESLint; `test`: Vitest, once, not watching; `build`: the production build; `test:e2e`: Playwright, starting the app itself. | issue |
| AC5 | On a fresh clone, `npm ci`, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `npm run test:e2e` all pass, as CI runs them, and `package-lock.json` is committed. | issue |
| AC6 | No later issue needs to change `package.json`: the dependencies a todo screen built with Astryx and tested with Vitest and Playwright needs (React, Astryx core and theme, StyleX runtime, Testing Library, jsdom) are already installed. | derived (issue's Outcome) |

## Out of scope

- The task screen and every feature.
- `.github/workflows/` (the CI workflow cannot be changed).
