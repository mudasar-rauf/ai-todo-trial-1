# Technical Plan: #13 Keyboard-only use, labelled controls, and the add-complete-reload journey, tested

**Ticket:** #13   **Spec:** [docs/specs/13-keyboard-labelled-journey-tested.md](../specs/13-keyboard-labelled-journey-tested.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md) (F6)   **Status:** Draft

## 1. Summary

F6 proves the finished task screen is accessible and that tasks survive a reload. It fills in its one stub, `TaskEmptyState`, and adds tests in its three places: a component test for the empty state, a screen-level jsdom test (`src/features/accessibility/TaskScreen.a11y.test.tsx`) that drives every action with the keyboard alone and checks every control's accessible name, and a Playwright spec (`e2e/tasks.spec.ts`) that checks the same things in a real browser: the add-complete-reload journey, a visible focus indicator on every tab stop, the empty state on a first visit, and the 375px layout. No other file changes. Two things sit outside F6: F4 (#11) and F5 (#12) must be merged first, and AC6's "mobile project" needs a change to the shared `playwright.config.ts` (prerequisite P1, §11 question 1).

## 2. Requirements

### User story
See the spec.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Add, complete, edit, delete, filter, search, clear completed: all with Tab, Shift+Tab, Enter, Space, Escape only | issue |
| AC2 | Every focused control shows a visible focus indicator | issue |
| AC3 | No unnamed buttons, inputs, checkboxes or selects in the accessibility tree | issue |
| AC4 | First visit with empty storage shows the empty state | issue |
| AC5 | At 375px: no horizontal scroll; every control usable | issue |
| AC6 | `npm run test:e2e` passes in the desktop and mobile projects | issue |
| AC7 | Add, complete, reload: the task is still there and still complete | issue (Outcome) |
| AC8 | `TaskEmptyState`: "no tasks yet" when `totalCount` is 0, else "nothing matches"; text as text | derived (contract §2) |
| AC9 | Only F6's places change; no fixes to other features; the five checks pass | derived |

### Non-functional requirements
- Tests are deterministic: in-memory storage and fixed `now`/`createId` in jsdom; a fresh browser context (empty `localStorage`) per Playwright test.
- No new dependencies (`package.json` is shared): no axe-core. Names are checked with Testing Library's and Playwright's `toHaveAccessibleName`, which use the browser's accessible-name computation.
- Keyboard-only tests never call `click`/`tap`; they use `user.keyboard`/`user.tab` (jsdom) and `page.keyboard` (Playwright).

### Out of scope
See the spec. If a test exposes a fault in F1–F5's files, the developer does not fix it here or weaken the test: they name or file the owning feature's issue and ask a person how to proceed (§9 risk 2).

