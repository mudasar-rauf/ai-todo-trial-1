// Owned by F3 (Edit and delete); see docs/contracts/tasks.md.
import type { Task, TaskDraft, TaskPatch } from '../../tasks/types';

/**
 * The editable fields after the patch: the title trimmed, and an empty title ignored so a task
 * never loses its title. The edit dialog blocks an empty title; this only guards other callers.
 * Only the four editable fields are read, so a patch can never touch id, completed or a timestamp.
 */
function applyPatch(current: Task, patch: TaskPatch): TaskDraft {
  const title = patch.title?.trim();
  return {
    title: title ? title : current.title,
    notes: patch.notes ?? current.notes,
    priority: patch.priority ?? current.priority,
    dueDate: patch.dueDate === undefined ? current.dueDate : patch.dueDate,
  };
}

/** Returns the tasks with the patch applied to the given task; unchanged for an unknown id. */
export function updateTask(tasks: Task[], id: string, patch: TaskPatch, now: string): Task[] {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return tasks;

  const current = tasks[index];
  const next = applyPatch(current, patch);
  const unchanged = (Object.keys(next) as (keyof TaskDraft)[]).every((field) => next[field] === current[field]);
  if (unchanged) return tasks;

  const updated: Task = { ...current, ...next, updatedAt: now };
  return tasks.map((task, i) => (i === index ? updated : task));
}
