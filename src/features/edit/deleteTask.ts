// Owned by F3 (Edit and delete); see docs/contracts/tasks.md.
import type { Task } from '../../tasks/types';

/** Returns the tasks without the given task; unchanged for an unknown id. */
export function deleteTask(tasks: Task[], id: string): Task[] {
  if (!tasks.some((task) => task.id === id)) return tasks;
  return tasks.filter((task) => task.id !== id);
}
