# Technical Plan: #15 An unexpected error in the task screen blanks the whole page

**Ticket:** #15   **Spec:** [docs/specs/15-unexpected-error-blanks-page.md](../specs/15-unexpected-error-blanks-page.md)   **Status:** Draft

## 1. Summary

Add a React error boundary, `TaskScreenErrorBoundary`, and wrap `<TaskScreen />` in it inside `src/App.tsx`, so an error thrown by the task screen (during render or in an effect) replaces only the main region's content with a "Something went wrong" message and a Reload button, while the `TopNav` banner stays. The boundary logs the error with `console.error` and reloads with `window.location.reload()`. `useTasks` is untouched, so `TaskStorageError` keeps going to `StorageErrorBanner` as today. It ships behind the existing `VITE_FF_TASKS` flag, since it only wraps the task screen. One task, size S.

## 2. Requirements

### Acceptance criteria
| ID | Criterion (short) | Source |
|---|---|---|
| AC1 | Task screen throws (render or effect): banner stays, main shows "something went wrong" and a Reload button | ticket |
| AC2 | Reload reloads the page | ticket |
| AC3 | The error is still logged to the console | ticket |
| AC4 | A `TaskStorageError` save failure is handled as today | ticket |
| AC5 | A test makes the task screen throw and checks the message and the button | ticket |
| AC6 | Contract section 3 lists the new shared file; CI passes | ticket |
| AC7 | Flag off: main region still empty | derived |
| AC8 | Message announced; Reload button named and keyboard-operable | derived |

### Non-functional requirements
- Accessibility (contract section 4): the fallback is in a `role="alert"` container so it is announced; the button is a real button with the visible name "Reload".
- No new dependency.

### Out of scope
`src/tasks/useTasks.ts`, any contract type, `src/App.test.tsx`, anything under `src/features/`. Reporting errors anywhere other than the console. Recovering without a reload ("Try again" that resets the boundary).

### Assumptions
- Message text: heading "Something went wrong", body "The task list hit an unexpected error. Reload the page to try again.", button "Reload". Wording may change; tests match "Something went wrong" and the button name "Reload".
- `@astryxdesign/core` has a `Button` export (`@astryxdesign/core/Button`); the contract already names Astryx `Dialog` and `AlertDialog`, but no file imports `Button` yet, so this was not verified (no `node_modules` in the planning clone). If it is missing, use a native `<button type="button">`.

## 3. Current state

Verified by reading the files:
- `src/App.tsx` renders `<Theme><AppShell topNav={<TopNav …/>} mobileNav={false} children={isTasksEnabled() ? <TaskScreen /> : null} /></Theme>`. `AppShell` renders the `TopNav` as the banner landmark and `children` inside the main landmark (`src/App.test.tsx` checks both). There is no error boundary anywhere.
- `src/main.tsx`: `createRoot(root).render(<StrictMode><App /></StrictMode>)`, no `onCaughtError`/`onUncaughtError` options.
- `src/tasks/useTasks.ts`: `loadInitialState` rethrows any non-`TaskStorageError` from `storage.load()` — this runs in `useReducer`'s initialiser, i.e. **during render**. The save effect rethrows any non-`TaskStorageError` from `storage.save()` — **in an effect**. `TaskStorageError` is turned into `storageError` state in both places and shown by `StorageErrorBanner`.
- `src/tasks/TaskScreen.tsx` accepts `TaskScreenProps = Partial<UseTasksOptions>`, so a test can pass a `storage` whose `load` throws a plain `Error`.
- Every feature is still a stub (`AddTaskForm` renders `null`), so a test cannot add a task through the UI to trigger a save.
- `docs/contracts/tasks.md` section 3 lists the shared files; `src/tasks/contractDoc.test.ts` only parses section 2 (ownership) and the section 5 sentence, so adding a bullet to section 3 does not affect it.

## 4. Proposed design

