# Technical Plan: #30 Clear completed tasks in one go

**Ticket:** #30   **Spec:** [docs/specs/30-clear-completed-tasks.md](../specs/30-clear-completed-tasks.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md) (F4)   **Status:** Draft

## 1. Summary

Fill in two of F4's three stubs in `src/features/filter/`: the pure function `clearCompleted`, and a first version of `TaskFilterBar` that renders one Astryx `Button`, "Clear completed (N)". With no completed task the button gets `isDisabled`, which Astryx renders as `aria-disabled="true"` (not the native `disabled` attribute), so it stays focusable and swallows clicks, Enter and Space. Because the button never unmounts, focus stays on it after a clear, with no focus code of our own. The store, reducer and `TaskScreen` already wire `completedCount` and `onClearCompleted` through, so nothing outside F4's files changes, and the screen already sits behind `VITE_FF_TASKS`.

## 2. Requirements

### User story
See the spec.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | `clearCompleted` keeps the active tasks in order; never mutates; same array when none completed | issue |
| AC2 | Bar shows "Clear completed (N)"; with N = 0 it stays, `aria-disabled="true"`, and does nothing | issue |
| AC3 | Mouse, Enter or Space call `onClearCompleted` once; on the screen, completed go, active stay | issue |
| AC4 | After a clear, focus stays on the button, now "Clear completed (0)" and `aria-disabled` | issue |
| AC5 | The two named test files cover AC1–AC4; existing tests and CI pass | issue |
| AC6 | Accessible name equals the visible text; focusable while `aria-disabled`; a no-op clear saves nothing | derived (contract §4) |

### Non-functional requirements
- Accessibility (contract §4): the control has an accessible name (its visible text), works by keyboard, shows a visible focus, and focus is not lost after the action.
- No new dependencies; no change to any shared file (contract §3).

### Out of scope
See the spec. In particular `filterTasks.ts` stays a stub, and the bar renders no status or search control yet; `props.filter` and `props.onFilterChange` go unused for now.

### Assumptions
- The button text is exactly `Clear completed (N)` with N in digits, as the issue writes it. No pluralisation or "task(s)" wording.
- "Stays in place" means the button is rendered for every N, including 0, at the same position in the bar.

## 3. Current state

Verified by reading `main` (685815a):
- `src/features/filter/clearCompleted.ts`: stub returning `tasks`. `TaskFilterBar.tsx`: stub rendering `null`. `filterTasks.ts`: stub (not touched here). No F4 tests exist.
- `src/tasks/props.ts`: `TaskFilterBarProps { filter: TaskFilter; onFilterChange(filter: Partial<TaskFilter>): void; completedCount: number; onClearCompleted(): void }`.
- `src/tasks/useTasks.ts`: `completedCount = tasks.filter(t => t.completed).length` (over all tasks, not the visible ones); `clearCompleted()` dispatches `{ type: 'clearCompleted' }`. The save effect saves only when the `tasks` array identity changes.
- `src/tasks/taskReducer.ts`: `clearCompleted` → `withTasks(state, clearCompleted(state.tasks))`, which keeps the state object when the function returns its input, so a no-op clear neither re-renders nor saves.
- `src/tasks/TaskScreen.tsx`: renders `<TaskFilterBar filter onFilterChange completedCount onClearCompleted />` unconditionally, between `AddTaskForm` and the list, so the bar (and the button) stays mounted whether or not the list is empty.
- `@astryxdesign/core` 0.7.17 `Button` (`node_modules/@astryxdesign/core/src/Button/Button.tsx`): `isDisabled` sets `aria-disabled` and never the native `disabled` attribute (comment and code around lines 893–906 and 1185/1216); its `handleClick` calls `preventDefault`/`stopPropagation` and skips `onClick` when disabled; its `handleKeyDown` cancels Enter and Space when disabled. `label` is the visible text and the accessible name. Disabled styling is `opacity: 0.5`; focus outline comes from `focusOutlineProps.focusVisible`.
- `src/test/taskFixtures.ts`: `makeTask(overrides)`. Screen-level test pattern to follow: `src/features/complete/TaskScreen.toggle.test.tsx` and `src/features/edit/editFlow.test.tsx` (real `TaskScreen`, in-memory `TaskStorage` with `vi.fn()` save, `userEvent.setup()`).
- `src/tasks/TaskScreen.composition.test.tsx` mocks `TaskFilterBar` and checks the props `TaskScreen` passes; `src/tasks/contractDoc.test.ts` checks every non-test file under `src/features/` is owned and exports what the contract names. New `*.test.ts(x)` files in `src/features/filter/` are allowed (contract §2).

## 4. Proposed design

