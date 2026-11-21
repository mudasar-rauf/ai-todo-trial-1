# Technical Plan: #10 Edit a task, and delete one after confirming

**Ticket:** #10   **Spec:** [docs/specs/10-edit-delete-task.md](../specs/10-edit-delete-task.md)   **Contract:** [docs/contracts/tasks.md](../contracts/tasks.md) (F3)   **Status:** Draft

## 1. Summary

Fill in F3's three stubs in `src/features/edit/`: the pure functions `updateTask` and `deleteTask`, and the `TaskItemActions` component, which renders a row's Edit and Delete buttons. Edit opens an Astryx `Dialog` holding a form prefilled from the task; Save validates the title and calls `onUpdate`, Cancel and Escape close it without changes, and focus returns to the row's Edit button. Delete opens an Astryx `AlertDialog` naming the task; its action calls `onDelete` and moves focus into the composer's Title field. Nothing outside F3's files changes: the store, reducer and `TaskScreen` already route `update` and `delete` to these functions, and the task screen already sits behind `VITE_FF_TASKS`.

## 2. Requirements

### User story
See the spec.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Edit opens a dialog prefilled with the task; Save updates the row; Cancel or Escape changes nothing | issue |
| AC2 | Saving with an empty title is blocked with the required-title error | issue |
| AC3 | Delete opens a dialog naming the task; Cancel keeps it; Delete removes it | issue |
| AC4 | Closing the edit dialog returns focus to the row's Edit button; after a delete, focus is in the composer's Title | issue |
| AC5 | `updateTask`/`deleteTask` pure; same array for an unknown id or a no-op patch; `updatedAt = now`, title trimmed, `id`/`completed`/`createdAt` untouched | derived (contract §4) |
| AC6 | Spaces-only title is empty; task text rendered as text; every control named and keyboard-operable | derived (contract §1, §4) |
| AC7 | Only F3's files change; the five checks pass | derived |

### Non-functional requirements
- Accessibility (contract §4): visible labels on every field, keyboard only, visible focus, sensible focus after the dialog closes or the row disappears.
- No new dependencies; no change to any shared file (contract §3).

### Out of scope
See the spec.

### Assumptions
- **Required-title error text** is `Title is required`. F1 (#8) shows "the required-title error" too and has no plan yet; both should use the same words. See open question 1.
- **Priority "none".** #8 says a title-only task has "priority none", but the contract's `Priority` is `'low' | 'medium' | 'high'` with default `'medium'`. F3 edits the three values the contract has. Whatever #8 settles is a contract matter, not F3's.
- **The composer's Title field** is a visible label `Title` on a text input inside the same `<section>` as the task list (`TaskScreen` renders both in one `section`; F1's issue calls the field "Title"; contract §4 asks for visible labels). See §5, decision 4, and risk 1.
- The edit dialog sends the full edited draft; `updateTask` returns the same array when nothing changed, so an unchanged Save neither re-renders nor saves.

## 3. Current state

Verified by reading `main` (cca3cb1):
- `src/features/edit/updateTask.ts`, `deleteTask.ts`, `TaskItemActions.tsx` are stubs (return input / render `null`). No F3 tests exist.
- `src/tasks/props.ts`: `TaskItemActionsProps { task: Task; onUpdate(id, patch: TaskPatch): void; onDelete(id): void }`.
- `src/tasks/useTasks.ts`: `updateTask(id, patch)` dispatches `{ type: 'update', id, patch, now: now() }`; `deleteTask(id)` dispatches `{ type: 'delete', id }`. `src/tasks/taskReducer.ts` calls F3's functions and keeps state identity when they return their input.
- `src/tasks/TaskScreen.tsx`: one `<VStack as="section" aria-labelledby=…>` holds the banner, `AddTaskForm` (F1, a stub today), the filter bar, and `TaskList` (F2, a stub) whose `renderActions(task)` renders `<TaskItemActions task onUpdate={store.updateTask} onDelete={store.deleteTask} />`.
- `src/test/taskFixtures.ts`: `makeTask(overrides)`.
- Astryx 0.7.17: `Dialog` (`isOpen`, `onOpenChange`, `purpose: 'required' | 'form' | 'info'`; `form` closes on Escape and not on a backdrop click; native `<dialog>`), `DialogHeader`, `AlertDialog` (`isOpen`, `onOpenChange`, `title`, `description`, `cancelLabel`, `actionLabel`, `actionVariant` — `'destructive'` exists — `onAction`; initial focus on Cancel; Escape cancels), `TextInput` (`label`, `status` for the error message), `TextArea`, `Selector`, `DateInput`, `Button`, `HStack`.
- `eslint.config.js` applies `react-refresh`, so `TaskItemActions.tsx` exports only the component; helpers in it stay unexported.
- `src/tasks/contractDoc.test.ts` fails if any file under `src/features/` other than a `*.test.ts(x)` is not owned in the contract, so F3 cannot add a helper module.

