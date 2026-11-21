# Technical Plan: #8 Add a task with a title, notes, priority and due date

**Ticket:** #8   **Spec:** [docs/specs/8-add-task.md](../specs/8-add-task.md)   **Status:** Draft

## 1. Summary

Fill in F1's two stubs from [`docs/contracts/tasks.md`](../contracts/tasks.md): the pure `addTask` puts a new, normalised `Task` at the front of the list, and `AddTaskForm` is the composer (Title, Notes, Priority, Due date, Add button) that validates the title, calls `onAdd(draft)`, then clears itself and puts focus back in Title. Nothing outside `src/features/add/` changes: `TaskScreen` already wires `onAdd` to `store.addTask`, and the reducer already routes `add` to `addTask`. The screen stays behind `VITE_FF_TASKS`.

## 2. Requirements

### User story
See the spec.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Title only + Enter adds the task at the top, priority none (= default), no due date | ticket |
| AC2 | All fields filled: new row shows notes, priority, due date as entered | ticket |
| AC3 | Empty or spaces-only title adds nothing and shows the required-title error next to Title | ticket |
| AC4 | After adding, form is empty and focus is in Title | ticket |
| AC5 | Only F1's files change; behind `VITE_FF_TASKS` | derived |
| AC6 | Task normalised per contract (trimmed title/notes, dueDate or null, timestamps from `now`), input not mutated | derived |
| AC7 | Labelled controls, keyboard-only, error tied to Title | derived |

### Non-functional requirements
- Task text is rendered as React text only (contract §4).
- No new dependencies; use `@astryxdesign/core` components as `TaskScreen` and `App` already do.

### Out of scope
Row rendering and order (F2), editing (F3), persistence (F5), screen-level a11y and e2e (F6), any contract change.

### Assumptions
- **Priority "none"** = no priority chosen → `DEFAULT_PRIORITY` (`'medium'`). The Priority control starts at `DEFAULT_PRIORITY`. Open question 1.
- Notes are trimmed at both ends; whitespace-only notes become `''`. Internal line breaks are kept.
- Enter in Title, Priority or Due date submits (native form submit). Enter in Notes (a multi-line text area) inserts a newline, as people expect; the Add button or Enter in another field submits.
- The required-title error text is "Title is required". It clears as soon as the title has non-space text again, and on a successful add.
- On an invalid submit, focus moves to Title so keyboard and screen-reader users land on the error.

## 3. Current state

Verified on `main` (cca3cb1):

- `src/features/add/addTask.ts`: stub returning `tasks` unchanged. Signature `addTask(tasks: Task[], draft: TaskDraft, env: TaskEnv): Task[]`.
- `src/features/add/AddTaskForm.tsx`: stub rendering `null`. Props `AddTaskFormProps { onAdd(draft: TaskDraft): void }` (`src/tasks/props.ts`).
- `src/tasks/taskReducer.ts:31`: `case 'add'` → `withTasks(state, addTask(state.tasks, action.draft, action.env))`; returning the same array means no re-render and no save.
- `src/tasks/useTasks.ts`: `addTask(draft)` dispatches with `env: { createId, now }`; `visibleTasks = sortTasks(filterTasks(tasks, filter))` (both still stubs that return their input), and the list is saved on change.
- `src/tasks/TaskScreen.tsx`: renders `<AddTaskForm onAdd={store.addTask} />`; `TaskScreenProps` accepts `storage`, `createId`, `now`, so a test can inject an in-memory storage and fixed ids/times.
- `src/tasks/types.ts`: `Priority = 'low' | 'medium' | 'high'`, `DEFAULT_PRIORITY = 'medium'`, `TaskDraft = Pick<Task, 'title'|'notes'|'priority'|'dueDate'>`.
- `src/test/taskFixtures.ts`: `makeTask(overrides)`.
- Tests use Vitest + Testing Library + `@testing-library/user-event` with jsdom (`src/test/setup.ts`).

## 4. Proposed design