### Overview
```
TaskScreen ── completedCount, onClearCompleted ──> TaskFilterBar (F4)
                                                     [Clear completed (N)]   Astryx Button, type="button"
                                                       N > 0: onClick → onClearCompleted()
                                                       N = 0: isDisabled → aria-disabled="true", click/Enter/Space ignored
onClearCompleted → useTasks.clearCompleted → reducer 'clearCompleted' → clearCompleted(tasks) (F4)
                 → new array → save → completedCount 0 → same button re-renders "(0)", aria-disabled, still focused
```

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `src/features/filter/clearCompleted.ts` | real body; drop the "Stub owned by" line | modified (stub) |
| `src/features/filter/TaskFilterBar.tsx` | render the Clear completed button; drop the "Stub owned by" line | modified (stub) |
| `src/features/filter/clearCompleted.test.ts` | unit tests (AC1) | new |
| `src/features/filter/TaskFilterBar.test.tsx` | component and screen tests (AC2–AC4, AC6) | new |

### APIs and contracts
Unchanged; signatures are the contract's:
```ts
clearCompleted(tasks: Task[]): Task[]
TaskFilterBar(props: TaskFilterBarProps): ReactNode
```

### Behaviour in detail
- **`clearCompleted`**: if no task is completed (`!tasks.some(t => t.completed)`), return `tasks` itself. Otherwise return `tasks.filter(t => !t.completed)`: a new array, the same task objects, original order. Never mutate.
- **`TaskFilterBar`**: render a container (an Astryx `HStack`, so the later status/search issue adds controls beside it) holding
  `<Button type="button" variant="secondary" label={`Clear completed (${completedCount})`} isDisabled={completedCount === 0} onClick={onClearCompleted} />`.
  - Pass `onClearCompleted` through a handler that ignores the event (`onClick={() => onClearCompleted()}`), so the prop is called with no arguments, as its signature says.
  - Do not use `clickAction` (it adds a pending state) or the native `disabled` attribute (it would drop focus to `body` the moment N becomes 0, breaking AC4).
  - Do not add `aria-label`: `label` already gives the visible text as the name (AC6).
  - `filter` and `onFilterChange` are not used yet. Destructure only what is used; the unused props need no `void` because they are simply not destructured.
- **Focus after clear (AC4)**: nothing to code. The button stays mounted at the same position (the bar is always rendered by `TaskScreen`, and the button for every N), it is not natively disabled, and React updates its label in place, so the focused element stays focused. The test proves it.

### Error handling and edge cases
- No tasks at all: N = 0, button shown, `aria-disabled`.
- Every task completed: the list empties and `TaskScreen` shows `TaskEmptyState` (an F6 stub today, renders nothing); the button keeps focus.
- Choosing the disabled button: Astryx swallows the event; and even if it reached the store, `clearCompleted` would return the same array, so nothing saves (two layers).
- `completedCount` counts all tasks, not only the visible ones, so once a filter exists, "Clear completed" also clears completed tasks hidden by a search. That matches the issue ("removes every completed task") and the store's existing count.
- A storage failure on save is F5's banner; F4 does nothing extra.

## 5. Key decisions
| # | Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|---|
| 1 | How the button is disabled | Astryx `isDisabled` (renders `aria-disabled`, blocks click/Enter/Space) | the issue asks for `aria-disabled="true"`; it keeps the button focusable, so focus survives the clear without extra code | native `disabled`: focus falls to `body` (AC4); hand-rolled `aria-disabled` + guard: duplicates what Astryx already does |
| 2 | Where focus goes after a clear | stays on the button | the issue says so; the button never unmounts | moving focus to the composer like F3's delete: the issue rules it out |
| 3 | Confirmation before clearing | none | the issue excludes it | an `AlertDialog`: out of scope |
| 4 | No-op detection in `clearCompleted` | `some` check, then `filter` | returns the same array (contract §4) without comparing lengths after the fact | always `filter`: a new array every time would save on a no-op |

No ADR: nothing here is hard to reverse or crosses a boundary.

## 6. Implementation tasks

### T1. `clearCompleted` (S)
- Goal: the pure function behaves as §4 says.
- Changes: `src/features/filter/clearCompleted.ts`.
- Done when: AC1 tests pass.
- Tests (`clearCompleted.test.ts`, with `makeTask`): removes only completed tasks and keeps the active ones in their order (e.g. active, done, active, done → active, active); returns the same array (`toBe`) when none is completed, and for `[]`; returns `[]` when all are completed; does not mutate the input (`Object.freeze` the array and each task, or compare to a `structuredClone` taken before); the kept tasks are the same objects.
- Depends on: none.

