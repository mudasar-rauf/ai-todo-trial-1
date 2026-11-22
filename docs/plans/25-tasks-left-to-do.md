# Technical Plan: #25 Show how many tasks are left to do

**Ticket:** #25   **Spec:** [docs/specs/25-tasks-left-to-do.md](../specs/25-tasks-left-to-do.md)   **Status:** Draft

## 1. Summary

Add a small new feature, **F7 Remaining count**, that renders one line below the task list: "N tasks left", "1 task left" or "No tasks left". A pure function picks the wording from a count; a component counts the not-done tasks in the store's full `tasks` list and renders the line in a polite live region. `TaskScreen` renders it after the list or empty state. Because a new feature directory and a new prop type change the shared contract, this issue updates `docs/contracts/tasks.md` and its contract test in the same pull request, as contract section 5 requires. It ships behind the existing `VITE_FF_TASKS` flag.

## 2. Requirements

### Acceptance criteria
See the [spec](../specs/25-tasks-left-to-do.md): AC1–AC4 from the issue, AC5–AC8 derived.

### Non-functional requirements
- The text is plain React text; no new dependency.
- Accessible: `role="status"` (implicit `aria-live="polite"`), so a change is announced without moving focus (AC6).

### Out of scope
Filtering by done or not done (F4). No change to `Task`, storage, reducer or `useTasks`.

### Assumptions
- "Below the task list" means after whatever `TaskScreen` shows in the list's place: `TaskList` when tasks are visible, `TaskEmptyState` otherwise. The line always renders (AC5), so with no tasks at all it says "No tasks left".
- N ignores the current filter and search (AC5): the issue counts "tasks not marked done", not visible ones.
- English only; the app has no i18n layer (verified: no i18n package in `package.json`).

## 3. Current state

- `src/tasks/TaskScreen.tsx` is the shared composition root. It renders `StorageErrorBanner`, `AddTaskForm`, `TaskFilterBar`, then `TaskList` (when `store.visibleTasks` is non-empty) or `TaskEmptyState`.
- `src/tasks/useTasks.ts` returns `tasks` (all tasks), `visibleTasks`, `completedCount` and the actions. `tasks` changes on add, toggle, update, delete and clear, so anything derived from it during render updates at once (AC3) with no store change.
- `src/tasks/props.ts` holds every feature's props type (contract section 1).
- `docs/contracts/tasks.md` section 2 gives each feature an ownership table; `src/tasks/contractDoc.test.ts` checks that every non-test file under `src/features/` is owned exactly once, that every named export exists, and (line 21) that the owners are exactly `['F1', …, 'F6']`.
- `src/flags.ts`: `isTasksEnabled()` gates the whole screen in `App.tsx`.
- Tests: Vitest + Testing Library (`npm test`); `src/tasks/TaskScreen.composition.test.tsx` mocks each feature component with `vi.mock` and checks its props; `src/features/complete/TaskScreen.toggle.test.tsx` renders the real screen and drives it with `userEvent`.

## 4. Proposed design

### Overview
```
useTasks().tasks ──> TaskScreen ──> <RemainingCount tasks={store.tasks} />
                                         │ count = tasks.filter(t => !t.completed).length
                                         └─ <p role="status">{remainingLabel(count)}</p>
```

### Changes by component
| Component / file | Change | New or modified |
|---|---|---|
| `src/features/remaining/remainingLabel.ts` | `remainingLabel(count: number): string` | New (F7) |
| `src/features/remaining/RemainingCount.tsx` | `RemainingCount(props: RemainingCountProps)` | New (F7) |
| `src/tasks/props.ts` | add `RemainingCountProps` | Modified (contract) |
| `src/tasks/TaskScreen.tsx` | render `<RemainingCount tasks={store.tasks} />` after the list / empty-state conditional | Modified (contract) |
| `docs/contracts/tasks.md` | section 1 adds `RemainingCountProps` to props.ts's exports; section 2 adds an F7 table; intro "F1–F6" becomes "F1–F7" where it describes the features | Modified |
| `src/tasks/contractDoc.test.ts` | expected owners become F1–F7 (test name too) | Modified |

### APIs and contracts
```ts
// src/tasks/props.ts
/** F7 Remaining count. All tasks, not only the visible ones. */
export interface RemainingCountProps {
  tasks: Task[];
}

// src/features/remaining/remainingLabel.ts
/** 0 → "No tasks left", 1 → "1 task left", n → "n tasks left". */
export function remainingLabel(count: number): string;
```

F7 table for contract section 2:

| File | Exports | Tests |
|---|---|---|
| `src/features/remaining/remainingLabel.ts` | `remainingLabel(count: number): string` | `src/features/remaining/remainingLabel.test.ts` |
| `src/features/remaining/RemainingCount.tsx` | `RemainingCount(props: RemainingCountProps)`: "N tasks left" below the list, in a `role="status"` region | `src/features/remaining/RemainingCount.test.tsx` |

