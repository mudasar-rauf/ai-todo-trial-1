// Shared contract (#4). Each task action is handed to exactly one feature-owned pure function;
// this file only dispatches. Adding an action is a contract change: see docs/contracts/tasks.md.
import { addTask } from '../features/add/addTask';
import { toggleTask } from '../features/complete/toggleTask';
import { deleteTask } from '../features/edit/deleteTask';
import { updateTask } from '../features/edit/updateTask';
import { clearCompleted } from '../features/filter/clearCompleted';
import type { TaskStorageError } from './storage';
import { DEFAULT_FILTER, type Task, type TaskDraft, type TaskEnv, type TaskFilter, type TaskPatch } from './types';

export interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
  storageError: TaskStorageError | null;
}

export type TaskAction =
  | { type: 'add'; draft: TaskDraft; env: TaskEnv }
  | { type: 'update'; id: string; patch: TaskPatch; now: string }
  | { type: 'toggle'; id: string; now: string }
  | { type: 'delete'; id: string }
  | { type: 'clearCompleted' }
  | { type: 'setFilter'; filter: Partial<TaskFilter> }
  | { type: 'storageFailed'; error: TaskStorageError }
  | { type: 'dismissStorageError' };

export const initialTaskState: TaskState = { tasks: [], filter: DEFAULT_FILTER, storageError: null };

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'add':
      return withTasks(state, addTask(state.tasks, action.draft, action.env));
    case 'update':
      return withTasks(state, updateTask(state.tasks, action.id, action.patch, action.now));
    case 'toggle':
      return withTasks(state, toggleTask(state.tasks, action.id, action.now));
    case 'delete':
      return withTasks(state, deleteTask(state.tasks, action.id));
    case 'clearCompleted':
      return withTasks(state, clearCompleted(state.tasks));
    case 'setFilter':
      return { ...state, filter: { ...state.filter, ...action.filter } };
    case 'storageFailed':
      return { ...state, storageError: action.error };
    case 'dismissStorageError':
      return { ...state, storageError: null };
  }
}

/** Keeps the state's identity when a feature returns its input, so nothing re-renders or saves. */
function withTasks(state: TaskState, tasks: Task[]): TaskState {
  return tasks === state.tasks ? state : { ...state, tasks };
}
