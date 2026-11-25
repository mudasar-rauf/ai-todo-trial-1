import type { Task } from '../../tasks/types';

/**
 * Returns the tasks without the completed ones; active tasks are never removed.
 * When no task is completed it returns the input array itself, so the store sees no change
 * and saves nothing (docs/contracts/tasks.md, section 4).
 */
export function clearCompleted(tasks: Task[]): Task[] {
  if (!tasks.some((task) => task.completed)) return tasks;
  return tasks.filter((task) => !task.completed);
}