### Error handling and edge cases
- 0 tasks at all, or all done → "No tasks left".
- Filter hides every task → empty state shows, and the line still shows the true count below it.
- Clear completed and delete of a done task leave N unchanged; delete of an open task lowers it (falls out of deriving from `tasks`).

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Where the logic lives | New feature F7 in `src/features/remaining/` | Contract keeps feature logic out of the shared root and gives each feature its own files and tests | Computing the text inline in `TaskScreen`: puts feature logic in the shared root and has no owner in the contract |
| What `RemainingCount` receives | `tasks: Task[]` | Keeps the counting in the feature, testable with `makeTask`; no change to `TaskStore` | `remainingCount: number` computed as `tasks.length - completedCount` in `TaskScreen` (arithmetic in the root); adding `remainingCount` to `useTasks` (changes `TaskStore`, a larger contract change) |
| Live region | `<p role="status">` | Announces changes politely, no focus move; plain element avoids guessing an Astryx text component's props | `aria-live="assertive"`: interrupts on every toggle |
| Flag | Existing `VITE_FF_TASKS` | Contract section 6: every feature issue ships behind it; #10 and #15 did the same | A new `VITE_FF_REMAINING_COUNT`: a second flag for one line of text inside a screen that is already off by default |

The contract change (new props type, new owner, `TaskScreen` change) is the only significant decision; it is small and additive, and is flagged for the architect's review.

## 6. Implementation tasks

### T1. Wording function (S)
- Goal: `remainingLabel` returns the three wordings.
- Changes: `src/features/remaining/remainingLabel.ts`, `remainingLabel.test.ts`.
- Done when: 0 → "No tasks left", 1 → "1 task left", 2 and 5 → "2 tasks left" / "5 tasks left" (AC1, AC2, AC4).
- Tests: unit, `it.each` over 0, 1, 2, 5.
- Depends on: none.

### T2. Component and contract (S)
- Goal: `RemainingCount` renders the line; the contract lists F7.
- Changes: `src/tasks/props.ts` (`RemainingCountProps`), `src/features/remaining/RemainingCount.tsx` + `RemainingCount.test.tsx`, `docs/contracts/tasks.md`, `src/tasks/contractDoc.test.ts`. Start the component file with `// Owned by F7 (Remaining count); see docs/contracts/tasks.md.` as `TaskList.tsx` does.
- Details: count with `tasks.filter((task) => !task.completed).length`; render `<p role="status">{remainingLabel(count)}</p>`.
- Done when: given tasks via `makeTask` (2 open + 1 done) it shows "2 tasks left" in `getByRole('status')`; one open → "1 task left"; all done or empty → "No tasks left"; contract test passes (AC5 counting part, AC6, AC8).
- Tests: component tests as above; updated `contractDoc.test.ts`.
- Depends on: T1.

### T3. Wire into TaskScreen (S)
- Goal: the line shows below the list and updates live.
- Changes: `src/tasks/TaskScreen.tsx` (render after the list/empty-state conditional), `src/tasks/TaskScreen.composition.test.tsx` (mock `RemainingCount`; assert it gets `store.tasks` — all tasks, including filtered-out ones — and renders after `TaskList` / `TaskEmptyState`), new `src/features/remaining/TaskScreen.remaining.test.tsx` (real screen, like `TaskScreen.toggle.test.tsx`).
- Done when: on the real screen with in-memory storage, adding a task raises N, checking it lowers N, unchecking raises it again, all without remount (AC1, AC3); the line is after the list in document order (AC1); existing tests pass (AC4).
- Tests: the integration test above; composition test update.
- Depends on: T2.

### Sequence
T1 → T2 → T3, one pull request. Total ≈ 1 day (3 × S).

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T1, T3 | unit, integration | "N tasks left" wording; line after the list |
| AC2 | T1, T2 | unit, component | "1 task left", "No tasks left" |
| AC3 | T3 | integration | add / complete / reopen update the text at once |
| AC4 | T1, all | unit, full suite | three wordings; `npm test`, `npm run lint`, `npm run typecheck` pass |
| AC5 | T2, T3 | component, composition | counts all not-done tasks; receives `store.tasks`, not `visibleTasks`; shown with the empty state |
| AC6 | T2 | component | text is inside `role="status"` |
| AC7 | — | existing `App.test.tsx` | main stays empty with the flag off (unchanged test) |
| AC8 | T2 | contract test | F7 owned, exports exist |

Regression risks: `contractDoc.test.ts` fails until the doc and owner list are updated together; `TaskScreen.composition.test.tsx` renders the real `RemainingCount` unless mocked (harmless, but mock it for consistency); `TaskScreen.test.tsx` asserts no console errors — the plain `<p>` adds none.

## 8. Rollout and rollback
- **Feature flag:** `VITE_FF_TASKS` (build-time env var, on only when exactly `true`, off by default; `src/flags.ts`, contract §6). The line renders only inside `TaskScreen`, which renders only with the flag on. No new flag.
- No migrations, no data change, no config.
- Rollback: revert the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A parallel feature PR also edits `contractDoc.test.ts`'s owner list or contract section 2 | Low | Merge conflict | Additive edits; resolve by keeping both |
| Live region chatty for screen-reader users when toggling many tasks | Low | Low | `polite`, short text |

## 10. Technical debt
None taken on. The contract test hardcodes the owner list; adding F7 extends it rather than generalising it (follow-up 1).

## 11. Open questions
None blocking. Assumptions in section 2.

## 12. Follow-ups
1. Make `contractDoc.test.ts` derive the expected owners from the headings in order (F1..Fn) instead of a fixed list.