### Overview
```
AddTaskForm (local state: title, notes, priority, dueDate, error)
  └─ submit → validate trimmed title ─ empty → show error, focus Title, stop
                                     └ ok    → onAdd(draft) → reset fields, focus Title
TaskScreen: onAdd = store.addTask → reducer 'add' → addTask(tasks, draft, env) → [newTask, ...tasks]
```

### Changes by component
| Component / file | Change | New or modified |
|---|---|---|
| `src/features/add/addTask.ts` | Replace stub body: build and prepend the task | modified |
| `src/features/add/AddTaskForm.tsx` | Replace stub body: the composer form | modified |
| `src/features/add/addTask.test.ts` | Unit tests | new |
| `src/features/add/AddTaskForm.test.tsx` | Component tests | new |
| `src/features/add/addFlow.test.tsx` | Integration through `TaskScreen` with an in-memory storage | new |

### APIs and contracts
Unchanged. `addTask` behaviour:

```ts
// title = draft.title.trim(); if '' → return tasks (same array)
// const at = env.now();
// return [{ id: env.createId(), title, notes: draft.notes.trim(), priority: draft.priority,
//           dueDate: draft.dueDate || null, completed: false, createdAt: at, updatedAt: at }, ...tasks];
```
`now()` is called once so `createdAt === updatedAt`.

`AddTaskForm` builds `TaskDraft` as `{ title: title.trim(), notes, priority, dueDate: dueDate === '' ? null : dueDate }`.

