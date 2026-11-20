// Stub owned by F4 (Filter, search, clear); see docs/contracts/tasks.md.
import type { Task } from '../../tasks/types';

/** Returns the tasks without the completed ones; active tasks are never removed. */
export function clearCompleted(tasks: Task[]): Task[] {
  return tasks;
}