## 4. Proposed design

### Overview
```
TaskList row (F2) ── renderActions(task) ──> TaskItemActions (F3)
  [Edit] ──open──> Dialog purpose="form"  "Edit task"
                     Title (TextInput, required)  Notes (TextArea)
                     Priority (Selector low/medium/high)  Due date (DateInput, clearable)
                     [Cancel] [Save]
                   Save: title.trim() === '' ? show "Title is required", focus Title
                                             : onUpdate(task.id, draft); close
                   close (Save/Cancel/Escape) ──> focus Edit button
  [Delete] ──open──> AlertDialog "Delete task?"  description names the task
                     [Cancel] closes, focus back on Delete (Astryx default)
                     [Delete] find composer Title; onDelete(task.id); focus it
```

### Changes by component
| File | Change | New or modified |
|---|---|---|
| `src/features/edit/updateTask.ts` | real body | modified (stub) |
| `src/features/edit/deleteTask.ts` | real body | modified (stub) |
| `src/features/edit/TaskItemActions.tsx` | Edit/Delete buttons, edit `Dialog`, delete `AlertDialog`, focus handling | modified (stub) |
| `src/features/edit/updateTask.test.ts`, `deleteTask.test.ts`, `TaskItemActions.test.tsx` | tests | new |

### APIs and contracts
Unchanged; signatures are the contract's:
```ts
updateTask(tasks: Task[], id: string, patch: TaskPatch, now: string): Task[]
deleteTask(tasks: Task[], id: string): Task[]
TaskItemActions(props: TaskItemActionsProps)
```

