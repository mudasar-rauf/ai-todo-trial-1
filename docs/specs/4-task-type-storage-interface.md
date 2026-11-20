# Spec: #4 One Task type and one storage interface that every feature shares

**Issue:** #4   **Plan:** [docs/plans/4-task-type-storage-interface.md](../plans/4-task-type-storage-interface.md)

## User story

As a developer (or agent) building one of the todo app's features, I want a fixed contract to build against: the Task type, the storage interface, the store's shape, each component's props, and which files my feature owns. A composition root already renders a stub for every feature, so I fill in my own files and no two features edit the same file.

The features the contract covers:

| Feature | What it is |
|---|---|
| F1 Add | adding a task with title, notes, priority and due date |
| F2 Order and complete | incomplete tasks first, and toggling complete |
| F3 Edit and delete | editing fields, and deleting with confirmation |
| F4 Filter, search, clear | filtering, searching, and clearing completed tasks without losing active ones |
| F5 Persistence | tasks surviving a reload; a failed write shows an error and keeps the list in memory |
| F6 Accessibility and journey | keyboard-only use, labelled controls, focus, the empty state, and one Playwright path: add, complete, reload, still complete |

This builds on the scaffold (#2), which is merged.

## Acceptance criteria

| ID | Criterion | Source |
|---|---|---|
| AC1 | `docs/contracts/tasks.md` names, for each feature above, the files it may change, what each exports, and its tests. | issue |
| AC2 | The running app still renders the frame with no console errors, while every feature is a stub. | issue |
| AC3 | `docs/contracts/tasks.md` says that changing a contract type after this issue needs an issue of its own. | issue |
| AC4 | CI passes. | issue |
| AC5 | The contract exists as type-checked code: the Task type, the storage interface, the store's shape and every feature component's props are exported TypeScript types, and `docs/contracts/tasks.md` points to them. | derived (issue's Outcome) |
| AC6 | A composition root renders a stub for every feature, and no file is owned by two features: the ownership table in `docs/contracts/tasks.md` lists each feature file exactly once. | derived (issue's Outcome) |

## Out of scope

- Any feature's behaviour beyond its stub.
- `.github/workflows/` (CI cannot be changed) and `package.json` dependencies (the scaffold installed everything).
