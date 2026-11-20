# Technical Plan: #4 One Task type and one storage interface that every feature shares

**Ticket:** #4   **Spec:** [docs/specs/4-task-type-storage-interface.md](../specs/4-task-type-storage-interface.md)   **Status:** Draft

## 1. Summary

Define, as type-checked code, the contract the six task features (F1–F6, listed in the spec) build against: the `Task` type, the `TaskStorage` interface, the store (`useTasks`) and its shape, and every feature component's props. Implement the shared wiring for real (the store hook, its reducer, the composition root `TaskScreen`), and give each feature its own files containing **stubs**: pure functions that return their input unchanged, and components that render nothing. Each feature then changes only its own files. `docs/contracts/tasks.md` records ownership, exports and tests per feature, and the rule that changing a contract type needs its own issue. The task screen mounts behind the flag `VITE_FF_TASKS`, off by default.

## 2. Requirements

### User story
See the spec. Feature authors fill in their own files against a fixed contract; no two features edit the same file.

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | `docs/contracts/tasks.md` names, per feature, files it may change, their exports, its tests | ticket |
| AC2 | Running app still renders the frame with no console errors, every feature a stub | ticket |
| AC3 | `docs/contracts/tasks.md` says changing a contract type later needs its own issue | ticket |
| AC4 | CI passes | ticket |
| AC5 | Task type, storage interface, store shape and component props are exported TypeScript types the doc points to | derived |
| AC6 | Composition root renders a stub for every feature; each feature file has exactly one owner | derived |

### Non-functional requirements
- Stubs must type-check, lint and render without errors or warnings (no React key warnings, no act warnings).
- Every pure operation the features fill in is deterministic: ids and timestamps are injected (`createId`, `now`), so feature tests don't mock globals.
- No new dependencies: `package.json` is unchanged.

### Out of scope
Any feature's behaviour beyond its stub; the real `localStorage` implementation (F5); the empty state's content (F6).