### Behaviour in detail
- **`updateTask`**: find the task by id; none → return `tasks`. Merge the patch (title trimmed when present). If every patched field equals the current value → return `tasks`. Otherwise return a new array with a new task object at the same index, `updatedAt: now`. Never touch `id`, `completed`, `createdAt`. `updateTask` does not validate an empty title: the dialog does (the store is not a validation layer, and the reducer has no error path). Defensive rule: if the patch's trimmed title is `''`, ignore the title field rather than store an empty title, so the `Task` invariant holds even if a caller skips the form.
- **`deleteTask`**: unknown id → return `tasks`; otherwise `tasks.filter(t => t.id !== id)`.
- **Buttons**: visible text `Edit` and `Delete`, with `aria-label` `Edit “<title>”` / `Delete “<title>”` so each row's buttons have distinct names (the visible word starts the name, satisfying label-in-name).
- **Edit dialog**: `Dialog purpose="form"` with a `DialogHeader title="Edit task"`, a `<form>` whose submit is Save (Enter in Title saves). Draft state is initialised from `task` each time the dialog opens (re-key or reset on open), so a cancelled edit leaves nothing behind for the next open. Due date can be cleared to `null`; notes default `''`.
- **Required-title error**: on Save with `title.trim() === ''`, set the Title `TextInput`'s `status` to an error with message `Title is required` (so it is tied to the field via `aria-describedby` and marked invalid), keep the dialog open, move focus to Title, and do not call `onUpdate`. The error clears as soon as the title is edited.
- **Edit focus return**: hold a ref to the Edit button and focus it after the dialog closes by any route (Save, Cancel, Escape, the header's close button). Do not rely only on the native `<dialog>` restore; Astryx's modality handling can vary, and AC4 must hold.
- **Delete dialog**: `AlertDialog` with `title="Delete task?"`, `description={`“${task.title}” will be deleted.`}` (a string prop, rendered as text), `actionLabel="Delete"`, `actionVariant="destructive"`, default `Cancel`. Cancel/Escape just close.
- **Focus after delete**: in `onAction`, before calling `onDelete`, find the composer's Title from the Delete button: `deleteButtonRef.current.closest('section')`, then the first `<label>` in it, outside any `<dialog>`, whose trimmed text is `Title` (ignoring a trailing required marker such as `*`), and take its `control`. Call `onDelete(task.id)`, then focus the found element once React has committed the removal (e.g. `setTimeout(..., 0)`; the component is unmounting, so not an effect). If nothing is found, do nothing: focus falls to `body`, and the F6 tests will catch a mismatch with F1.

### Error handling and edge cases
- Unknown id in either function → same array (the row may have vanished under a filter change).
- Title of only spaces → AC2's error. A title with surrounding spaces → saved trimmed.
- Task text containing `<b>` or `&` → shown literally in the field, the aria-labels and the alert description.
- A storage failure on save is F5's banner; F3 does nothing extra.

## 5. Key decisions
| # | Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|---|
| 1 | Where the empty-title rule lives | the edit form; `updateTask` ignores an empty title defensively | the reducer has no error path; the contract keeps feature functions pure and silent | `updateTask` throwing: the store does not catch non-storage errors, so it would crash the screen |
| 2 | Edit dialog dismissal | `purpose="form"` | Escape cancels (AC1); a stray backdrop click does not lose an edit | `info`: backdrop click drops edits |
| 3 | What Save sends | the full draft | simple; `updateTask` returns the same array when nothing changed, so no save happens | diffing in the component: duplicates `updateTask`'s check |
| 4 | Reaching the composer's Title after delete | DOM lookup by visible label within the enclosing `section`, inside `TaskItemActions.tsx` | the contract gives F3 no handle on F1's input and forbids changing props or `TaskScreen` here (§5); a new helper file would fail `contractDoc.test.ts` | a `focusComposer` prop or ref through `TaskScreen` — the cleaner design, but a contract change that needs its own issue (follow-up 1) |
| 5 | Distinct button names | `aria-label` "Edit “title”" | many rows each have an Edit button; screen-reader users must tell them apart | bare "Edit": ambiguous in a list |

Decision 4 crosses a module boundary informally (F3 depends on F1's label text). **Flag for architect review.** No ADR: it is reversible and contained in one file.

## 6. Implementation tasks

### T1. `updateTask` and `deleteTask` (S)
- Goal: the pure functions behave as §4 says.
- Changes: `src/features/edit/updateTask.ts`, `deleteTask.ts`; replace the stub bodies, keep the signatures; drop the "Stub owned by" comment line.
- Done when: AC5 tests pass.
- Tests: `updateTask.test.ts` — applies each field; trims title; sets `updatedAt`; keeps `id`/`completed`/`createdAt`; does not mutate input (freeze or deep-compare a copy); same array for unknown id; same array for a patch equal to current values; ignores an empty/spaces title. `deleteTask.test.ts` — removes only the given task; keeps order; same array for unknown id; no mutation. Use `makeTask`.
- Depends on: none.

### T2. Edit dialog (M)
- Goal: AC1, AC2, AC4 (edit half), AC6.
- Changes: `src/features/edit/TaskItemActions.tsx`.
- Details: §4 "Buttons", "Edit dialog", "Required-title error", "Edit focus return". First check whether jsdom 31 implements `HTMLDialogElement.showModal`/`close`; if not, stub them in `TaskItemActions.test.tsx` (`beforeAll`), not in the shared `src/test/setup.ts`.
- Done when: tests below pass; manual check with `VITE_FF_TASKS=true npm run dev` once F2 renders rows (before that, tests are the evidence).
- Tests (`TaskItemActions.test.tsx`, React Testing Library + `user-event`, a small harness that holds a task in state and passes `onUpdate`/`onDelete` spies that also update it): Edit opens a dialog named "Edit task" with every field prefilled; changing fields and Save calls `onUpdate(id, draft)` and closes; Cancel and Escape each close without calling `onUpdate`, and reopening shows the task's values, not the abandoned edits; empty and spaces-only title → `Title is required` shown and described on Title, `onUpdate` not called, dialog still open, focus in Title; after Save, Cancel and Escape focus is on that row's Edit button; a title with `<b>x</b>` appears literally.
- Depends on: none (can run parallel to T1).

### T3. Delete confirmation and focus (S)
- Goal: AC3, AC4 (delete half).
- Changes: `src/features/edit/TaskItemActions.tsx`.
- Details: §4 "Delete dialog", "Focus after delete".
- Done when: tests pass.
- Tests (same file; the harness wraps the component in a `<section>` that also contains `<label>Title <input/></label>` as a stand-in composer, plus a second stand-in inside a `<dialog>` to prove it is skipped): Delete opens an alertdialog whose text includes the task title; Cancel and Escape keep the task (`onDelete` not called); Delete calls `onDelete(task.id)` once and focus ends in the stand-in Title; with no Title in the section, Delete still works and nothing throws.
- Depends on: T2 (same file).

### Sequence
T1 ∥ T2, then T3. Total: S + M + S ≈ 1.5–2 days.

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T2 | component (RTL) | prefill; Save calls `onUpdate`; Cancel/Escape don't, and leave no stale draft |
| AC1 (row updates) | T1, T2 | unit + existing `taskReducer`/`useTasks` tests | `updateTask` returns the patched task; the store already re-renders on a new array |
| AC2 | T2 | component | error shown, `aria-invalid`/described, no `onUpdate` |
| AC3 | T1, T3 | unit + component | dialog names the task; Cancel keeps; Delete calls `onDelete`; `deleteTask` removes |
| AC4 | T2, T3 | component | `document.activeElement` is the Edit button / the stand-in Title |
| AC5 | T1 | unit | purity, identity, timestamps |
| AC6 | T2, T3 | component | spaces-only title; literal markup; buttons and fields found by role and name |
| AC7 | all | CI | the five checks; `contractDoc.test.ts` still passes |

Regression risk: `src/tasks/TaskScreen.composition.test.tsx` and `contractDoc.test.ts` must stay green; F3 changes no exported names. The full flow in the real screen (row Edit → row updates; Delete → focus in the real composer) is F6's to test once F1 and F2 land.

## 8. Rollout and rollback
- **Feature flag:** `VITE_FF_TASKS` (build-time env var, on only when exactly `true`, off by default; contract §6). It already gates the whole task screen, so F3 adds no flag. With it off, nothing F3 renders reaches users.
- No migrations, no data shape change (`Task` is unchanged).
- Rollback: revert the pull request; the stubs return.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 1. F1 labels Title differently, or renders it outside the section, so focus after delete is lost | Medium | AC4 fails in the real screen | lookup tolerates a required marker; open question 1 asks #8's planner to keep a visible `Title` label; F6's screen tests check it; follow-up 1 removes the coupling |
| 2. jsdom lacks `<dialog>` modal methods, so Astryx dialogs don't open in tests | Medium | T2 blocked | stub `showModal`/`close` in F3's own test file |
| 3. Astryx restores focus itself and races the explicit focus | Low | flaky AC4 test | focus explicitly after close; assert after `await user` events settle |
| 4. Error text differs from F1's | Medium | inconsistent UI | open question 1 |

## 10. Technical debt
Taken on: decision 4 couples F3 to F1's visible label text through the DOM (architecture debt). Follow-up 1 replaces it with an explicit contract hook.

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | What are the exact words of the required-title error, and is the composer's field labelled exactly `Title`? | #8's planner / product owner | no | `Title is required`; visible label `Title` |
| 2 | Should the delete confirmation say more than the title (e.g. "This can't be undone")? | product owner | no | "“<title>” will be deleted." |

## 12. Follow-ups
1. Contract issue: give `TaskScreen` a way to focus the composer's Title (e.g. an `onDeleted`/`focusComposer` callback in `TaskItemActionsProps`, and a ref on `AddTaskFormProps`), replacing the DOM lookup.
2. Contract issue: reconcile #8's "priority none" with `Priority`'s three values and default `medium`.
3. Share the required-title message between F1 and F3 once the contract allows a shared module for it.
