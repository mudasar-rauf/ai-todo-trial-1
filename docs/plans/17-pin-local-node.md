# Technical Plan: #17 Pin local Node to the version CI uses

**Ticket:** #17   **Spec:** [docs/specs/17-pin-local-node.md](../specs/17-pin-local-node.md)   **Status:** Draft

## 1. Summary

Add a one-line `.nvmrc` holding `24` at the repository root, so `nvm install` / `nvm use` (and tools that read `.nvmrc`, such as fnm) pick the Node major CI runs. Add one sentence to the README's "Prerequisites" pointing at it. `package.json`'s `engines` (`>=22.12`) and the CI workflow stay as they are. This also closes the follow-up the #6 plan listed ("Add `.nvmrc` (24)").

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | `.nvmrc` at the root holds `24` | ticket |
| AC2 | README's setup mentions `.nvmrc` | ticket |
| AC3 | `engines` unchanged; CI passes | ticket |
| AC4 | `.github/workflows/` unchanged | derived |

### Out of scope
CI, `.github/workflows/`, the `engines` range, other version-manager files.

### Assumptions
- "Holds `24`" means the file's content is `24` followed by one newline (the usual text-file ending; nvm trims whitespace). No `v` prefix and no full version: CI's `setup-node` uses `node-version: 24`, a major, so the file matches it exactly.

### Note on an earlier run
A previous run's pull request for this issue (#24, branch `factory/17-pin-local-node-version`) was closed without merging. This run starts fresh from `main` on `factory/17-pin-local-node`. Its review's one minor finding (the scope check compared against `main`'s moving tip) is addressed in T2, which diffs against the merge base.

## 3. Current state

Verified by reading the files:
- No `.nvmrc`, `.node-version` or `.tool-versions` at the root.
- `package.json`: `"engines": { "node": ">=22.12" }`.
- `.github/workflows/ci.yml`: `actions/setup-node` with `node-version: 24` (not `node-version-file`).
- `README.md` → "Run it" → "Prerequisites" (line 14): "Use **Node 24**, the version CI runs. `package.json` requires at least Node 22.12. npm comes with Node."
- `docs/plans/6-readme-run-app-checks.md` lists "Add `.nvmrc` (24) so version managers pick the right Node." as a follow-up.

## 4. Proposed design

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `.nvmrc` | Content `24` and a newline | new |
| `README.md` | One sentence in "Prerequisites" | modified |

### Content (contract; wording may differ, the facts may not)
After the existing Prerequisites sentence: "`.nvmrc` at the repository's root names that version: with nvm, run `nvm install` (or `nvm use` if Node 24 is already installed) in the repository; fnm and other tools that read `.nvmrc` pick it up too."

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Version format | `24` | Matches CI's `node-version: 24` and AC1 exactly; follows 24.x patches as CI does | `v24`, `lts/*`, or a full `24.x.y`: drift from CI or from AC1 |
| Version file | `.nvmrc` only | The issue asks for it; nvm and fnm read it | Also `.node-version`: a second source of truth, out of scope |
| Where in README | "Prerequisites" | The setup section that already names Node 24 | A new section: too much for one sentence |

No significant decisions; no ADR.

## 6. Implementation tasks

### T1. Add `.nvmrc` and the README sentence (S)
- Goal: AC1, AC2.
- Changes: new `.nvmrc`; `README.md` "Prerequisites" only.
- Done when: `cat .nvmrc` prints `24`; the README mentions `.nvmrc` in "Prerequisites".
- Tests: manual (section 7). No automated test: nothing in the app reads these files, and a test parsing a dotfile would be more code than the change.
- Depends on: none.

### T2. Check (S)
- Goal: AC1, AC3, AC4.
- Details:
  - Where nvm is available, `nvm install` in the repo root resolves to a 24.x; otherwise record that nvm was not available and check the content with `od -c .nvmrc` (`2 4 \n`).
  - `git fetch origin && git diff --name-only origin/main...HEAD` (three dots: against the merge base, so later commits on `main` do not show up) lists `.nvmrc`, `README.md` and this spec and plan only; `package.json` and `.github/` absent.
  - CI green on the pull request.
- Depends on: T1.

### Sequence
T1 then T2. Total: S + S.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1, T2 | manual | `.nvmrc` content is `24`; nvm resolves it to 24.x |
| AC2 | T1 | review | README "Prerequisites" mentions `.nvmrc` |
| AC3 | T2 | git / CI | `package.json` not in the diff; CI green |
| AC4 | T2 | git | `.github/` not in the diff |

Regression risk: none; no code, script or test reads `.nvmrc` or `README.md`. CI's `setup-node` uses `node-version`, not `node-version-file`, so it ignores the new file.

## 8. Rollout and rollback

**Feature flag: none, deliberately.** The change is a dotfile read only by local version managers and a README sentence; there is no code path to gate, and a flag cannot hide a file nvm reads. This matches #6 and #16. The existing `VITE_FF_TASKS` flag is untouched. Merging is the release; rollback is reverting the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `.nvmrc` and CI's version drift apart later | medium | low | Follow-up below: have CI read `.nvmrc` |

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | Is "no feature flag" acceptable for a dotfile and README change? | plan gate | nothing | yes, as for #6 and #16 |

## 12. Follow-ups
- Point CI's `setup-node` at `node-version-file: .nvmrc` so there is one source of truth (needs a person: agents cannot change workflows).
