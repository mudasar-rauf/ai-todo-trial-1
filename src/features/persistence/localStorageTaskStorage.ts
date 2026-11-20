// Stub owned by F5 (Persistence); see docs/contracts/tasks.md.
import type { TaskStorage } from '../../tasks/storage';

export const TASKS_STORAGE_KEY = 'todo.tasks.v1';

/** A TaskStorage over Web Storage (localStorage by default). The stub keeps nothing. */
export function createLocalStorageTaskStorage(storage?: Storage, key: string = TASKS_STORAGE_KEY): TaskStorage {
  void storage;
  void key;
  return { load: () => [], save: () => {} };
}
