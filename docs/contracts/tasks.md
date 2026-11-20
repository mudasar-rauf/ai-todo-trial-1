# Contract: tasks

The contract every task feature (F1–F6) builds against, set by #4. It names the shared types, the files each feature owns, what each file exports, and each feature's tests. A composition root (`TaskScreen`) already renders every feature, so each feature changes only its own files.

`src/tasks/contractDoc.test.ts` checks this document against the code: every file under `src/features/` is owned exactly once below, and every export named here exists. Change both together.

## 1. Contract types

| File | Exports |
|---|---|
| [`src/tasks/types.ts`](../../src/tasks/types.ts) | `Task`, `Priority`, `DEFAULT_PRIORITY`, `TaskDraft` (title, notes, priority, dueDate), `TaskPatch` (`Partial<TaskDraft>`), `StatusFilter`, `TaskFilter`, `DEFAULT_FILTER`, `TaskEnv` (`createId`, `now`) |
| [`src/tasks/storage.ts`](../../src/tasks/storage.ts) | `TaskStorage` (`load(): Task[]`, `save(tasks: Task[]): void`), `TaskStorageError` |
| [`src/tasks/props.ts`](../../src/tasks/props.ts) | `AddTaskFormProps`, `TaskListProps`, `TaskItemActionsProps`, `TaskFilterBarProps`, `StorageErrorBannerProps`, `TaskEmptyStateProps` |
| [`src/tasks/taskReducer.ts`](../../src/tasks/taskReducer.ts) | `TaskState`, `TaskAction`, `initialTaskState`, `taskReducer` |
| [`src/tasks/useTasks.ts`](../../src/tasks/useTasks.ts) | `UseTasksOptions`, `TaskStore` (the store's shape), `useTasks` |
| [`src/tasks/TaskScreen.tsx`](../../src/tasks/TaskScreen.tsx) | `TaskScreen` (the composition root), `TaskScreenProps` |
| [`src/flags.ts`](../../src/flags.ts) | `isTasksEnabled` |

The data, in short:

- `Task`: `id`, `title` (trimmed, non-empty), `notes` (`''` when none), `priority` (`'low' | 'medium' | 'high'`, default `'medium'`), `dueDate` (`'YYYY-MM-DD'` or `null`, so no time zone shifts it), `completed`, `createdAt` and `updatedAt` (ISO 8601).
- `TaskStorage` is synchronous, like `localStorage`. It throws only `TaskStorageError`. The store treats anything else as a bug and does not catch it.
- The store (`useTasks`) loads once on mount and saves the whole list whenever it changes. It never saves on mount. When a save throws, the tasks stay in memory and `storageError` is set. The next change saves again. A successful save does not clear the error, because the person dismisses it. When the load throws, the store starts empty with the error set.
- The reducer hands each task action to exactly one feature function below and keeps what it returns. Ids and times are taken in `useTasks` and passed in (`TaskEnv`, `now`), so feature functions are pure and their tests need no mocked globals.
- `visibleTasks` is `sortTasks(filterTasks(tasks, filter))`. `TaskScreen` renders `TaskList` when it is non-empty, and `TaskEmptyState` otherwise.

## 2. Ownership

Each feature may change only the files in its table, plus any `*.test.ts(x)` file in its own directory. Feature tests import only from `src/tasks/`, `src/test/` and the feature's own directory.

### F1 Add: adding a task with title, notes, priority and due date

| File | Exports | Tests |
|---|---|---|
| `src/features/add/addTask.ts` | `addTask(tasks: Task[], draft: TaskDraft, env: TaskEnv): Task[]` | `src/features/add/addTask.test.ts` |
| `src/features/add/AddTaskForm.tsx` | `AddTaskForm(props: AddTaskFormProps)` | `src/features/add/AddTaskForm.test.tsx` |

### F2 Order and complete: incomplete tasks first, and toggling complete

| File | Exports | Tests |
|---|---|---|
| `src/features/complete/sortTasks.ts` | `sortTasks(tasks: Task[]): Task[]` | `src/features/complete/sortTasks.test.ts` |
| `src/features/complete/toggleTask.ts` | `toggleTask(tasks: Task[], id: string, now: string): Task[]` | `src/features/complete/toggleTask.test.ts` |
| `src/features/complete/TaskList.tsx` | `TaskList(props: TaskListProps)`: each task, its completion checkbox, and `renderActions(task)` | `src/features/complete/TaskList.test.tsx` |

### F3 Edit and delete: editing fields, and deleting with confirmation

| File | Exports | Tests |
|---|---|---|
| `src/features/edit/updateTask.ts` | `updateTask(tasks: Task[], id: string, patch: TaskPatch, now: string): Task[]` | `src/features/edit/updateTask.test.ts` |
| `src/features/edit/deleteTask.ts` | `deleteTask(tasks: Task[], id: string): Task[]` | `src/features/edit/deleteTask.test.ts` |
| `src/features/edit/TaskItemActions.tsx` | `TaskItemActions(props: TaskItemActionsProps)`: edit in a `Dialog`, delete behind an `AlertDialog` | `src/features/edit/TaskItemActions.test.tsx` |

### F4 Filter, search, clear: filtering, searching, and clearing completed tasks without losing active ones

| File | Exports | Tests |
|---|---|---|
| `src/features/filter/filterTasks.ts` | `filterTasks(tasks: Task[], filter: TaskFilter): Task[]` | `src/features/filter/filterTasks.test.ts` |
| `src/features/filter/clearCompleted.ts` | `clearCompleted(tasks: Task[]): Task[]` | `src/features/filter/clearCompleted.test.ts` |
| `src/features/filter/TaskFilterBar.tsx` | `TaskFilterBar(props: TaskFilterBarProps)` | `src/features/filter/TaskFilterBar.test.tsx` |

### F5 Persistence: tasks survive a reload; a failed write shows an error and keeps the list in memory

| File | Exports | Tests |
|---|---|---|
| `src/features/persistence/localStorageTaskStorage.ts` | `createLocalStorageTaskStorage(storage?: Storage, key?: string): TaskStorage`, `TASKS_STORAGE_KEY` (`'todo.tasks.v1'`) | `src/features/persistence/localStorageTaskStorage.test.ts` |
| `src/features/persistence/StorageErrorBanner.tsx` | `StorageErrorBanner(props: StorageErrorBannerProps)` | `src/features/persistence/StorageErrorBanner.test.tsx` |

F5 decides what `load()` does with saved data it cannot read. The store starts empty and the next save overwrites the key, so `load()` should keep the raw value (for example under another key) before it throws.

### F6 Accessibility and journey: keyboard-only use, labelled controls, focus, the empty state, and the Playwright journey

| File | Exports | Tests |
|---|---|---|
| `src/features/empty/TaskEmptyState.tsx` | `TaskEmptyState(props: TaskEmptyStateProps)`: `totalCount` 0 means "no tasks yet", otherwise "nothing matches" | `src/features/empty/TaskEmptyState.test.tsx` |
| `src/features/accessibility/TaskScreen.a11y.test.tsx` | (tests only; F6 creates it) screen-level keyboard, labelling and focus tests | itself |
| `e2e/tasks.spec.ts` | (tests only; F6 creates it) the journey: add, complete, reload, still complete | itself |

F6 owns three places: `src/features/empty/`, `src/features/accessibility/` and `e2e/tasks.spec.ts`. "Any test file in its directory" covers the first two.

Today every file above is a stub. Each starts with `// Stub owned by F<n> (...)`. Its functions return their input unchanged, `createLocalStorageTaskStorage` keeps nothing, and its components render `null`. The test files listed do not exist yet: the feature creates them.

## 3. Shared files

Features do not edit these:

- everything in `src/tasks/` (the files in section 1, and their tests);
- `src/flags.ts`, `src/vite-env.d.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`;
- `src/test/` (the test setup and `taskFixtures.ts`'s `makeTask`);
- `e2e/frame.spec.ts`, `playwright.config.ts`, `vite.config.ts`, `eslint.config.js`, the tsconfig files, `package.json`;
- this document, except as section 5 says.

## 4. Rules

- **Replace the stub.** A feature replaces its stub's body. It does not wrap it, and it keeps the exported name and signature.
- **Pure functions.** Feature functions never mutate their input. They return the same array when nothing changes, which includes an unknown id (`toggleTask`, `updateTask`, `deleteTask`). When the array is the same, the store does not re-render and does not save.
- **Text is text.** Task text is rendered as React text, never as HTML.
- **Accessibility.** Every control has an accessible name, preferably a visible label. Everything works with the keyboard alone and shows a visible focus. After an action removes the focused element (delete, clear completed, closing a dialog), focus moves somewhere sensible. The feature that owns the action decides where, and tests it. F6 tests these rules across the screen. A fault F6 finds in another feature's file is fixed through that feature, or through a new issue, not in F6's files.

## 5. Changing the contract

After #4, changing a contract type, a signature, a prop, an action, or a file's owner needs an issue of its own. That issue updates this document in the same pull request. This applies to everything in sections 1–3. A feature that needs such a change stops and asks for that issue. It does not change the contract inside its own pull request.

## 6. Feature flag

The task screen sits behind `VITE_FF_TASKS`, a build-time environment variable. It is on only when the value is exactly `true`, and it is off by default. When it is off, the main region is empty, as it was before #4. Every feature issue ships behind this flag.

- Turn it on: `VITE_FF_TASKS=true npm run dev` (or `npm run build`).
- The e2e tests set it through `playwright.config.ts`. Locally, Playwright reuses a dev server that is already running, so start that server with the flag on, or stop it first.
- Removal: once F1–F6 are merged, a separate issue turns it on for production builds and then removes it.
