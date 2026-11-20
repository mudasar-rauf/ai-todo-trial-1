// Stub owned by F4 (Filter, search, clear); see docs/contracts/tasks.md.
import type { Task, TaskFilter } from '../../tasks/types';

/** Returns the tasks that match the filter's status and query. */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  void filter;
  return tasks;
}