### Assumptions
- Dates: `dueDate` is a date-only string `YYYY-MM-DD` (what `<input type="date">` and Astryx's `DateInput` produce), so no time zone shifts a due date. Timestamps (`createdAt`, `updatedAt`) are ISO 8601 strings.
- Priority has three levels, `'low' | 'medium' | 'high'`, default `'medium'`.
- One flag gates the whole task screen, not one flag per feature (see §8 and open question 1).
- "No two features edit the same file" also covers shared files: after this issue, the files under "Shared (contract)" in the ownership table are edited only by an issue of their own.

## 3. Current state

Verified by reading the code on `main` (5f53c12):
- `src/App.tsx` renders `<Theme theme={neutralTheme}><AppShell topNav={…} mobileNav={false} children={null} /></Theme>`; the comment says the task screen mounts in the main region.
- `src/App.test.tsx` asserts one banner with `APP_NAME` and one **empty** main.
- `e2e/frame.spec.ts` checks landmarks, no Vite demo content, body margin and the theme font. It does not check console errors.
- `vite.config.ts`: Vitest with jsdom, `globals: true`, setup `src/test/setup.ts`, tests `src/**/*.test.{ts,tsx}`.
- `playwright.config.ts`: Chromium only; `webServer` runs `npm run dev` on port 5173.
- `eslint.config.js`: `react-refresh` (Vite preset) on `src`, so a `.tsx` file should export only components.
- Astryx 0.7.17 is installed with entry points the features will use, among them `Button`, `TextInput`, `TextArea`, `DateInput`, `Selector`, `SegmentedControl`, `CheckboxInput`, `Dialog`, `AlertDialog`, `EmptyState`, `Banner`, `VStack`, `HStack`, `Heading`, `VisuallyHidden` (from the package's `exports`).
- No flag code exists yet; #2's plan set the convention `VITE_FF_<FEATURE>`, on only when set to `"true"`.

## 4. Proposed design

### Overview
```
App.tsx ── main region: isTasksEnabled() ? <TaskScreen/> : null
TaskScreen (src/tasks/TaskScreen.tsx, shared, composition root)
  const store = useTasks({ storage, createId, now })
  <section aria-labelledby="tasks-heading">  <Heading id="tasks-heading">Tasks</Heading>
    <StorageErrorBanner error onDismiss/>          F5
    <AddTaskForm onAdd/>                           F1
    <TaskFilterBar filter onFilterChange completedCount onClearCompleted/>   F4
    visibleTasks.length ? <TaskList tasks onToggle renderActions={t => <TaskItemActions …/>}/>   F2 + F3
                        : <TaskEmptyState totalCount filter/>                F6
useTasks (src/tasks/useTasks.ts, shared)
  useReducer(taskReducer) ── each action calls the owning feature's pure function
  initial state: storage.load()   after each change of tasks: storage.save(tasks)
  save throws TaskStorageError → storageError set, tasks kept in memory
  visibleTasks = sortTasks(filterTasks(tasks, filter))
```

### Changes by component
| File | Change | New / modified | Owner after this issue |
|---|---|---|---|
| `src/tasks/types.ts` | `Task`, `Priority`, `TaskDraft`, `TaskPatch`, `StatusFilter`, `TaskFilter`, `TaskOps` | new | shared |
| `src/tasks/storage.ts` | `TaskStorage` interface, `TaskStorageError` class | new | shared |
| `src/tasks/props.ts` | every feature component's props type | new | shared |
| `src/tasks/taskReducer.ts` | `TaskState`, `TaskAction`, `taskReducer` delegating to feature functions | new | shared |
| `src/tasks/useTasks.ts` | `TaskStore`, `UseTasksOptions`, `useTasks` | new | shared |
| `src/tasks/TaskScreen.tsx` | composition root | new | shared |
| `src/flags.ts` | `isTasksEnabled()` | new | shared |
| `src/vite-env.d.ts` | `ImportMetaEnv` gains `VITE_FF_TASKS?: string` | modified | shared |
| `src/App.tsx` | main region renders `<TaskScreen/>` when the flag is on | modified | shared |
| `src/features/**` | one stub per feature export (table in §4 "Feature files") | new | the feature |
| `docs/contracts/tasks.md` | the contract document | new | shared |
| `playwright.config.ts` | `webServer.env: { VITE_FF_TASKS: 'true' }` | modified | shared |
| `e2e/frame.spec.ts` | add: no console errors or page errors on load | modified | shared |
| `src/App.test.tsx`, `src/tasks/*.test.ts(x)` | tests (§7) | modified / new | shared |

### Data model and contract types (`src/tasks/types.ts`)
```ts
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;          // trimmed, non-empty
  notes: string;          // '' when none
  priority: Priority;
  dueDate: string | null; // 'YYYY-MM-DD' or null
  completed: boolean;
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
}

export type TaskDraft = Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate'>;
export type TaskPatch = Partial<TaskDraft>;

export type StatusFilter = 'all' | 'active' | 'completed';
export interface TaskFilter { status: StatusFilter; query: string }
export const DEFAULT_FILTER: TaskFilter = { status: 'all', query: '' };

/** Deterministic dependencies injected into the pure operations. */
export interface TaskEnv { createId: () => string; now: () => string }
```

### Storage (`src/tasks/storage.ts`)
```ts
export interface TaskStorage {
  /** The saved tasks; [] when nothing is saved. Throws TaskStorageError when saved data cannot be read. */
  load(): Task[];
  /** Replaces the saved tasks. Throws TaskStorageError when the write fails (quota, unavailable). */
  save(tasks: Task[]): void;
}
export class TaskStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) { super(message, options); this.name = 'TaskStorageError'; }
}
```
Synchronous, because `localStorage` is; an async backend would be a contract change (§11 Q3).

### Store (`src/tasks/taskReducer.ts`, `src/tasks/useTasks.ts`)
```ts
export interface TaskState { tasks: Task[]; filter: TaskFilter; storageError: TaskStorageError | null }

export type TaskAction =
  | { type: 'add'; draft: TaskDraft; env: TaskEnv }
  | { type: 'update'; id: string; patch: TaskPatch; now: string }
  | { type: 'toggle'; id: string; now: string }
  | { type: 'delete'; id: string }
  | { type: 'clearCompleted' }
  | { type: 'setFilter'; filter: Partial<TaskFilter> }
  | { type: 'storageFailed'; error: TaskStorageError }
  | { type: 'dismissStorageError' };

export interface UseTasksOptions { storage: TaskStorage; createId?: () => string; now?: () => string }

export interface TaskStore {
  tasks: Task[];          // every task, in stored order
  visibleTasks: Task[];   // sortTasks(filterTasks(tasks, filter))
  completedCount: number;
  filter: TaskFilter;
  storageError: TaskStorageError | null;
  addTask(draft: TaskDraft): void;
  updateTask(id: string, patch: TaskPatch): void;
  toggleTask(id: string): void;
  deleteTask(id: string): void;
  clearCompleted(): void;
  setFilter(filter: Partial<TaskFilter>): void;
  dismissStorageError(): void;
}
export function useTasks(options: UseTasksOptions): TaskStore;
```
Behaviour implemented in this issue (it is the shared wiring, not a feature):
- `useReducer(taskReducer, …, init)`: `init` calls `storage.load()` once; if it throws `TaskStorageError`, start with `[]` and that error as `storageError`.
- The reducer's `add`/`update`/`toggle`/`delete`/`clearCompleted` cases call the feature functions below and nothing else; `env`/`now` are computed in the hook's action creators (defaults `crypto.randomUUID` and `new Date().toISOString()`), so the reducer stays pure under StrictMode.
- An effect saves `tasks` whenever the array identity changes after the initial load (not on mount, so loading never rewrites storage). A thrown `TaskStorageError` dispatches `storageFailed`; tasks stay as they are. Any other thrown error is rethrown.
- `visibleTasks` and `completedCount` are derived with `useMemo`.

### Feature files: owners, exports and stubs
Each feature lives in `src/features/<feature>/`. Pure functions take and return immutable arrays; the stub returns its input unchanged (or `0`/`null`). Components' stubs return `null`.

| Feature | File | Export | Stub |
|---|---|---|---|
| F1 Add | `src/features/add/addTask.ts` | `addTask(tasks: Task[], draft: TaskDraft, env: TaskEnv): Task[]` | `return tasks` |
| F1 | `src/features/add/AddTaskForm.tsx` | `AddTaskForm(props: AddTaskFormProps)` | `null` |
| F2 Order and complete | `src/features/complete/sortTasks.ts` | `sortTasks(tasks: Task[]): Task[]` | `return tasks` |
| F2 | `src/features/complete/toggleTask.ts` | `toggleTask(tasks: Task[], id: string, now: string): Task[]` | `return tasks` |
| F2 | `src/features/complete/TaskList.tsx` | `TaskList(props: TaskListProps)` (renders each task, its completion checkbox, and `renderActions(task)`) | `null` |
| F3 Edit and delete | `src/features/edit/updateTask.ts` | `updateTask(tasks: Task[], id: string, patch: TaskPatch, now: string): Task[]` | `return tasks` |
| F3 | `src/features/edit/deleteTask.ts` | `deleteTask(tasks: Task[], id: string): Task[]` | `return tasks` |
| F3 | `src/features/edit/TaskItemActions.tsx` | `TaskItemActions(props: TaskItemActionsProps)` (edit in a `Dialog`, delete behind an `AlertDialog`) | `null` |
| F4 Filter, search, clear | `src/features/filter/filterTasks.ts` | `filterTasks(tasks: Task[], filter: TaskFilter): Task[]` | `return tasks` |
| F4 | `src/features/filter/clearCompleted.ts` | `clearCompleted(tasks: Task[]): Task[]` | `return tasks` |
| F4 | `src/features/filter/TaskFilterBar.tsx` | `TaskFilterBar(props: TaskFilterBarProps)` | `null` |
| F5 Persistence | `src/features/persistence/localStorageTaskStorage.ts` | `createLocalStorageTaskStorage(storage?: Storage, key?: string): TaskStorage`; `TASKS_STORAGE_KEY = 'todo.tasks.v1'` | `{ load: () => [], save: () => {} }` |
| F5 | `src/features/persistence/StorageErrorBanner.tsx` | `StorageErrorBanner(props: StorageErrorBannerProps)` | `null` |
| F6 Accessibility and journey | `src/features/empty/TaskEmptyState.tsx` | `TaskEmptyState(props: TaskEmptyStateProps)` | `null` |
| F6 | `e2e/tasks.spec.ts` | Playwright journey: add, complete, reload, still complete | not created here (F6 creates it) |
| F6 | `src/features/accessibility/TaskScreen.a11y.test.tsx` | screen-level keyboard, labelling and focus tests | not created here (F6 creates it) |

Each feature also owns `*.test.ts(x)` files next to its files (e.g. `src/features/add/addTask.test.ts`). Feature tests import only from `src/tasks/*` and the feature's own directory.

### Component props (`src/tasks/props.ts`)
```ts
export interface AddTaskFormProps { onAdd(draft: TaskDraft): void }
export interface TaskListProps {
  tasks: Task[];                              // already filtered and sorted
  onToggle(id: string): void;
  renderActions(task: Task): ReactNode;       // F3's TaskItemActions, slotted by TaskScreen
}
export interface TaskItemActionsProps { task: Task; onUpdate(id: string, patch: TaskPatch): void; onDelete(id: string): void }
export interface TaskFilterBarProps {
  filter: TaskFilter; onFilterChange(filter: Partial<TaskFilter>): void;
  completedCount: number; onClearCompleted(): void;
}
export interface StorageErrorBannerProps { error: TaskStorageError | null; onDismiss(): void }
export interface TaskEmptyStateProps { totalCount: number; filter: TaskFilter } // totalCount 0 → "no tasks yet", else "nothing matches"
```
Props live in a `.ts` file, not beside the components, so a feature's component file can change without touching the contract and `react-refresh` stays satisfied.

### Accessibility rules every feature meets in its own files
Written into the contract doc: every control has an accessible name (visible label preferred); everything works by keyboard alone with a visible focus; after an action that removes the focused element (delete, clear completed, closing a dialog), focus moves somewhere sensible, which the feature owning the action decides and tests. F6 owns screen-level tests of these rules and the empty state; if it finds a fault in another feature's file, the fix goes through that feature (or a new issue), not F6's edit.

### Error handling and edge cases
- `load()` throws → empty list, error shown by F5's banner; the next successful save overwrites what could not be read. Whether to back up unreadable data first is F5's decision inside its own file (§9).
- `save()` throws → tasks stay in memory, `storageError` set; the next change tries saving again; a success does **not** clear the error by itself (the user dismisses it). F5 may revisit in its own issue only if it needs a contract change.
- Unknown id in update/toggle/delete → the feature function returns the array unchanged (documented in the contract).
- StrictMode double-invokes reducers and `init`: both are pure apart from `storage.load()`, which is read-only.

### Security, performance, observability
Task text is rendered as React text, never as HTML (rule in the contract doc). Lists are small (hundreds at most); no virtualisation.

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Where feature logic lives | Each operation is a pure function in its feature's file; the shared reducer only dispatches to them | Features own behaviour without editing the shared reducer; pure functions are trivially unit-tested | One reducer file all features edit (breaks "no two features edit the same file"); a feature-registry/plugin system (over-engineered for six features) |
| State management | `useReducer` in one `useTasks` hook, passed down as props | No new dependency; the screen is one level deep | Context (unneeded with one level); Zustand/Redux (new dependency, `package.json` change) |
| Storage interface | Synchronous `load`/`save` of the whole list, errors as `TaskStorageError` | Matches `localStorage`; whole-list writes keep it simple at this size | Async interface (complexity with no async backend in scope); per-task CRUD storage (unneeded) |
| How F3's controls reach F2's items | `renderActions` slot on `TaskList` | F2 owns the item markup, F3 its controls; neither edits the other's file | F3 editing `TaskList` (shared file); F3 rendering its own list (duplication) |
| Editing UI | `Dialog` from F3's `TaskItemActions` | Keeps editing inside F3's file | Inline editing (needs F2's item markup) |
| Dates | `dueDate` as `YYYY-MM-DD` | No time-zone shift; matches date inputs | `Date` objects or ISO timestamps (not JSON-stable / shift by zone) |
| Flag granularity | One flag, `VITE_FF_TASKS`, gates `TaskScreen` | A stub renders nothing, so per-feature flags gate nothing extra; one switch keeps the e2e setup single | A flag per feature (six flags gating `null`) |
| Props location | `src/tasks/props.ts` | Contract types in one place; satisfies `react-refresh` | Props next to each component (contract would sit in feature-owned files) |

**Proposed ADR (flag for architect review): feature-owned pure operations behind a shared reducer.** *Context:* six features are built in parallel against one store; none may edit another's file. *Decision:* the shared `taskReducer` maps each action to exactly one feature-owned pure function; `TaskScreen` slots feature-owned components. *Options:* a single shared reducer; a registry where features register handlers; this delegation. *Trade-offs:* delegation adds one import per operation and fixes the action set now; the registry would allow new actions without a contract change but adds indirection and ordering questions. *Consequences:* adding an action or changing a signature is a contract change and needs its own issue (AC3); features can be merged in any order because every stub already satisfies the types.

## 6. Implementation tasks

### T1. Contract types, storage interface and flag (S)
- Goal: the type-checked contract exists.
- Changes: `src/tasks/types.ts`, `src/tasks/storage.ts`, `src/tasks/props.ts`, `src/flags.ts`.
- Details: as §4. `src/flags.ts`: `export function isTasksEnabled(): boolean { return import.meta.env.VITE_FF_TASKS === 'true'; }` and declare `VITE_FF_TASKS?: string` in `ImportMetaEnv` (in `src/vite-env.d.ts`, which is shared). Types only, plus `DEFAULT_FILTER` and `TaskStorageError`.
- Done when: `npm run typecheck` and `npm run lint` pass (AC5).
- Tests: `src/tasks/storage.test.ts`: `TaskStorageError` is an `Error` with `name` `'TaskStorageError'` and keeps `cause`. `src/flags.test.ts`: on only for `'true'` (`vi.stubEnv`).
- Depends on: none.

### T2. Feature stubs (S)
- Goal: every feature file in §4's table exists with its stub.
- Changes: the 14 files under `src/features/` in §4's table (not `e2e/tasks.spec.ts` or the a11y test, which F6 creates).
- Details: each starts with a one-line comment `// Stub owned by F<n> (<name>); see docs/contracts/tasks.md.` Unused parameters prefixed with `_` or `void`-ed so lint passes without disabling rules.
- Done when: typecheck and lint pass; each stub matches its contract signature (AC6).
- Tests: none per stub; T3/T4 exercise them.
- Depends on: T1.

### T3. Store: reducer and `useTasks` (M)
- Goal: the shared wiring works with any implementation of the feature functions.
- Changes: `src/tasks/taskReducer.ts`, `src/tasks/useTasks.ts`, tests.
- Details: as §4 "Store".
- Done when: the tests below pass (AC5, AC6).
- Tests:
  - `src/tasks/taskReducer.test.ts`: with `vi.mock` of each feature module, every action calls its feature function with the right arguments and stores the result; `setFilter` merges; `storageFailed`/`dismissStorageError` set/clear the error.
  - `src/tasks/useTasks.test.tsx` (`renderHook`, a fake `TaskStorage`, `addTask` mocked to append): loads once on mount and does not save on mount; saves after a change; a `save` that throws `TaskStorageError` sets `storageError` and keeps the tasks; a `load` that throws starts empty with the error; `visibleTasks` is `sortTasks(filterTasks(…))`.
- Depends on: T2.

### T4. Composition root and App wiring (S)
- Goal: `TaskScreen` renders every feature stub; App mounts it behind the flag.
- Changes: `src/tasks/TaskScreen.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/tasks/TaskScreen.test.tsx`.
- Details: `TaskScreen({ storage = createLocalStorageTaskStorage(), createId, now }: Partial<UseTasksOptions>)` — create the default storage once (`useState(() => …)`). Layout with Astryx `VStack`; heading "Tasks" via Astryx `Heading`, `id` from `useId()`. In `App.tsx` replace `children={null}` with `children={isTasksEnabled() ? <TaskScreen /> : null}` and update the comment.
- Done when: with the flag on, `npm run dev` shows the frame and a "Tasks" heading, no console errors (AC2).
- Tests:
  - `src/App.test.tsx`: keep both existing tests (flag unset: main empty); add: with `vi.stubEnv('VITE_FF_TASKS', 'true')`, main contains the "Tasks" region.
  - `src/tasks/TaskScreen.test.tsx`: renders with all stubs and a fake storage; spies on `console.error`/`console.warn` and asserts none were called; with each feature component mocked (`vi.mock`) to a marker, asserts each one is rendered with props of the contract shape (TaskList when `visibleTasks` is non-empty, TaskEmptyState when empty) (AC6).
- Depends on: T3.

### T5. E2E: frame with the task screen, no console errors (S)
- Goal: AC2 checked in a real browser.
- Changes: `playwright.config.ts` (`webServer.env: { VITE_FF_TASKS: 'true' }`), `e2e/frame.spec.ts`.
- Details: new test collects `page.on('console')` messages of type `error` and `page.on('pageerror')` before `goto('/')`, waits for the "Tasks" heading, asserts both lists are empty. Existing frame tests stay as they are and must still pass with the flag on.
- Done when: `npm run test:e2e` passes, also with `CI=1` (AC2, AC4).
- Tests: this task is the tests.
- Depends on: T4.

### T6. The contract document (S)
- Goal: `docs/contracts/tasks.md`, the document feature issues are planned against.
- Changes: `docs/contracts/tasks.md`; link it from `README.md` (one line).
- Details, sections: (1) **Contract types**: link each file of the shared table in §4 and summarise its exports; (2) **Ownership**: one table per feature F1–F6 listing the files it may change, what each exports (signature) and its tests (the named test files, plus "any `*.test.ts(x)` in its directory"), copied from §4 so it matches the code; (3) **Shared files**: the list, and "features do not edit these"; (4) **Rules**: stubs are replaced, not wrapped; feature functions are pure and return the same array for an unknown id; text rendered as text; the accessibility rules in §4; (5) **Changing the contract**: "After #4, changing a contract type, signature, prop, action or file owner needs an issue of its own, which updates this document in the same pull request"; (6) **Flag**: `VITE_FF_TASKS`.
- Done when: every file under `src/features/` appears exactly once in the ownership tables, and the signatures match the code (AC1, AC3, AC6).
- Tests: review (document). Optionally `src/tasks/contractDoc.test.ts` reads the doc and asserts every file under `src/features/` is named exactly once — recommended, cheap and keeps doc and code in step.
- Depends on: T2 (can run in parallel with T3–T5).

### Sequence
T1 → T2 → T3 → T4 → T5; T6 in parallel after T2. Total about 2 days (M + five S). Finish with CI's sequence on a fresh clone (AC4).

## 7. Test strategy
| Acceptance criterion | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1 | T6 | review + doc test | each feature lists files, exports, tests |
| AC2 | T4, T5 | unit + e2e | frame and stubbed screen render; no console errors/page errors |
| AC3 | T6 | review | the "Changing the contract" section exists |
| AC4 | all | CI | the five scripts pass |
| AC5 | T1, T3 | typecheck + unit | contract types compile; store wiring honours them |
| AC6 | T2, T4, T6 | unit + doc test | every feature component rendered by `TaskScreen`; each feature file owned once |

Regression risk: `src/App.test.tsx`'s "main is empty" holds only with the flag off — keep it, unchanged, as the flag-off case. The frame e2e tests now run with the flag on; they don't depend on the main region's content. Test data: none.

## 8. Rollout and rollback

**Feature flag: `VITE_FF_TASKS`** (environment variable, read at build time by Vite), off unless `"true"`. Off: the main region is empty, exactly as today. On: `TaskScreen` with the stubs. Playwright's dev server sets it on; production builds leave it off until the features land and someone turns it on (by setting the variable at build time). Each feature issue ships behind the same flag. No migrations, no stored data yet (the storage stub writes nothing). Rollback: revert the merge commit, or leave the flag off.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A feature needs something the contract lacks (e.g. inline edit inside F2's item, async storage) | Medium | Medium | Slots and props chosen for the listed features; changes go through their own issue (AC3) |
| Doc and code drift | Medium | Medium | Optional doc test in T6 |
| `load()` failure followed by a save overwrites unreadable data | Low | Medium | F5 may back up the raw value under another key inside its own file |
| StrictMode double effects save twice | Low | Low | Save is idempotent (whole list); skip the mount save via a ref of the last saved array |

## 10. Technical debt
None taken on. The fixed action set is deliberate (see the ADR).

## 11. Open questions
| # | Question | Who can answer | Blocks | Assumption made |
|---|---|---|---|---|
| 1 | One flag for the whole task screen, or one per feature? | plan gate | nothing | one, `VITE_FF_TASKS` |
| 2 | Is `'low' \| 'medium' \| 'high'` (default medium) the right priority scale? | product owner | nothing | yes |
| 3 | Synchronous storage (`localStorage`) is enough; no server sync planned? | product owner | nothing | yes |
| 4 | Should a successful save after a failure clear the error banner automatically? | product owner (F5) | nothing | no: the user dismisses it |

## 12. Follow-ups
- Turn `VITE_FF_TASKS` on in production builds once F1–F6 are merged (its own issue).