### Assumptions
- F4 (#11) and F5 (#12) are merged before implementation starts, as the issue says. Today (`main` at 685815a) their files are stubs, so the filter, search, clear-completed and reload parts of the tests cannot pass yet.
- F4's controls are found by role and name: a search `textbox`/`searchbox` whose name matches `/search/i`, a status control (a `combobox`, `radiogroup` or group of buttons) named for status, and a button named `/clear completed/i`. The developer reads F4's merged code and uses its exact names; the tests do not dictate them.
- F5's `localStorage` key is `todo.tasks.v1` (contract), so a fresh browser context is "first visit with empty storage".
- F4 decides where focus goes after clear completed (contract §4); F6 asserts only that it lands on a control inside the task region, not on `body`.

## 3. Current state

Verified by reading `main` (685815a):
- F1 `AddTaskForm` (`form` named "Add task"; `TextInput` "Title", `TextArea` "Notes", `Selector` "Priority", `DateInput` "Due date", submit "Add task"; empty title shows "Title is required"; focus returns to Title after add).
- F2 `TaskList` (`ul` named "Tasks"; each row a `CheckboxInput` labelled with the title; focus is kept on a checkbox that moves when toggled).
- F3 `TaskItemActions` (buttons `Edit “<title>”`, `Delete “<title>”`; edit `Dialog` with form "Edit task", Cancel/Save, Escape closes, focus back to Edit; `AlertDialog` "Delete task?" with Delete; focus to the composer's Title after delete).
- F4 (`src/features/filter/*`) and F5 (`src/features/persistence/*`) are stubs: the filter bar and the banner render `null`, `createLocalStorageTaskStorage` keeps nothing.
- F6: `src/features/empty/TaskEmptyState.tsx` is a stub rendering `null`; `src/features/accessibility/` and `e2e/tasks.spec.ts` do not exist.
- `TaskScreen` renders `TaskList` when `visibleTasks` is non-empty, otherwise `<TaskEmptyState totalCount={store.tasks.length} filter={store.filter} />`.
- `playwright.config.ts` (shared) has one project, `chromium` (Desktop Chrome), and starts the dev server with `VITE_FF_TASKS=true`. CI installs only Chromium.
- jsdom lacks `HTMLDialogElement.showModal`/`close`; `src/features/edit/editFlow.test.tsx` stubs them in its own `beforeAll`. F6 does the same in its own test file (it may not import from another feature's directory, and `src/test/` is shared).
- `src/tasks/contractDoc.test.ts` requires every non-test file under `src/features/` to be owned in the contract, so F6 adds no helper modules; helpers live inside the test files.

## 4. Proposed design

### Overview
```
src/features/empty/TaskEmptyState.tsx        real body (AC8, AC4)
src/features/empty/TaskEmptyState.test.tsx   component test (AC8)
src/features/accessibility/TaskScreen.a11y.test.tsx
    real TaskScreen + in-memory storage, user-event keyboard only
    AC1 every action · AC3 names · AC4 empty state · focus after each action
e2e/tasks.spec.ts  (runs in every Playwright project)
    AC7 journey · AC4 first visit · AC1 keyboard-only run · AC2 focus ring on every tab stop
    AC3 names in the real accessibility tree · AC5 375px layout
```

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `src/features/empty/TaskEmptyState.tsx` | replace stub | modified |
| `src/features/empty/TaskEmptyState.test.tsx` | tests | new |
| `src/features/accessibility/TaskScreen.a11y.test.tsx` | tests | new |
| `e2e/tasks.spec.ts` | tests | new |

### APIs and contracts
Unchanged. `TaskEmptyState(props: TaskEmptyStateProps)` keeps its name and signature.

### Behaviour in detail

**`TaskEmptyState`.** Renders a visible message without a heading element (so it does not disturb the heading outline under "Tasks"), wrapped in `role="status"` so a filter that empties the list is announced:
- `totalCount === 0`: "No tasks yet" and "Add your first task above."
- otherwise, with a non-blank `filter.query`: "No tasks match" and `Nothing matches “<query>”.`; with a blank query: "No tasks match" and "Try another filter."
Use Astryx's `EmptyState` if 0.7.17 exports one, otherwise `Text` inside a `VStack`. The query is rendered as a React text child.

**jsdom screen test** (`TaskScreen.a11y.test.tsx`). A `renderScreen(tasks)` helper renders `TaskScreen` with `{ load: () => tasks, save: vi.fn() }`, `createId` counting up, fixed `now`. `userEvent.setup()`; only `user.tab()`, `user.tab({ shift: true })`, `user.keyboard('{Enter}' | ' ' | '{Escape}' | text)`. A `tabTo(name)` helper presses Tab (or Shift+Tab) until `document.activeElement` has that accessible name, failing after 50 presses, so tests prove reachability by keyboard rather than calling `focus()`.
- *Add*: Tab to Title, type, Tab to Notes…, Enter on "Add task" → row appears, focus in Title. Empty title + Enter → "Title is required".
- *Complete*: Tab to the row's checkbox, Space → checked, row moves to the completed group, focus stays on it.
- *Edit*: Tab to `Edit “…”`, Enter → dialog; change Title, Enter → saved, focus on Edit. Again, Escape → unchanged, focus on Edit.
- *Delete*: Tab to `Delete “…”`, Enter → alert dialog; Escape keeps the task; again, Tab to Delete in the dialog, Enter → removed, focus in the composer's Title.
- *Filter / search / clear*: drive F4's controls with Tab, Space/Enter/arrow-free keys only (Enter/Space on buttons or radios, typing in the search box); assert the visible rows; clear completed with Enter removes only completed tasks and focus lands on a control inside the task region.
- *Shift+Tab*: from "Add task" Shift+Tab reaches Due date, then Priority (reverse order works).
- *Names (AC3)*: with tasks present and with each dialog open, every `button`, `textbox`, `searchbox`, `checkbox`, `combobox`, `radio`, `spinbutton` and `listbox` in the document satisfies `toHaveAccessibleName(expect.stringMatching(/\S/))`, and button names are unique per row.
- *Empty state (AC4)*: empty storage → "No tasks yet" shown, no list; a search with no match → "No tasks match".

**Playwright spec** (`e2e/tasks.spec.ts`). Project-agnostic: it reads nothing about the project, so the same tests run in desktop and mobile. Each test starts at `page.goto('/')` in a fresh context. Helpers: `tasks = page.getByRole('main').getByRole('region', { name: 'Tasks' })`, `tabTo(page, name)` like the jsdom one, using `page.keyboard.press('Tab')` and checking `document.activeElement`'s accessible name via `expect(page.locator(':focus')).toHaveAccessibleName(...)` polling.
- *AC4 first visit*: `localStorage` is empty; "No tasks yet" visible; no list.
- *AC7 journey*: keyboard-only add "Buy milk", Space on its checkbox, `page.reload()`, the checkbox "Buy milk" is still checked; and `localStorage['todo.tasks.v1']` holds one completed task.
- *AC1 keyboard run*: one test performs add, complete, edit (Escape and Save), delete (Escape and confirm), filter, search, clear completed with `page.keyboard` only, asserting the screen after each step. (Duplicates part of the jsdom test on purpose: jsdom does not run Astryx's real `<dialog>` focus handling.)
- *AC2 focus indicator*: with two tasks (one complete) seeded by the keyboard, walk the tab order from the top of the task region to the last control. For each stop *i*: screenshot a clip of its bounding box padded by 4px while focused; press Tab; screenshot the same clip unfocused; assert the two images differ (`Buffer.compare !== 0`). Screenshots use `animations: 'disabled'` and the default hidden caret, so only the focus indicator changes. Repeat inside the edit dialog and the delete alert. Pixel comparison catches any indicator (outline, ring, border) whatever element draws it, including a visually hidden native checkbox whose ring is drawn by a sibling.
- *AC3 names*: as in jsdom, but in Chromium's accessibility tree: for each role above, every match `toHaveAccessibleName(/\S/)`; with the edit dialog open and with the delete alert open.
- *AC5 375px*: `page.setViewportSize({ width: 375, height: 812 })` (so it holds in every project, mobile or not), seed tasks with a long unbroken title and notes, then assert `document.documentElement.scrollWidth <= clientWidth`; every control's bounding box lies within `0..375` horizontally and is at least 24×24 CSS px (WCAG 2.2 target size minimum); open each dialog and repeat. Then run the keyboard journey at that width.

### Error handling and edge cases
- A long unbroken title at 375px (AC5) is the likeliest overflow; it is seeded on purpose.
- Task text with `<b>` in the empty-state query renders literally (AC8).
- A save failure is F5's banner; F6 does not test it beyond its controls having names when shown (the jsdom test renders once with a throwing `save` to show the banner and checks its Dismiss button's name).

## 5. Key decisions
| # | Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|---|
| 1 | How to check names (AC3) | `toHaveAccessibleName` over every interactive role, jsdom and Chromium | no new dependency; Chromium's computation is the "devtools accessibility tree" | axe-core: needs `package.json`, a shared file |
| 2 | How to check visible focus (AC2) | screenshot clip focused vs unfocused differs | works whichever element draws the ring; no knowledge of Astryx's CSS | reading `outline`/`box-shadow` of the focused element: misses rings drawn on a wrapper or sibling |
| 3 | Two test layers | jsdom for breadth and speed, Playwright for real focus, layout and reload | jsdom has no layout, no `:focus-visible` paint and stubbed dialogs | Playwright only: slower, harder to debug per action |
| 4 | 375px check | `setViewportSize` inside the test | AC5 holds in every project, independent of P1 | relying on the mobile project's viewport alone |
| 5 | Mobile project (AC6) | prerequisite P1 adds it to `playwright.config.ts` | the config is shared (contract §3; issue: "not the shared files") | `test.use({ viewport, isMobile })` inside F6's spec: meets the intent but not "projects"; offered as the fallback in §11 question 1 |
| 6 | Empty state announced | `role="status"` | a search that empties the list is otherwise silent to screen readers | plain text |

## 6. Implementation tasks

### T1. `TaskEmptyState` (S)
- Goal: AC8, and the visible part of AC4.
- Changes: `src/features/empty/TaskEmptyState.tsx` (drop the stub comment line, keep the export).
- Done when: `TaskEmptyState.test.tsx` passes: totalCount 0 → "No tasks yet"; totalCount 3 with query "xyz" → "No tasks match" and “xyz”; blank query → "Try another filter."; a query `<b>x</b>` appears literally; the block has role `status`.
- Depends on: none (can start before F4/F5).

### T2. jsdom screen test (M)
- Goal: AC1, AC3, AC4 in jsdom.
- Changes: `src/features/accessibility/TaskScreen.a11y.test.tsx` (with its own `<dialog>` stubs in `beforeAll`, copied from `editFlow.test.tsx`).
- Done when: the tests in §4 pass against merged F1–F5.
- Depends on: T1; F4 (#11) and F5 (#12) merged.

### T3. Playwright spec (M)
- Goal: AC1, AC2, AC3, AC4, AC5, AC7 in Chromium.
- Changes: `e2e/tasks.spec.ts`.
- Done when: `npm run test:e2e` passes locally (stop any running dev server first, or start it with `VITE_FF_TASKS=true`) and in CI.
- Depends on: T1; F4 and F5 merged.

### T4. Mobile project (AC6)
- Goal: `npm run test:e2e` runs and passes in desktop and mobile projects.
- Changes: none in F6. Verify after P1 lands that `e2e/tasks.spec.ts` passes in the `mobile` project too; if P1 is not available and the gate chooses the fallback (§11 question 1), wrap the spec's tests in `test.describe` blocks for desktop and for `test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })`.
- Depends on: P1 or the gate's answer.

### Sequence
T1, then T2 ∥ T3, then T4. About 2–3 days once F4 and F5 are merged.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T2, T3 | jsdom screen + e2e | each action done with keys only; screen state and focus after each |
| AC2 | T3 | e2e (pixel) | every tab stop, on the screen and in both dialogs, looks different when focused |
| AC3 | T2, T3 | jsdom + e2e | every interactive role has a non-blank accessible name, with and without dialogs |
| AC4 | T1, T2, T3 | component + jsdom + e2e | empty storage → "No tasks yet" |
| AC5 | T3 | e2e at 375px | no horizontal scroll; controls inside the viewport, ≥ 24px, journey works |
| AC6 | T3, T4 | CI | all e2e tests green in desktop and mobile projects |
| AC7 | T3 | e2e | add, complete, reload → still complete; saved under `todo.tasks.v1` |
| AC8 | T1 | component | both messages, query as text, role status |
| AC9 | all | CI + `contractDoc.test.ts` | only F6's files in the diff; five checks pass |

Regression: `e2e/frame.spec.ts`, `TaskScreen.composition.test.tsx` and every feature's tests must stay green. The frame spec's "no console errors" test now also covers a rendered empty state.

## 8. Rollout and rollback
- **Feature flag:** `VITE_FF_TASKS` (build-time env var, on only when exactly `true`, off by default; contract §6). It already gates the whole task screen, so F6 adds no flag; the only runtime change, `TaskEmptyState`, is invisible while it is off. `playwright.config.ts` turns it on for the e2e tests.
- No migrations; no data change.
- Rollback: revert the pull request; the stub returns and the tests go.
- After F6 merges, F1–F6 are done; contract §6's separate issue then turns the flag on for production and removes it.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 1. F4/F5 not merged when this is picked up | High today | T2/T3 cannot pass | issue says F1–F5 first; T1 can start now; the developer waits for #11 and #12 |
| 2. A test exposes a fault in F1–F5 (e.g. a control with no focus ring, overflow at 375px) | Medium | AC fails here, but the fix is not F6's | the developer files an issue against the owning feature and completes the step as needing a person, rather than editing their files or weakening the test |
| 3. Pixel comparison is flaky (font loading, transitions) | Medium | flaky AC2 | wait for `document.fonts.ready`; `animations: 'disabled'`; compare the same clip twice unfocused to prove stability before relying on it |
| 4. Mobile project not added (P1) | Medium | AC6 unmet | §11 question 1; fallback in T4 |
| 5. Astryx `<dialog>` focus trap differs between jsdom stubs and Chromium | Low | jsdom passes, browser fails | the e2e keyboard run covers dialogs in Chromium |

## 10. Technical debt
None taken on. The `<dialog>` stubs are now copied in two feature test files (F3's and F6's) because `src/test/` is shared; follow-up 2 moves them there.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | AC6 needs a `mobile` Playwright project, but `playwright.config.ts` is shared. Open prerequisite P1 to add it (a Chromium device, since CI installs only Chromium, e.g. `{ name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } } }`, and rename `chromium` to `desktop`), or accept the fallback of a mobile `describe` block inside `e2e/tasks.spec.ts`? | plan gate / product owner | AC6 only | P1 is opened and merged first |
| 2 | Exact names of F4's status, search and clear-completed controls | #11's planner | no | found by role and a name pattern; the developer uses F4's merged names |

## 12. Follow-ups
- **P1 (prerequisite):** shared-file issue adding the `mobile` project to `playwright.config.ts` (question 1).
- 2. Move the jsdom `<dialog>` stubs into `src/test/setup.ts` (shared) and delete the copies.
- 3. Contract §6: turn `VITE_FF_TASKS` on for production and remove it once F6 merges.
