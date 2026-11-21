// Owned by F2 (Order and complete); see docs/contracts/tasks.md.
import type { Task } from '../../tasks/types';

/** Returns the tasks with the given task's completion flipped; unchanged for an unknown id. */
export function toggleTask(tasks: Task[], id: string, now: string): Task[] {
  if (!tasks.some((task) => task.id === id)) return tasks;
  return tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed, updatedAt: now } : task));
}
