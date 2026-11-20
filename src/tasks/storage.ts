// Shared contract (#4). Changing anything here needs an issue of its own: see docs/contracts/tasks.md.
import type { Task } from './types';

/** Where the task list is kept. Synchronous, because localStorage is. */
export interface TaskStorage {
  /** The saved tasks; [] when nothing is saved. Throws TaskStorageError when saved data cannot be read. */
  load(): Task[];
  /** Replaces the saved tasks. Throws TaskStorageError when the write fails (quota, unavailable). */
  save(tasks: Task[]): void;
}

/** The only error a TaskStorage throws. Anything else is a bug and is not caught by the store. */
export class TaskStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TaskStorageError';
  }
}
