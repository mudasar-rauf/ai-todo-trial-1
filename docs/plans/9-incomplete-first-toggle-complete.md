# Technical Plan: #9 Show incomplete tasks first, and toggle a task complete

**Ticket:** #9   **Spec:** [docs/specs/9-incomplete-first-toggle-complete.md](../specs/9-incomplete-first-toggle-complete.md)   **Status:** Draft

## 1. Summary

Fill in F2's three stubs in `src/features/complete/`: the pure functions `sortTasks` (incomplete first, newest first within each group) and `toggleTask` (flip `completed`, stamp `updatedAt`), and the `TaskList` component, which renders each task as a list row with an Astryx `CheckboxInput`, the notes, a priority `Badge`, the due date, and `renderActions(task)`. Nothing outside F2's files changes: `useTasks` already computes `visibleTasks = sortTasks(filterTasks(...))`, the reducer already routes `toggle` to `toggleTask`, and `TaskScreen` already renders `TaskList` behind `VITE_FF_TASKS`.

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Incomplete above completed; newest first within each group | ticket |
| AC2 | Checking moves a task to the completed group; unchecking moves it back | ticket |
| AC3 | Each checkbox reachable with Tab, toggles with Space | ticket |
| AC4 | Row shows title, notes when present, priority badge unless none, due date when set | ticket |
| AC5 | Only F2's files change; behind `VITE_FF_TASKS`; CI passes | derived |
| AC6 | Contract rules: no mutation, same array for unknown id, `updatedAt = now`, accessible names, text not HTML | derived |

### Non-functional requirements
- Accessibility (contract section 4): every checkbox has an accessible name and a visible focus; keyboard alone works.
- Dates: `dueDate` is `'YYYY-MM-DD'` and must never shift by time zone.

### Out of scope
F1, F3–F6, all shared files (contract section 3), any contract change, and drag-to-reorder or any other ordering.