### Overview
```
App
└─ AppShell
   ├─ topNav: TopNav            ← banner, outside the boundary, always stays
   └─ children (main):
      isTasksEnabled() ? <TaskScreenErrorBoundary><TaskScreen/></TaskScreenErrorBoundary> : null
```
React delivers errors thrown during render, in lifecycle methods and in effects of descendants to the nearest class component with `getDerivedStateFromError`. The boundary sits inside the main landmark, so only the main region's content is swapped.

### Changes by component
| File | Change | New / modified |
|---|---|---|
| `src/tasks/TaskScreenErrorBoundary.tsx` | Class component: `getDerivedStateFromError` → `{ error }`; `componentDidCatch(error, info)` → `console.error(...)`; renders the fallback when `error` is set, else `children` | new |
| `src/App.tsx` | Wrap `<TaskScreen />` in `<TaskScreenErrorBoundary>` inside the existing flag ternary; update the comment | modified |
| `src/tasks/TaskScreenErrorBoundary.test.tsx` | Boundary tests (see section 7) | new |
| `src/App.errorBoundary.test.tsx` | App-level test: banner stays, main shows the fallback (does **not** touch `src/App.test.tsx`) | new |
| `docs/contracts/tasks.md` | Section 3: add a bullet for `src/tasks/TaskScreenErrorBoundary.tsx`; section 1 table: add a row for it (`TaskScreenErrorBoundary`, `TaskScreenErrorBoundaryProps`) | modified |

### Contract
```ts
export interface TaskScreenErrorBoundaryProps {
  children: React.ReactNode;
  /** Called by the Reload button. Defaults to () => window.location.reload(). Injected by tests. */
  onReload?: () => void;
}
export class TaskScreenErrorBoundary extends React.Component<TaskScreenErrorBoundaryProps, { error: unknown }>
```
Fallback markup (shape, not styling):
```tsx
<VStack role="alert" gap={2} padding={4}>
  <Heading level={2}>Something went wrong</Heading>
  <p>The task list hit an unexpected error. Reload the page to try again.</p>
  <Button onClick={onReload}>Reload</Button>   {/* type="button" if native */}
</VStack>
```
Use `Heading`/`VStack` as `TaskScreen` does; if the Astryx `VStack` does not forward `role`, wrap in a `<div role="alert">`.

### Error handling and edge cases
- **Logging (AC3).** `componentDidCatch` calls `console.error('The task screen failed:', error, info.componentStack)`. React 19's default `onCaughtError` also logs caught errors, so in development there may be two entries; that is acceptable and keeps AC3 true whatever root options `main.tsx` ever gets.
- **`TaskStorageError` (AC4).** Never reaches the boundary: `useTasks` catches it before throwing. No change to `useTasks.ts`; the existing `useTasks.test.tsx` and `TaskScreen` tests guard it.
- **Error thrown by the fallback itself.** Fallback is static; nothing in it can throw.
- **StrictMode.** Boundary has no side effects in render; `componentDidCatch` may log once per catch.
- **Focus.** Not moved; `role="alert"` announces the message. The Reload button is reachable by Tab.

## 5. Key decisions
| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Where the boundary sits | Around `<TaskScreen />` inside `App.tsx`'s main slot | Keeps the banner (AC1) and limits the fallback to the main region | Around `<App />` in `main.tsx`: would replace the header too. Inside `TaskScreen.tsx`: errors in `TaskScreen`'s own `useTasks` call would escape it (a boundary only catches its descendants) |
| Implementation | Hand-written class component | ~30 lines; no dependency | `react-error-boundary` package: a new dependency for one use |
| File location | `src/tasks/` | Shared, task-screen specific, next to `TaskScreen.tsx`; already covered by "everything in `src/tasks/`" and listed explicitly per AC6 | `src/` root: fine too, but further from what it wraps |
| Reload testability | `onReload` prop defaulting to `window.location.reload()` | jsdom does not implement navigation and `location.reload` is not spy-able reliably | Mocking `window.location` globally: brittle |
| Logging | Explicit `console.error` in `componentDidCatch` | AC3 holds regardless of root options | Relying on React's default `onCaughtError` only |

No significant (ADR-level) decision.

## 6. Implementation tasks