### T2. The Clear completed button (S)
- Goal: AC2, AC3 (callback half), AC6.
- Changes: `src/features/filter/TaskFilterBar.tsx`.
- Details: §4 "TaskFilterBar".
- Done when: the component tests below pass.
- Tests (`TaskFilterBar.test.tsx`, render `TaskFilterBar` alone with `filter={DEFAULT_FILTER}`, `onFilterChange={vi.fn()}`, an `onClearCompleted` spy):
  - N = 2: `getByRole('button', { name: 'Clear completed (2)' })` exists, has no `aria-disabled="true"`; `user.click` calls the spy once with no arguments; focusing it and `user.keyboard('{Enter}')` calls it once; `user.keyboard(' ')` calls it once (fresh render per case, or reset the spy).
  - N = 0: `getByRole('button', { name: 'Clear completed (0)' })` exists with `aria-disabled="true"` and no `disabled` attribute; it is reachable with `user.tab()` (`toHaveFocus`); click, Enter and Space each leave the spy uncalled.
- Depends on: none (parallel with T1).

### T3. Screen-level clear and focus (S)
- Goal: AC3 (screen half), AC4, AC6 (no-op save).
- Changes: `src/features/filter/TaskFilterBar.test.tsx` only.
- Details: follow `TaskScreen.toggle.test.tsx`: `TaskStorage` whose `load` returns `makeTask` tasks (two active, two completed, distinct ids/titles/`createdAt`) and whose `save` is `vi.fn()`; render `<TaskScreen storage createId now />`; query rows inside `getByRole('list', { name: 'Tasks' })` by their checkboxes.
- Done when: tests pass with T1 and T2 in place.
- Tests:
  - Clicking "Clear completed (2)" leaves only the two active tasks listed, and the last `save` call is exactly the two active tasks in stored order.
  - Same flow with the keyboard: Tab to the button (or `focus()` it), press Enter; afterwards `getByRole('button', { name: 'Clear completed (0)' })` has focus and `aria-disabled="true"`, and `document.activeElement` is not `body`.
  - With only active tasks loaded, the button reads "(0)"; clicking it does not call `save` and the list is unchanged.
- Depends on: T1, T2.

### Sequence
T1 ∥ T2, then T3. Total: three S tasks, about one day.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1 | unit | order kept, completed removed, same array on no-op, no mutation |
| AC2 | T2 | component | label with N; `aria-disabled="true"` at 0; no call on click/Enter/Space at 0 |
| AC3 | T2, T3 | component + screen | spy called once by click, Enter, Space; on the screen, completed gone, active listed and saved |
| AC4 | T3 | screen | after a clear, the "(0)" button has focus and is `aria-disabled` |
| AC5 | all | CI | the two test files exist; `contractDoc.test.ts`, `TaskScreen.composition.test.tsx`, `taskReducer.test.ts` stay green |
| AC6 | T2, T3 | component + screen | found by role and visible name; Tab reaches it at 0; no save on a no-op clear |

Regression risk: low. `TaskScreen.composition.test.tsx` mocks `TaskFilterBar`, and `taskReducer.test.ts` mocks `clearCompleted`, so neither depends on the new bodies. Other features' screen tests (`TaskScreen.toggle.test.tsx`, `editFlow.test.tsx`, `addFlow.test.tsx`) will now see one more button on the screen; they query by specific names or inside the list, so they should be unaffected. Run the full suite to confirm.

## 8. Rollout and rollback
- **Feature flag:** `VITE_FF_TASKS` (build-time env var, on only when exactly `true`, off by default; contract §6). It already gates the whole task screen, and the issue says this work adds no flag of its own. With it off, nothing F4 renders reaches users.
- No migrations, no data shape change, no storage key change.
- Rollback: revert the pull request; the stubs return.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 1. A later Astryx version renders native `disabled` for `isDisabled`, so focus drops after a clear | Low (version pinned at 0.7.17) | AC4 fails | T2's "no `disabled` attribute" and T3's focus assertions catch it on upgrade |
| 2. The later status/search issue restructures the bar and moves or remounts the button | Medium | focus lost after a clear | T3's focus test guards it; keep the button a stable child of the bar |
| 3. jsdom/user-event Space on a button needs keyup to fire click | Low | flaky keyboard test | use `user.keyboard(' ')` (presses and releases), as user-event does by default |

## 10. Technical debt
None taken on. `filter`/`onFilterChange` stay unused in `TaskFilterBar` until the status/search issue; that is planned scope, not debt.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | Should the label say "task"/"tasks" or pluralise, or is "Clear completed (N)" final? | product owner | no | "Clear completed (N)", as the issue writes it |

## 12. Follow-ups
1. The status and search issue (F4's other half): `filterTasks` and the bar's status and search controls, beside this button.
2. F6's screen-level accessibility tests should include the Clear completed button's focus behaviour across the whole screen.
