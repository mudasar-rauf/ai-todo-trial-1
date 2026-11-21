// Owned by F2 (Order and complete); see docs/contracts/tasks.md.
import type { Task } from '../../tasks/types';

function byDisplayOrder(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  // ISO 8601 timestamps in UTC compare correctly as strings; newest first.
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? 1 : -1;
}

/**
 * Returns the tasks in display order: incomplete tasks first, then completed ones,
 * each group newest first by createdAt. Stable for equal keys; never mutates its input.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(byDisplayOrder);
}