### UI
- A `<form>` with an accessible name ("Add task"), `noValidate` (we show our own error, not the browser's bubble).
- Controls, each with a visible label: **Title** (text input), **Notes** (text area), **Priority** (select: Low, Medium, High; starts at `DEFAULT_PRIORITY`), **Due date** (date input, value `'YYYY-MM-DD'` or empty), **Add task** (submit button).
- Use the matching `@astryxdesign/core` field components (text input, text area, select, date input, button) and their label/error props where they exist; check the exact component names in the installed 0.7.17 package. If one lacks an error slot, render the message in an element with an `id` directly under Title and wire `aria-describedby` and `aria-invalid="true"` on the input.
- Focus: hold a ref to the Title input; after a valid add or an invalid submit, call `focus()` on it.

### Error handling and edge cases
- Spaces-only title → error, `onAdd` not called, other fields keep their values.
- Typing into Title after an error clears the error once the trimmed value is non-empty.
- Very long text: no limit (the contract sets none); follow-up if wanted.
- `addTask` with a blank title (should not happen via the form) returns the same array, so nothing saves.

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Where the new task goes | Prepended in `addTask` | AC1 "top of the list"; `sortTasks` (F2) is to put incomplete first, and a stable sort keeps a new incomplete task first | Sorting by `createdAt` in F1: that is F2's file |
| Validation location | In the form, and a guard in `addTask` | Form owns the visible error; guard keeps the `Task.title` non-empty invariant if anything else dispatches | Only in `addTask`: no way to show the error |
| "Priority none" | `DEFAULT_PRIORITY` | Contract has no "none"; contract changes are out of scope | Adding `'none'`: needs a contract issue (§5) |
| Enter in Notes | Newline | Multi-line notes are expected; Enter in Title (AC1) still submits | Single-line notes input |

No ADR needed: nothing crosses the contract.

## 6. Implementation tasks

### T1. `addTask` (S)
- Goal: a pure function that prepends a normalised task.
- Changes: `src/features/add/addTask.ts`, new `addTask.test.ts`.
- Details: replace the stub body; keep the header comment's ownership line accurate (drop "Stub").
- Done when: AC1 (store level), AC6.
- Tests: prepends to a non-empty list (`makeTask`); trims title and notes; `dueDate ''`→`null`, a date kept as-is; `completed: false`; id from `createId`, both timestamps from one `now()`; input array not mutated; blank / spaces-only title returns the same array (`toBe`).
- Depends on: none.

### T2. `AddTaskForm` (M)
- Goal: the composer.
- Changes: `src/features/add/AddTaskForm.tsx`, new `AddTaskForm.test.tsx`.
- Details: as §4 UI. Controlled local state; `DEFAULT_PRIORITY` imported from `src/tasks/types`.
- Done when: AC1, AC3, AC4, AC7 at component level.
- Tests (user-event, `onAdd = vi.fn()`):
  - Title only + `{Enter}` → `onAdd` called once with `{ title, notes: '', priority: DEFAULT_PRIORITY, dueDate: null }`.
  - All fields filled + click Add → `onAdd` with each value as entered (date `'2026-12-01'`).
  - Empty, then `'   '` + Enter → `onAdd` not called; "Title is required" visible; Title has `aria-invalid="true"` and its `aria-describedby` points at the message; Title has focus.
  - After a valid add: every field back to its initial value (priority = default, date empty) and `document.activeElement` is Title.
  - Error clears once a title is typed.
  - Every control found by `getByLabelText`.
- Depends on: none (parallel with T1).

### T3. Add flow through `TaskScreen` (S)
- Goal: prove AC1/AC2 end to end in the store, since F2's row is still a stub.
- Changes: new `src/features/add/addFlow.test.tsx` (imports only `src/tasks/`, `src/test/`, own directory — allowed by contract §2).
- Details: render `<TaskScreen storage={{ load: () => [makeTask({ id: 'old' })], save: vi.fn() }} createId={() => 'new'} now={() => '2026-11-21T10:00:00.000Z'} />`, fill the form, submit, assert the last `save` call's list is `[newTask, old]` with the expected fields.
- Done when: AC1 and AC2 at store level; the existing `src/tasks/*.test.*` still pass.
- Depends on: T1, T2.

### Sequence
T1 ∥ T2, then T3. Total: about 1.5 days (S + M + S).

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1, T2, T3 | unit, component, integration | default priority, null date, first in the saved list |
| AC2 | T2, T3 | component, integration | each entered value reaches `onAdd` and the stored task; on-screen row checked once F2 lands (F6's journey) |
| AC3 | T1, T2 | unit, component | nothing added; error shown and tied to Title |
| AC4 | T2 | component | fields reset, focus in Title |
| AC5 | all | review + CI | diff touches only `src/features/add/`; `contractDoc.test.ts` passes |
| AC6 | T1 | unit | normalisation, purity |
| AC7 | T2 | component | labels, error ARIA, keyboard submit |

Regression risk: `src/tasks/TaskScreen.composition.test.tsx` mocks `AddTaskForm`, so it is unaffected; `src/tasks/useTasks.test.tsx` and `taskReducer.test.ts` mock `addTask` (`vi.mock('../features/add/addTask')`), so they do not depend on its body. `src/App.test.tsx` and `e2e/frame.spec.ts` render the frame; with the flag on, they now also render the composer, so run them (they are shared files: if one breaks, stop and raise it rather than edit it — see Risks). Run all five CI checks (typecheck, lint, test, build, e2e).

## 8. Rollout and rollback
Feature flag: the existing `VITE_FF_TASKS` build-time environment variable (`src/flags.ts`), off by default; the composer is only mounted when it is `true`. No new flag, no migration, no config change. Try it with `VITE_FF_TASKS=true npm run dev`. Rollback: revert the PR, which restores the stubs; with the flag off, production is unaffected either way.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| "Priority none" means a real fourth value | Medium | AC1 not met as intended | Open question 1, settled at the plan gate |
| A shared test (`App.test.tsx`, `e2e/frame.spec.ts`) breaks once the composer renders | Low | CI red, fix outside F1's files | Run the suite early in T2; if hit, stop and ask for a shared-file issue |
| An Astryx field lacks an error/description slot | Low | Hand-wired ARIA | Fallback described in §4 UI |
| F2's sort reorders a new task below older ones | Low | AC1 on screen | F2's spec: incomplete first, stable; F6's journey covers it |

## 10. Technical debt
None taken on.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | AC1 says "priority none", but the contract's `Priority` has no "none" and defaults to `'medium'`. Is the default acceptable, or should "none" become a priority value (a contract issue first)? | Product owner, at the plan gate | AC1's priority part only | Default `DEFAULT_PRIORITY` |

## 12. Follow-ups
- A title length limit, if wanted.
- If "none" is wanted as a priority: a contract issue changing `Priority` and `DEFAULT_PRIORITY`.
