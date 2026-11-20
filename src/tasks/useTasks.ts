// Shared contract (#4): the one store every feature reads and writes through.
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { sortTasks } from '../features/complete/sortTasks';
import { filterTasks } from '../features/filter/filterTasks';
import { TaskStorageError, type TaskStorage } from './storage';
import { initialTaskState, taskReducer, type TaskState } from './taskReducer';
import type { Task, TaskDraft, TaskFilter, TaskPatch } from './types';

export interface UseTasksOptions {
  storage: TaskStorage;
  /** Defaults to crypto.randomUUID. */
  createId?: () => string;
  /** The current time as ISO 8601; defaults to new Date().toISOString(). */
  now?: () => string;
}

export interface TaskStore {
  /** Every task, in stored order. */
  tasks: Task[];
  /** sortTasks(filterTasks(tasks, filter)). */
  visibleTasks: Task[];
  completedCount: number;
  filter: TaskFilter;
  storageError: TaskStorageError | null;
  addTask(draft: TaskDraft): void;
  updateTask(id: string, patch: TaskPatch): void;
  toggleTask(id: string): void;
  deleteTask(id: string): void;
  clearCompleted(): void;
  setFilter(filter: Partial<TaskFilter>): void;
  dismissStorageError(): void;
}

const defaultCreateId = () => crypto.randomUUID();
const defaultNow = () => new Date().toISOString();

function loadInitialState(storage: TaskStorage): TaskState {
  try {
    return { ...initialTaskState, tasks: storage.load() };
  } catch (error) {
    if (error instanceof TaskStorageError) return { ...initialTaskState, storageError: error };
    throw error;
  }
}

export function useTasks({ storage, createId = defaultCreateId, now = defaultNow }: UseTasksOptions): TaskStore {
  const [state, dispatch] = useReducer(taskReducer, storage, loadInitialState);
  const { tasks, filter, storageError } = state;

  // The list as last loaded or saved: saving only when it changes means loading never rewrites storage.
  const lastSaved = useRef(tasks);
  useEffect(() => {
    if (tasks === lastSaved.current) return;
    lastSaved.current = tasks;
    try {
      storage.save(tasks);
    } catch (error) {
      if (!(error instanceof TaskStorageError)) throw error;
      dispatch({ type: 'storageFailed', error });
    }
  }, [tasks, storage]);

  // Ids and times are taken here, not in the reducer, so the reducer stays pure under StrictMode.
  const actions = useMemo(
    () => ({
      addTask: (draft: TaskDraft) => dispatch({ type: 'add', draft, env: { createId, now } }),
      updateTask: (id: string, patch: TaskPatch) => dispatch({ type: 'update', id, patch, now: now() }),
      toggleTask: (id: string) => dispatch({ type: 'toggle', id, now: now() }),
      deleteTask: (id: string) => dispatch({ type: 'delete', id }),
      clearCompleted: () => dispatch({ type: 'clearCompleted' }),
      setFilter: (next: Partial<TaskFilter>) => dispatch({ type: 'setFilter', filter: next }),
      dismissStorageError: () => dispatch({ type: 'dismissStorageError' }),
    }),
    [createId, now],
  );

  const visibleTasks = useMemo(() => sortTasks(filterTasks(tasks, filter)), [tasks, filter]);
  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);

  return { tasks, visibleTasks, completedCount, filter, storageError, ...actions };
}