### T1. Error boundary around the task screen (S)
- Goal: an error in the task screen leaves the banner and shows the fallback in main.
- Changes: `src/tasks/TaskScreenErrorBoundary.tsx` (new), `src/App.tsx`, `src/tasks/TaskScreenErrorBoundary.test.tsx` (new), `src/App.errorBoundary.test.tsx` (new), `docs/contracts/tasks.md` sections 1 and 3.
- Details: follow section 4's contract. Write the tests first. Keep `App.tsx`'s flag ternary; with the flag off render `null` exactly as now (do not wrap `null` in the boundary, so `App.test.tsx`'s "main is empty" stays trivially true). Check `Button` exists in `node_modules/@astryxdesign/core` after `npm ci`.
- Done when: all tests in section 7 pass; `npm run typecheck`, `lint`, `test`, `build`, `test:e2e` pass; `src/App.test.tsx`, `src/tasks/useTasks.ts` and `src/features/` are unchanged in the diff.
- Tests: section 7.
- Depends on: none.

### Sequence
One task, S.

## 7. Test strategy
| AC | Tasks | Test type | What the test verifies |
|---|---|---|---|
| AC1, AC5 (render) | T1 | component (`TaskScreenErrorBoundary.test.tsx`) | `<TaskScreenErrorBoundary><TaskScreen storage={{ load: () => { throw new Error('boom') }, save: vi.fn() }} /></…>`: `getByRole('alert')` contains "Something went wrong"; `getByRole('button', { name: 'Reload' })` exists; no `Tasks` region |
| AC1 (effect) | T1 | component | A test-only child that throws in `useEffect` (the save effect cannot be reached while `AddTaskForm` is a stub): fallback shows |
| AC1 (banner) | T1 | component (`App.errorBoundary.test.tsx`) | `vi.stubEnv('VITE_FF_TASKS','true')`, `vi.mock('./tasks/TaskScreen', …)` with a `TaskScreen` that throws: exactly one `banner` with `APP_NAME`; `main` contains "Something went wrong" and the Reload button |
| AC2 | T1 | component | `onReload` spy called once after `userEvent.click` on Reload; also once after focusing it and pressing Enter (AC8). The default is `() => window.location.reload()` — one line, checked by review |
| AC3 | T1 | component | `vi.spyOn(console, 'error').mockImplementation(() => {})`; after the throw, some call's arguments include the thrown `Error` instance |
| AC4 | T1 | existing unit tests | `useTasks.test.tsx` save-failure tests stay green and unchanged; add one boundary test: `load` throws `TaskStorageError` → `Tasks` region renders, no alert fallback |
| AC6 | T1 | review + CI | Section 3 bullet present; `contractDoc.test.ts` green |
| AC7 | T1 | existing | `src/App.test.tsx` flag-off test stays green (unchanged file) |
| AC8 | T1 | component | Fallback has `role="alert"`; button reachable with `userEvent.tab()` |

Mute expected `console.error` in throwing tests with `mockImplementation` and restore in `afterEach` (`vi.restoreAllMocks`), as `TaskScreen.test.tsx` does with spies. Regression risk: `App.test.tsx`'s flag-on test (the boundary must render children transparently) — covered by it as is.

## 8. Rollout and rollback

Feature flag: the existing **`VITE_FF_TASKS`** build-time variable (off by default, `src/flags.ts`). The boundary only renders where the task screen renders, so with the flag off nothing changes; no new flag is needed. No migrations or config. Rollback: revert the pull request.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Astryx `VStack` does not pass `role` through | Medium | Low | Wrap in a plain `div role="alert"` |
| Double console log in dev confuses someone | Low | Low | Message prefix "The task screen failed:" makes the boundary's entry identifiable |
| Errors thrown in event handlers or async code are not caught by boundaries | Known | Low | Out of scope; today's failure (`useTasks` save effect) is an effect error, which is caught |

## 10. Technical debt
None taken on.

## 11. Open questions
None blocking.

## 12. Follow-ups
- A "Try again" that resets the boundary without a full reload.
- An end-to-end check of the fallback once a feature can trigger a save failure in the browser.
