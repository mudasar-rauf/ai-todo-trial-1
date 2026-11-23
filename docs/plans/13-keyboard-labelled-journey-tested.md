# Technical Plan: #13 Keyboard-only use, labelled controls, and the add-complete-reload journey, tested

**Ticket:** #13   **Spec:** [docs/specs/13-keyboard-labelled-journey-tested.md](../specs/13-keyboard-labelled-journey-tested.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md) (F6)   **Status:** Draft

## 1. Summary

F6 is the last feature. It fills in its one stub, `TaskEmptyState`, with Astryx's `EmptyState`, and adds tests in its three places only: a component test beside `TaskEmptyState`, a screen-level jsdom test (`src/features/accessibility/TaskScreen.a11y.test.tsx`) that drives the real `TaskScreen` with the keyboard alone and checks every control's name and where focus goes, and a Playwright spec (`e2e/tasks.spec.ts`) that does the same in a real browser and adds what jsdom cannot: real Tab order, a visible focus indicator on every tab stop, the 375px layout, and the add-complete-reload journey. No shared file and no contract changes. It waits for F4 (#11) and F5 (#12) to merge, and for a small prerequisite issue that adds a mobile project to the shared `playwright.config.ts` (open question 1).

## 2. Requirements

### User story
See the spec.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Add, complete, edit, delete, filter, search, clear completed work with Tab, Shift+Tab, Enter, Space, Escape | issue |
| AC2 | Every focused control shows a visible focus indicator | issue |
| AC3 | No unnamed buttons, inputs, checkboxes or selects in the accessibility tree | issue |
| AC4 | First visit with empty storage shows the empty state | issue |
| AC5 | At 375px: no horizontal scroll, every control usable | issue |
| AC6 | `npm run test:e2e` passes in the desktop and mobile projects | issue |
| AC7 | Add, complete, reload: still there, still complete | issue (Outcome) |
| AC8 | `TaskEmptyState`: "no tasks yet" for `totalCount` 0, "nothing matches" otherwise; text as text | derived (contract §2) |
| AC9 | Only F6's places change; the five checks pass | derived |

### Non-functional requirements
- Contract §4's accessibility rules are what the tests check, across the whole screen.
- No new dependencies (`package.json` is shared), so no axe package: names are checked with Playwright's `toHaveAccessibleName` and jest-dom's `toHaveAccessibleName`, which use the browser's and `dom-accessibility-api`'s accessible-name computation.
- Tests use only the keyboard to act. Locators are used to find and assert, never to click or fill.
- Tests stay deterministic: fresh browser context per test (empty `localStorage`), animations disabled for screenshots, no fixed sleeps.

### Out of scope
See the spec. In particular, a fault a test finds in F1–F5 is fixed in that feature's issue (§9, risk 1).

### Assumptions
- **Prerequisites merged first:** F4 (#11) and F5 (#12). On `main` today (685815a) `TaskFilterBar`, `filterTasks`, `clearCompleted`, `StorageErrorBanner` and `createLocalStorageTaskStorage` are still stubs, so filter, search, clear completed (AC1) and reload (AC7) cannot pass yet.
- **Mobile project:** AC6 needs a second Playwright project, and `playwright.config.ts` is a shared file F6 may not change. Assumed: a separate prerequisite issue (P1, §12) adds a `mobile` project using a Chromium phone profile (for example `devices['Pixel 7']`; CI installs only Chromium) and names the existing one `desktop`. See open question 1 for the fallback.
- **F4's controls:** their names are F4's to choose. The tests find them by role and the names F4 ships. Until #11 has a plan, the plan assumes a search box labelled `Search`, a status control labelled `Show` with `All`, `Active`, `Completed`, and a button `Clear completed`. The developer reads F4's merged component and uses its names.
- **Keys:** the issue's five keys are the minimum. Where a control's standard ARIA pattern needs arrow keys (a radio group, a listbox or a native select inside F4's status control), the tests use them, because that is the keyboard behaviour screen-reader users expect. See open question 2.
- **Focus after an action** is decided by the feature that owns it (contract §4). The tests assert those decisions where they are written down (F3: Edit button after the edit dialog closes, composer Title after delete) and otherwise assert only that focus is not lost to `body` (clear completed, F4).

## 3. Current state

Verified by reading `main` (685815a):
- `src/features/empty/TaskEmptyState.tsx` is a stub returning `null`. `src/features/accessibility/` and `e2e/tasks.spec.ts` do not exist.
- `TaskScreen` renders, in one `<section aria-labelledby>` named "Tasks" (h2): `StorageErrorBanner`, `AddTaskForm`, `TaskFilterBar`, then `TaskList` when `visibleTasks` is non-empty, else `<TaskEmptyState totalCount={store.tasks.length} filter={store.filter} />`. `TaskScreen` accepts `storage`, `createId`, `now`.
- F1 (merged): `<form aria-label="Add task">` with `TextInput` "Title", `TextArea` "Notes", `Selector` "Priority", `DateInput` "Due date", submit `Add task`; empty title → `Title is required`, focus to Title; after adding, focus returns to Title.
- F2 (merged): `<ul aria-label="Tasks">`; each row a `CheckboxInput` labelled by the title (notes as description), a priority `Badge`, an optional `<time>`, then the actions; focus stays on a checkbox after toggling moves its row.
- F3 (merged): per row `Edit` / `Delete` buttons named `Edit “<title>”` / `Delete “<title>”`; edit `Dialog purpose="form"` named "Edit task" with Title (autofocused), Notes, Priority, Due date, Cancel, Save; Escape cancels; focus returns to the Edit button. Delete: `AlertDialog` "Delete task?", Cancel / Delete; after delete focus moves to the composer's Title.
- `src/features/edit/editFlow.test.tsx` shows the jsdom pattern: stub `HTMLDialogElement.prototype.showModal`/`close` in the test file's `beforeAll`, render `TaskScreen` with an in-memory storage of `vi.fn`s, `userEvent.setup()`.
- `playwright.config.ts`: one project `chromium` (Desktop Chrome), `testDir: 'e2e'`, dev server started with `VITE_FF_TASKS=true`. CI runs typecheck, lint, test, build, then `npx playwright install --with-deps chromium` and `npm run test:e2e`.
- `e2e/frame.spec.ts` shows the e2e style; it imports `../src/appName`.
- Astryx 0.7.17 exports `EmptyState` (`@astryxdesign/core/EmptyState`).
- `src/tasks/contractDoc.test.ts` allows `*.test.ts(x)` files in a feature's directory; any other new file under `src/features/` fails it.

## 4. Proposed design

### Overview
```
TaskEmptyState (F6 component)          Astryx EmptyState
  totalCount 0  -> "No tasks yet"        "Add your first task above."
  otherwise     -> "No tasks match"      "Try another search or filter."

Tests (F6's places only)
  src/features/empty/TaskEmptyState.test.tsx      unit: AC8
  src/features/accessibility/TaskScreen.a11y.test.tsx
      jsdom, real TaskScreen + in-memory storage, keyboard only: AC1, AC3, AC4 (fast feedback)
  e2e/tasks.spec.ts  (runs in desktop and mobile projects)
      journey add-complete-reload: AC7
      keyboard-only walk of every action: AC1
      every tab stop, focused vs not, screenshots differ: AC2
      every control named, in four screen states: AC3
      first visit shows the empty state: AC4
      375px: no horizontal scroll, controls inside the viewport: AC5
```

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `src/features/empty/TaskEmptyState.tsx` | real body with Astryx `EmptyState` | modified (stub) |
| `src/features/empty/TaskEmptyState.test.tsx` | tests | new |
| `src/features/accessibility/TaskScreen.a11y.test.tsx` | screen-level keyboard, naming, focus tests | new |
| `e2e/tasks.spec.ts` | journey, keyboard, focus, names, empty state, 375px | new |

### APIs and contracts
Unchanged: `TaskEmptyState(props: TaskEmptyStateProps)` with `totalCount` and `filter`.

### Behaviour in detail
- **`TaskEmptyState`.** `totalCount === 0`: title `No tasks yet`, description `Add your first task above.` Otherwise: title `No tasks match`, description `Try another search or filter.`, and when `filter.query.trim()` is non-empty, `Nothing matches “<query>”. Try another search or filter.` The query is passed as a string prop (rendered as text). If Astryx's `EmptyState` renders a heading, its level must be 3 (below the screen's h2); if it cannot be set, use `Heading level={3}` and `Text` in a `VStack` instead. Not a live region: it mounts conditionally, so a `role="status"` would not be announced reliably (follow-up 3).
- **Keyboard helpers (both test files, kept private to each file).**
  - `tabTo(target, { backwards })`: press Tab (or Shift+Tab) until `target` has focus; fail after 60 presses, listing the focus path. This proves the control is reachable in the Tab order, not just focusable.
  - Actions use only `Enter`, `Space`, `Escape`, typing, and arrow keys where §2's key assumption applies.
- **jsdom screen test.** Render `TaskScreen` with an in-memory `TaskStorage` (`load` returns the seeded list, `save` a spy), fixed `createId` and `now`, and the dialog stubs from `editFlow.test.tsx` copied into this file's `beforeAll` (not `src/test/`). Cases:
  1. Empty storage: the empty state's "No tasks yet" shows and no `Tasks` list exists (AC4).
  2. Add by keyboard: Tab to Title, type, Enter; the row appears; focus is back on Title. Empty title + Enter shows `Title is required` and focus stays on Title (AC1).
  3. Complete: Tab to the row's checkbox, Space; it is checked and keeps focus; Space again un-checks (AC1).
  4. Edit: Tab to `Edit “…”`, Enter; the dialog opens with Title focused; Escape closes without change and focus is on the Edit button; reopen, change the title, Enter saves; focus on the renamed row's Edit button (AC1).
  5. Delete: Tab to `Delete “…”`, Enter; Shift+Tab / Tab between Cancel and Delete; Escape keeps the task; reopen, Enter on Delete removes it; focus is in the composer's Title (AC1).
  6. Filter, search, clear completed (F4's controls): show Active / Completed / All and see the list change; type in Search to narrow, see "No tasks match" for a query with no hits, clear it; with a completed task, Tab to Clear completed, Enter; completed tasks go, active stay, focus is not on `body` (AC1, AC8).
  7. Names (AC3): in four states (empty, with tasks, edit dialog open, delete dialog open), every element with role `button`, `textbox`, `searchbox`, `checkbox`, `radio`, `combobox`, `listbox`, `spinbutton`, `switch` has a non-empty accessible name (`toHaveAccessibleName(expect.stringMatching(/\S/))`), and every `input`, `select`, `textarea` and `button` in the document does too, hidden or not visible ones excluded.
- **Playwright spec.** `page.goto('/')`, then wait for the `Tasks` region. Each test starts with empty storage (fresh context). Helpers: `tabTo` via `page.keyboard.press('Tab')` and `locator.evaluate(el => el === document.activeElement)`; `addTask(title)` via keyboard. Cases:
  1. **Journey (AC7):** first visit shows "No tasks yet"; add `Buy milk` by keyboard; Space on its checkbox; `page.reload()`; the row `Buy milk` is there and its checkbox is checked; the empty state is gone.
  2. **Keyboard walk (AC1):** cases 2–6 above, in the real browser, so the real Tab order, native `<dialog>` focus and Astryx's real keyboard handling are tested.
  3. **Visible focus (AC2):** in the same four states as the names check, walk every tab stop with Tab from the top of the page (in a dialog, within the dialog) until focus returns to an element already seen, reaches `body`, or 80 presses. For each stop: take a screenshot clipped to the element's box padded by 8px (`animations: 'disabled'`, `caret: 'hide'`, mouse never moved), blur the element, take the same clip again, and expect the two images to differ. Then re-focus it and continue. A focused control that looks identical to an unfocused one has no visible indicator. Failures list the stop's role and name.
  4. **Names (AC3):** the same check as jsdom case 7 with Playwright's `toHaveAccessibleName(/\S/)` over `getByRole(...)` for each role and over `locator('input:visible, select:visible, textarea:visible, button:visible')`, in the four states. This is the browser's own accessibility tree, so it is what devtools shows.
  5. **Empty state (AC4):** fresh context, first load: the `Tasks` region shows "No tasks yet", has no `Tasks` list, and the composer's Title is reachable by Tab.
  6. **375px (AC5):** `page.setViewportSize({ width: 375, height: 812 })` in every project (so the desktop project checks it too). In four states (empty; three tasks, one with a long title, notes and a due date, one completed; edit dialog open; delete dialog open): `document.documentElement.scrollWidth <= 375` (with `clientWidth` as the bound), and every visible control (same selector as case 4) has a non-zero box lying within `0..375` horizontally. Then run the journey at that width.
- **Mobile project (AC6):** the whole spec runs unchanged in both projects; nothing in it branches on the project. Keyboard input works in Chromium's mobile emulation.

### Error handling and edge cases
- Titles with markup (`<b>x</b>`) and `&` in the seeded tasks: names and the empty state show them literally (AC3, AC8).
- A completed task and an active one both present for filter and clear completed.
- A query with no hits drives `TaskEmptyState`'s "nothing matches" branch through the real screen.
- Reload with a completed task: F5's `load()` must return it; a failed load would show F5's banner instead, which the journey asserts is absent.

## 5. Key decisions
| # | Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|---|
| 1 | How to prove a visible focus indicator | compare a clipped screenshot of each tab stop focused and blurred | works whatever Astryx draws (outline, box-shadow, a ring on a wrapper or a sibling); needs no knowledge of its CSS | reading computed `outline`/`box-shadow` on the element: misses rings drawn on wrappers or pseudo-elements; stored baseline screenshots: brittle across fonts and platforms |
| 2 | Where the keyboard walk runs | both jsdom and Playwright | jsdom gives fast, precise failures in `npm test`; Playwright proves real Tab order and native dialog focus | Playwright only: slow feedback; jsdom only: jsdom has no layout, no real focus ring, no real `<dialog>` |
| 3 | Name check without axe | `toHaveAccessibleName` per role and per form element | no new dependency (`package.json` is shared); checks exactly AC3's "unnamed" rule | adding `@axe-core/playwright`: a shared-file change, and its wider rules are not this issue's |
| 4 | 375px in which project | `setViewportSize(375)` inside the spec, in every project | AC5 is tested even before P1 lands, and on desktop Chrome too | relying on the mobile project's viewport: AC5 untested until P1; Pixel 7 is 412px wide, not 375 |
| 5 | The mobile project | a prerequisite issue changes `playwright.config.ts` | the issue forbids F6 changing shared files | a `test.use` mobile block inside F6's spec: works, but is not a "project", so AC6 would not hold as written (kept as the fallback, open question 1) |
| 6 | Test-only helpers | private functions inside each test file | contract: F6 may add only `*.test.ts(x)` under its directories and `e2e/tasks.spec.ts`; a helper module would fail `contractDoc.test.ts` or need a contract change | a shared `e2e/helpers.ts`: a new file outside F6's places |

**Flag for architect review:** decision 1 (screenshot diff as the focus check) and decision 5 (prerequisite issue for the mobile project).

## 6. Implementation tasks

### T1. `TaskEmptyState` (S)
- Goal: AC8, and the empty state AC4 relies on.
- Changes: `src/features/empty/TaskEmptyState.tsx`; drop the "Stub owned by" line; keep the export and signature.
- Done when: `TaskEmptyState.test.tsx` passes: "No tasks yet" for `totalCount` 0 (any filter); "No tasks match" for `totalCount` > 0; the query appears literally for `<b>x</b>`; no heading above level 3.
- Depends on: none.

### T2. Screen-level jsdom tests (M)
- Goal: AC1, AC3, AC4 in `npm test`.
- Changes: `src/features/accessibility/TaskScreen.a11y.test.tsx` (§4 "jsdom screen test", cases 1–7).
- Done when: every case passes against `main` with F4 and F5 merged.
- Depends on: T1; F4 (#11) and F5 (#12) merged (cases 1–5 can be written and pass before F4 merges; case 6 needs it).

### T3. Playwright spec (M–L)
- Goal: AC1–AC5, AC7 in a real browser.
- Changes: `e2e/tasks.spec.ts` (§4 "Playwright spec", cases 1–6).
- Done when: `VITE_FF_TASKS=true npm run test:e2e` passes locally (stop any running dev server first, contract §6).
- Depends on: T1; F4, F5 merged.

### T4. Both projects (S)
- Goal: AC6, AC9.
- Changes: none beyond T3, once P1 has added the mobile project.
- Done when: `npm run typecheck`, `lint`, `test`, `build`, `test:e2e` pass, and the e2e report lists every `tasks.spec.ts` test under both projects; `contractDoc.test.ts` and `e2e/frame.spec.ts` stay green.
- Depends on: T3; P1.

### Sequence
T1, then T2 ∥ T3, then T4. Roughly 2–3 days once the prerequisites are merged.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T2, T3 | jsdom screen + e2e | each action done with keys only; controls reached by Tab/Shift+Tab; focus lands where the owning feature says |
| AC2 | T3 | e2e | every tab stop in four states looks different focused than blurred |
| AC3 | T2, T3 | jsdom + e2e | every button, input, checkbox, select (and their ARIA roles) has a non-empty accessible name in four states |
| AC4 | T1, T2, T3 | unit + jsdom + e2e | first load with empty storage shows "No tasks yet" and no list |
| AC5 | T3 | e2e | at 375px no horizontal scroll and every control inside the viewport, in four states; the journey passes at 375px |
| AC6 | T4 | CI | `tasks.spec.ts` passes in desktop and mobile projects |
| AC7 | T3 | e2e | add, Space to complete, reload: row there and checked |
| AC8 | T1, T2 | unit + jsdom | both messages; query text literal |
| AC9 | all | CI + review | diff touches only F6's three places; five checks pass |

Regression risk: low. F6 changes one component that today renders `null`. `TaskScreen.composition.test.tsx`, `contractDoc.test.ts` and `frame.spec.ts` must stay green; a test in them that expects the empty state to render nothing would be a shared-file fault to raise, not to edit.

## 8. Rollout and rollback
- **Feature flag:** `VITE_FF_TASKS` (build-time environment variable, on only when exactly `true`, off by default; contract §6). It already gates the whole task screen, so F6 adds no flag; with it off, `TaskEmptyState` never renders. The e2e tests turn it on through `playwright.config.ts`. Once F6 merges, F1–F6 are all in, and a separate issue turns the flag on for production builds and then removes it (contract §6).
- No migrations, no data change.
- Rollback: revert the pull request; the stub and the absence of tests return.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 1. A test finds a real fault in F1–F5 (an unnamed control, no focus ring on an Astryx control, overflow at 375px) | Medium | F6's PR cannot go green | F6 does not weaken the test or fix it in another feature's file. The developer opens an issue for the fault naming the owning feature and asks the gate whether F6 waits for it or marks that one case `test.fixme` with the issue's number (open question 3) |
| 2. F4's controls use a pattern that needs arrow keys | Medium | literal reading of AC1 not met | §2's key assumption; open question 2 |
| 3. Screenshot diff flaky (transitions, caret, hover) | Low | flaky AC2 | `animations: 'disabled'`, `caret: 'hide'`, mouse never moved; compare focused vs blurred in the same run, no stored baselines |
| 4. P1 not done when F6 is ready | Medium | AC6 unmet | 375px is already checked in every project (decision 4); open question 1's fallback |
| 5. Tab-order walk is long or loops in a modal dialog | Low | slow or hanging test | cap of 80 presses; stop at the first repeated element or `body` |
| 6. Local runs reuse a dev server without the flag | Low | confusing local failures | contract §6 note; T3's "done when" says to stop a running server first |

## 10. Technical debt
None taken on. Keyboard helpers are duplicated in the two test files (decision 6); follow-up 2 would share them.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | AC6's mobile project needs `playwright.config.ts` changed, a shared file. Open a small prerequisite issue (P1) for it, or accept a 375px mobile `describe` block inside `e2e/tasks.spec.ts` instead? | product owner / plan gate | AC6 as written | P1 is opened and merged first |
| 2 | Are arrow keys acceptable where a control's ARIA pattern needs them (radio group, listbox, select in F4's filter)? | product owner | no | yes |
| 3 | When a test finds another feature's fault: wait for its fix, or merge F6 with that one case `test.fixme` and the issue linked? | plan gate | no | wait for the fix |

## 12. Follow-ups
- **P1 (prerequisite):** add a `mobile` project (Chromium phone profile, for example `devices['Pixel 7']`) to `playwright.config.ts` and rename the existing project `desktop`; it is a shared file, so its own issue (contract §3).
1. Once all features are in, remove `VITE_FF_TASKS` (contract §6).
2. If more e2e specs appear, a contract issue for a shared `e2e/` helper module.
3. Announce result counts and the empty state to screen readers with a persistent live region (F4's or a new issue).
