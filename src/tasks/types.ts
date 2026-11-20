// Shared contract (#4). Changing anything here needs an issue of its own: see docs/contracts/tasks.md.

export type Priority = 'low' | 'medium' | 'high';

export const DEFAULT_PRIORITY: Priority = 'medium';

export interface Task {
  id: string;
  /** Trimmed and non-empty. */
  title: string;
  /** '' when there are none. */
  notes: string;
  priority: Priority;
  /** A date-only 'YYYY-MM-DD' string, so no time zone shifts it; null when there is none. */
  dueDate: string | null;
  completed: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** The fields a person fills in when adding a task. */
export type TaskDraft = Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate'>;

/** The fields a person may change when editing a task. */
export type TaskPatch = Partial<TaskDraft>;

export type StatusFilter = 'all' | 'active' | 'completed';

export interface TaskFilter {
  status: StatusFilter;
  query: string;
}

export const DEFAULT_FILTER: TaskFilter = { status: 'all', query: '' };

/** Deterministic dependencies injected into the pure operations, so tests never mock globals. */
export interface TaskEnv {
  createId: () => string;
  /** The current time as an ISO 8601 string. */
  now: () => string;
}
