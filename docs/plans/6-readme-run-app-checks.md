# Technical Plan: #6 README: how to run the app and its checks

**Ticket:** #6   **Spec:** [docs/specs/6-readme-run-app-checks.md](../specs/6-readme-run-app-checks.md)   **Status:** Draft

## 1. Summary

Add a "Run it" section to `README.md` so a fresh clone can be installed, checked and started from the README alone. It states the Node version, `npm ci`, the five scripts CI runs with one line each, and `npm run dev` with the URL it opens at and how to turn the task screen on. No other file in the app changes; this plan and its spec are the only other files on the branch.

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Node version to use, and how to install the dependencies | ticket |
| AC2 | Each CI script (`typecheck`, `lint`, `test`, `build`, `test:e2e`) named, one line each | ticket |
| AC3 | How to start the dev server and where the app opens | ticket |
| AC4 | Only `README.md` changes; CI passes | ticket |
| AC5 | Everything the README states matches the repository (Node range, scripts, port, `VITE_FF_TASKS`) | derived |

### Out of scope
Any change to the app, its scripts, its configuration or `.github/workflows/`.

### Assumptions
- "Only `README.md` changes" refers to the repository's content; the factory's own spec and plan under `docs/specs/` and `docs/plans/` ride on the same pull request, as for #2 and #4.
- The README recommends **Node 24** (what CI uses) and states the supported minimum, **22.12** (`package.json` `engines`).

## 3. Current state

Verified by reading the files:
- `README.md` describes the trial and the CI checks in one bullet, but gives no Node version, no install step and no way to start the app.
- `package.json`: `"engines": { "node": ">=22.12" }`; scripts `dev` (`vite`), `typecheck` (`tsc -b --noEmit`), `lint` (`eslint .`), `test` (`vitest run`), `build` (`vite build`), `preview` (`vite preview`), `test:e2e` (`playwright test`). `package-lock.json` is committed.
- `.github/workflows/ci.yml`: Node 24; `npm ci`; `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; `npx playwright install --with-deps chromium`; `npm run test:e2e`.
- `vite.config.ts` sets no server port, so `npm run dev` serves at Vite's default, `http://localhost:5173/`.
- `playwright.config.ts`: starts its own dev server on port 5173 (`--strictPort`) with `VITE_FF_TASKS=true`; locally it reuses a server already on 5173 (so that server must have the flag on too, as its comment says). Only the `chromium` project.
- `src/flags.ts`: the task screen shows only when `VITE_FF_TASKS` is `"true"` at build/dev time. Without it the app is the empty frame.

## 4. Proposed design

### Changes by component
| File | Change | New / modified |
|---|---|---|
| `README.md` | Add a `## Run it` section after the existing bullets; keep the existing text | modified |

### Content of the new section (contract)
1. **Prerequisites.** Node 24 (what CI uses); `package.json` requires at least 22.12. npm comes with Node.
2. **Install.** `npm ci` (installs exactly what `package-lock.json` pins).
3. **Start the app.** `npm run dev`, which opens at `http://localhost:5173/`. To see the task screen, `VITE_FF_TASKS=true npm run dev`; without it the app shows only the empty frame.
4. **The checks CI runs**, in CI's order, a table or list with one line each:
   - `npm run typecheck`: TypeScript type check of the app and config, no output files.
   - `npm run lint`: ESLint over the repository.
   - `npm test`: Vitest unit and component tests, once (not watching).
   - `npm run build`: production build into `dist/`.
   - `npm run test:e2e`: Playwright end-to-end tests in Chromium; starts the dev server itself with `VITE_FF_TASKS=true`. Run `npx playwright install --with-deps chromium` once first. If a dev server is already running on 5173 it is reused, so start that one with `VITE_FF_TASKS=true` too.

Commands go in fenced `sh` blocks. Wording may differ; the facts may not (AC5).

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Node version stated | "Node 24; at least 22.12" | CI's version is what is known to pass; `engines` is the floor | Only `>=22.12`: a reader may pick a version CI never tests |
| Install command | `npm ci` | Matches CI and the committed lockfile | `npm install`: may rewrite the lockfile |
| Mention `VITE_FF_TASKS` | Yes, under "Start the app" and `test:e2e` | Without it the dev server shows an empty frame, and a reused server fails e2e | Leave it out: the reader can't see the app's features |
| Add `.nvmrc` | No | AC4: only `README.md` changes | Listed as a follow-up |

## 6. Implementation tasks

### T1. Add the "Run it" section to `README.md` (S)
- Goal: AC1–AC3, AC5.
- Changes: `README.md` only.
- Details: content as in section 4. Check each fact against the file it comes from just before writing it.
- Done when: the section contains the Node version, `npm ci`, `npm run dev` with `http://localhost:5173/` and the flag, and the five scripts with one line each; `git diff --stat main` lists only `README.md` besides this spec and plan.
- Tests: manual check (section 7). No automated test: a test reading the README would be a new file, which AC4 rules out.
- Depends on: none.

### T2. Follow the README on a fresh clone (S)
- Goal: AC4, AC5.
- Details: in a clean clone of the branch, run exactly the README's commands in order: `npm ci`, the five checks (with the Playwright install), `npm run dev` and open the URL, then with `VITE_FF_TASKS=true` and see the task screen. Fix the README for any step that does not work as written. Record the commands and results as evidence.
- Done when: every command passes as written and CI is green on the pull request.
- Depends on: T1.

### Sequence
T1 then T2. Total: S + S.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1, T2 | manual | README names Node 24 / ≥22.12 and `npm ci`; `npm ci` succeeds |
| AC2 | T1, T2 | manual | Five scripts named with one line each; each runs and passes |
| AC3 | T1, T2 | manual | `npm run dev` serves at `http://localhost:5173/`; with the flag, the task screen shows |
| AC4 | T2 | CI | `git diff --name-only main` shows only `README.md` (plus spec/plan); CI green |
| AC5 | T1, T2 | review | Each stated fact matches `package.json`, `ci.yml`, `vite.config.ts`, `playwright.config.ts`, `src/flags.ts` |

Regression risk: none to the app; existing tests don't read `README.md` (checked with grep over `src` and `e2e`).

## 8. Rollout and rollback

**Feature flag: none, deliberately.** This change is documentation only: there is no code path to gate, and a flag cannot hide text in a Markdown file. The existing task-screen flag `VITE_FF_TASKS` is documented, not changed. Rollback is reverting the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| README drifts from scripts/config later | medium | low | AC5 check now; follow-up for an automated check |
| Port 5173 already in use locally, so Vite picks another port | low | low | README says Vite prints the URL it uses |

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | Is "no flag for a README-only change" acceptable? | plan gate | nothing | yes |

## 12. Follow-ups
- Add `.nvmrc` (24) so version managers pick the right Node.
- A test that the README's script list matches `package.json` and `ci.yml`.
