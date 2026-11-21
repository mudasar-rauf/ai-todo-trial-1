# Technical Plan: #14 The frame's tests pass even when the main region is not empty

**Ticket:** #14   **Spec:** [docs/specs/14-frame-tests-main-region.md](../specs/14-frame-tests-main-region.md)   **Status:** Draft

## 1. Summary

The two flag-off tests in `src/App.test.tsx` assert `toHaveTextContent('')`. jest-dom's `toHaveTextContent` with a string does a substring match, and every string contains `''`, so the assertion always passes. Replace both with `toBeEmptyDOMElement()`, which fails if the element has any child element or any text node (comments are ignored). Test-only change; no app code moves.

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Flag off: tests fail if main holds any element or text, pass when empty | ticket |
| AC2 | Only `src/App.test.tsx` changes; CI passes | ticket |
| AC3 | Both flag-off checks (line 18, flag unset; line 37, flag `"false"`) tightened | derived |

### Out of scope
The task screen; the flag-on test (lines 27-32); any app code.

### Assumptions
- "Only `src/App.test.tsx` changes" refers to the repository's code; the factory's own spec and plan ride on the same pull request, as for #2, #4 and #6.

## 3. Current state

Verified by reading the code:
- `src/App.tsx` passes `children={isTasksEnabled() ? <TaskScreen /> : null}` to `AppShell`.
- `@astryxdesign/core` `dist/AppShell/AppShell.js` (around line 864) renders `LayoutContent` with `role: "main"`, whose children are `AppShellNestingContext` (a context provider, no DOM) wrapping `children`. `dist/Layout/LayoutContent.js` (line 161) renders one `div` with `children` straight inside it. So with the flag off the `role="main"` element has **no child nodes**: `toBeEmptyDOMElement()` passes on today's app without any change to `App.tsx`.
- `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` (`^8.0.0`), which provides `toBeEmptyDOMElement`.
- `src/App.test.tsx` line 18 (`App frame` describe, flag unset) and line 37 (`App behind VITE_FF_TASKS`, flag `"false"`) use `toHaveTextContent('')`.

## 4. Proposed design

| File | Change | New / modified |
|---|---|---|
| `src/App.test.tsx` | Line 18: `expect(mains[0]).toBeEmptyDOMElement();` Line 37: `expect(screen.getByRole('main')).toBeEmptyDOMElement();` Keep the `queryByRole('region', { name: 'Tasks' })` check on line 38. | modified |

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Matcher | `toBeEmptyDOMElement()` | Fails on any element or text node, exactly AC1; reads as the intent | `toHaveTextContent(/^$/)`: misses elements without text (e.g. an empty `<div>`). `childNodes.length === 0`: same effect, worse failure message. `innerHTML === ''`: brittle against comment nodes |

## 6. Implementation tasks

### T1. Assert the main region is empty with the flag off (S)
- Goal: AC1, AC3.
- Changes: `src/App.test.tsx` lines 18 and 37 as in section 4. Nothing else.
- Done when: `npm test` passes; and a **mutation check** shows both tests fail when main is not empty: temporarily change `App.tsx`'s flag-off branch from `null` to (a) `'x'` (text) and (b) `<div />` (empty element), run `npx vitest run src/App.test.tsx`, see both flag-off tests fail in each case, then revert `App.tsx` (it must not be committed). Record the output as evidence.
- Tests: the two edited tests themselves.
- Depends on: none.

### T2. Run CI's checks (S)
- Goal: AC2.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`; `git diff --stat main...` shows only `src/App.test.tsx` beyond the spec and plan.
- Depends on: T1.

Total: S.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1 | Component (Vitest + RTL) + mutation check | Empty main passes; text or element in main fails |
| AC2 | T2 | CI | All five checks green; diff limited to the test file |
| AC3 | T1 | Component | Both flag-off tests use `toBeEmptyDOMElement()` |

Regression risk: if a future AppShell version wraps `children` in an element, these tests will fail with the flag off. That is the intended signal (the region is then not empty in the DOM); fix by asserting on the wrapper, decided then.

## 8. Rollout and rollback

Test-only change; no feature flag needed because no shipped behaviour changes (the existing `VITE_FF_TASKS`, off by default, is what the tests exercise). Rollback: revert the commit.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Main is not truly empty today (hidden wrapper) | Low (verified in AppShell source) | Tests fail on first run | T1's first `npm test` run shows it; then raise it on the PR rather than changing `App.tsx` |

## 11. Open questions
None.