### Assumptions
- "Newest" is the latest `createdAt`. ISO 8601 strings from `new Date().toISOString()` (the store's `now`) compare correctly as strings. Equal `createdAt` keeps input order (stable sort).
- "Unless priority is none": the contract has no `'none'` priority, so all three values show a badge (see open question 1).
- The due date is shown as a `<time dateTime="YYYY-MM-DD">` element with a readable label "Due <date>", formatted in UTC so it never shifts.

## 3. Current state

Verified by reading the files:
- `src/features/complete/sortTasks.ts`, `toggleTask.ts` and `TaskList.tsx` are stubs (`return tasks`, `return null`).
- `src/tasks/props.ts` `TaskListProps`: `tasks` (already filtered and sorted), `onToggle(id)`, `renderActions(task)`.
- `src/tasks/useTasks.ts:68` dispatches `{ type: 'toggle', id, now: now() }`; `src/tasks/taskReducer.ts` hands it to `toggleTask` and keeps state identity when it returns its input. `useTasks.ts:77` memoises `visibleTasks = sortTasks(filterTasks(tasks, filter))`.
- `src/tasks/TaskScreen.tsx` renders `TaskList` when `visibleTasks` is non-empty and passes `store.toggleTask` and a `renderActions` that renders F3's `TaskItemActions`.
- `src/test/taskFixtures.ts` `makeTask(overrides)` builds a full `Task` for tests.
- Astryx 0.7.17 (read from the package's `.d.ts`): `CheckboxInput` (`label: string`, `isLabelHidden`, `description`, `value: boolean | 'indeterminate'`, `onChange(checked, e)`) renders a native `<input type="checkbox">`, so Tab and Space work natively; `Badge` (`label`, `variant`: `neutral`, `info`, `warning`, `error`, ...); `Text`, `HStack`, `VStack`.

## 4. Proposed design

### Overview
```
useTasks.tasks ──filterTasks (F4)──▶ sortTasks (F2) ──▶ visibleTasks ──▶ TaskList (F2)
                                                                          │ checkbox onChange
TaskScreen ◀── store.toggleTask(id) ◀────────────── onToggle(task.id) ◀───┘
  └─ dispatch toggle ─▶ taskReducer ─▶ toggleTask (F2) ─▶ new tasks ─▶ re-sorted, row moves group
```

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `src/features/complete/sortTasks.ts` | Replace stub body | modified |
| `src/features/complete/toggleTask.ts` | Replace stub body | modified |
| `src/features/complete/TaskList.tsx` | Replace stub body | modified |
| `src/features/complete/sortTasks.test.ts` | Unit tests | new |
| `src/features/complete/toggleTask.test.ts` | Unit tests | new |
| `src/features/complete/TaskList.test.tsx` | Component tests | new |

### APIs and contracts (unchanged signatures)
```ts
sortTasks(tasks: Task[]): Task[]                         // new array; never mutates input
toggleTask(tasks: Task[], id: string, now: string): Task[] // same array for unknown id
TaskList(props: TaskListProps): ReactNode
```

### Row markup
```
<ul aria-label="Tasks">
  <li>                                   one per task, key = task.id
    CheckboxInput label={task.title} value={task.completed}
                  description={task.notes || undefined}
                  onChange={() => onToggle(task.id)}
    Badge label="High|Medium|Low priority" variant=error|warning|neutral
    <time dateTime={dueDate}>Due 14 Mar 2026</time>   only when dueDate !== null
    {renderActions(task)}
  </li>
</ul>
```
- The checkbox's visible label is the title, so its accessible name is the title (contract: "preferably a visible label"). A completed row gets a visual cue (for example muted or struck-through title) but the checked box carries the state.
- Notes go in `description` only when non-empty, so an empty `<p>` never renders.
- Badge text spells out "priority" so it reads well to a screen reader. Variants: high → `error`, medium → `warning`, low → `neutral`.
- Due date: format with `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })` applied to `new Date(dueDate + 'T00:00:00Z')`. The `dateTime` attribute carries the raw value for tests and assistive tech.
- All task text goes through React text nodes or Astryx string props; no `dangerouslySetInnerHTML`.

### Error handling and edge cases
- Unknown id in `toggleTask`: return the input array (no re-render, no save).
- Equal `createdAt`: stable order (`Array.prototype.toSorted` / `[...tasks].sort` is stable in ES2019+).
- Empty `tasks`: `TaskScreen` shows F6's empty state instead, but `TaskList` should still render an empty list without crashing.
- Toggling while a filter is on (for example "active"): the task may leave the visible list; that is F4's and the store's behaviour, not F2's.

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Checkbox's accessible name | The task title as its visible label | Visible label, unique per row, what the person sees | Hidden "Mark X complete" label: duplicates the title visually or hides the label |
| List element | Native `<ul aria-label="Tasks">`/`<li>` with Astryx stacks inside | Simple, semantic, no reliance on Astryx `ListItem`'s label/description layout | Astryx `List`/`ListItem`: its slot model fits the checkbox and badge less clearly; not verified for nested controls |
| Sort key | `completed` then `createdAt` descending, stable | Matches AC1 exactly; toggling keeps a task's age | `updatedAt`: editing a task would reorder it, which the issue does not ask for |
| Due date display | `<time>` with UTC-formatted text | No time-zone shift; machine-readable value | Raw `YYYY-MM-DD`: less readable |

No decision here is significant enough for an ADR.

## 6. Implementation tasks

### T1. `sortTasks` and `toggleTask` (S)
- Goal: the pure ordering and toggling logic.
- Changes: `src/features/complete/sortTasks.ts`, `toggleTask.ts`, and their tests.
- Details: `sortTasks` copies, then sorts by `completed` (false first), then `createdAt` descending. `toggleTask` maps to a new array with `{ ...task, completed: !task.completed, updatedAt: now }` for the matching id; return the input array when no task matches. Keep the stub comment line removed and the exported names and signatures exactly as they are.
- Done when: AC1, AC2 (logic) and AC6 (purity) tests pass.
- Tests: see section 7.
- Depends on: none.

### T2. `TaskList` (M)
- Goal: render the rows and wire the checkbox to `onToggle`.
- Changes: `src/features/complete/TaskList.tsx`, `TaskList.test.tsx`.
- Details: as in "Row markup" above. Use `CheckboxInput` from `@astryxdesign/core/CheckboxInput`, `Badge` from `@astryxdesign/core/Badge`, and `HStack`/`VStack`/`Text` as the neighbouring code does (`@astryxdesign/core/<Name>` imports). Call `renderActions(task)` once per row. Tests use `@testing-library/user-event` for Tab and Space.
- Done when: AC3, AC4 and AC6 (accessibility, text) tests pass; `npm run typecheck`, `lint`, `test`, `build` pass.
- Tests: see section 7.
- Depends on: none (can run in parallel with T1).

### T3. Check the screen end to end (S)
- Goal: confirm AC2 in the real app.
- Changes: none to code; F2's tests only.
- Details: add one test in `TaskList.test.tsx` or a new `src/features/complete/TaskScreen.toggle.test.tsx` that renders `TaskScreen` (imported from `src/tasks/`) with an in-memory `TaskStorage` and two tasks, toggles one with the keyboard, and asserts the row order changes. Then run `VITE_FF_TASKS=true npm run dev` and toggle a task by hand.
- Done when: the test passes and CI (`typecheck`, `lint`, `test`, `build`, `test:e2e`) is green.
- Depends on: T1, T2.

### Sequence
T1 and T2 in parallel, then T3. Total: S + M + S, about a day and a half.

## 7. Test strategy
| AC | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1 | unit (`sortTasks.test.ts`) | mixed list → incomplete first, each group newest `createdAt` first; equal `createdAt` keeps input order; input array not mutated |
| AC2 | T1, T3 | unit + integration | `toggleTask` flips `completed` both ways and sets `updatedAt`; in `TaskScreen`, checking a task moves its row below the incomplete ones and unchecking moves it back |
| AC3 | T2 | component (`TaskList.test.tsx`) | `user.tab()` focuses each checkbox in order; `user.keyboard(' ')` calls `onToggle` with that task's id; mouse click does too |
| AC4 | T2 | component | title shown; notes shown only when non-empty; badge "High priority"/"Medium priority"/"Low priority"; `<time dateTime="2026-03-14">` present only when `dueDate` is set; checkbox `checked` matches `completed` |
| AC5 | all | CI | `git diff --name-only main` lists only F2's files plus this spec and plan; `contractDoc.test.ts` still passes |
| AC6 | T1, T2 | unit + component | unknown id returns the same array (`toBe`); input not mutated (deep-frozen fixtures or compare to a copy); a title like `<b>x</b>` renders as literal text; every checkbox has an accessible name (`getByRole('checkbox', { name: title })`) |

Regression risk: `TaskScreen.test.tsx` and `useTasks.test.tsx` use the real F2 functions. Today `sortTasks` returns its input; after this change order differs, so run the whole suite and fix only F2's tests if one depends on order (shared tests may not be edited; if one breaks, stop and raise it).

## 8. Rollout and rollback
Feature flag: `VITE_FF_TASKS`, a build-time environment variable already wired in `src/flags.ts`, on only when exactly `true`, off by default (contract section 6). With it off, the task screen does not render, so this change is invisible in production. No migration, no storage change (`completed` and `updatedAt` already exist on `Task`). Rollback: revert the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Astryx `CheckboxInput` wraps the input so `onChange` or Space behaves unexpectedly in jsdom | Low | AC3 test flaky | Assert via `getByRole('checkbox')`; if jsdom misbehaves, check in Playwright by hand and note it |
| A shared test assumes the stub's unsorted order | Low | CI red | Run the full suite early in T1; raise an issue rather than editing shared tests |
| Locale-dependent due-date text makes tests brittle | Medium | flaky AC4 test | Assert on the `dateTime` attribute, not the formatted text |

## 10. Technical debt
None encountered or taken on.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | AC4 says "a priority badge unless priority is none", but the contract's `Priority` has no `'none'`. Should a "none" priority exist? | Product owner | Nothing | Every task has low/medium/high, so every row shows a badge. Adding "none" is a contract change for its own issue (contract section 5); `TaskList` would then skip the badge for it. |

## 12. Follow-ups
- If a "none" priority is wanted, an issue to add it to `Priority` (and F1's form) and hide the badge for it.
