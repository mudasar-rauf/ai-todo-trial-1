// Shared contract (#4). Changing anything here needs an issue of its own: see docs/contracts/tasks.md.
import type { ReactNode } from 'react';
import type { TaskStorageError } from './storage';
import type { Task, TaskDraft, TaskFilter, TaskPatch } from './types';

/** F1 Add. */
export interface AddTaskFormProps {
  onAdd(draft: TaskDraft): void;
}

/** F2 Order and complete. */
export interface TaskListProps {
  /** Already filtered and sorted. */
  tasks: Task[];
  onToggle(id: string): void;
  /** F3's TaskItemActions for this task, slotted in by TaskScreen. */
  renderActions(task: Task): ReactNode;
}

/** F3 Edit and delete. */
export interface TaskItemActionsProps {
  task: Task;
  onUpdate(id: string, patch: TaskPatch): void;
  onDelete(id: string): void;
}

/** F4 Filter, search, clear. */
export interface TaskFilterBarProps {
  filter: TaskFilter;
  onFilterChange(filter: Partial<TaskFilter>): void;
  completedCount: number;
  onClearCompleted(): void;
}

/** F5 Persistence. */
export interface StorageErrorBannerProps {
  error: TaskStorageError | null;
  onDismiss(): void;
}

/** F6 Accessibility and journey. totalCount 0 means "no tasks yet"; otherwise "nothing matches". */
export interface TaskEmptyStateProps {
  totalCount: number;
  filter: TaskFilter;
}
