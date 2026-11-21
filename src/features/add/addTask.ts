// Owned by F1 (Add); see docs/contracts/tasks.md.
import type { Task, TaskDraft, TaskEnv } from '../../tasks/types';

/**
 * Returns a new list with a task made from the draft in front of the given tasks.
 * A blank title returns the same list, so the store neither re-renders nor saves.
 */
export function addTask(tasks: Task[], draft: TaskDraft, env: TaskEnv): Task[] {
  const title = draft.title.trim();
  if (title === '') return tasks;

  const at = env.now();
  const task: Task = {
    id: env.createId(),
    title,
    notes: draft.notes.trim(),
    priority: draft.priority,
    dueDate: draft.dueDate || null,
    completed: false,
    createdAt: at,
    updatedAt: at,
  };
  return [task, ...tasks];
}
