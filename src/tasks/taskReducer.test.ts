import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTask } from '../features/add/addTask';
import { toggleTask } from '../features/complete/toggleTask';
import { deleteTask } from '../features/edit/deleteTask';
import { updateTask } from '../features/edit/updateTask';
import { clearCompleted } from '../features/filter/clearCompleted';
import { makeTask } from '../test/taskFixtures';
import { TaskStorageError } from './storage';
import { initialTaskState, taskReducer, type TaskState } from './taskReducer';
import { DEFAULT_FILTER, type TaskDraft, type TaskEnv } from './types';

vi.mock('../features/add/addTask', () => ({ addTask: vi.fn() }));
vi.mock('../features/complete/toggleTask', () => ({ toggleTask: vi.fn() }));
vi.mock('../features/edit/updateTask', () => ({ updateTask: vi.fn() }));
vi.mock('../features/edit/deleteTask', () => ({ deleteTask: vi.fn() }));
vi.mock('../features/filter/clearCompleted', () => ({ clearCompleted: vi.fn() }));

const before = [makeTask({ id: 'a' })];
const after = [makeTask({ id: 'b' })];
const state: TaskState = { ...initialTaskState, tasks: before };
const NOW = '2026-02-02T10:00:00.000Z';

describe('taskReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no tasks, the default filter and no error', () => {
    expect(initialTaskState).toEqual({ tasks: [], filter: DEFAULT_FILTER, storageError: null });
  });

  it('hands add to F1 addTask and keeps its result', () => {
    vi.mocked(addTask).mockReturnValue(after);
    const draft: TaskDraft = { title: 'x', notes: '', priority: 'low', dueDate: null };
    const env: TaskEnv = { createId: () => 'id', now: () => NOW };
    const next = taskReducer(state, { type: 'add', draft, env });
    expect(addTask).toHaveBeenCalledWith(before, draft, env);
    expect(next.tasks).toBe(after);
  });

  it('hands update to F3 updateTask and keeps its result', () => {
    vi.mocked(updateTask).mockReturnValue(after);
    const next = taskReducer(state, { type: 'update', id: 'a', patch: { title: 'y' }, now: NOW });
    expect(updateTask).toHaveBeenCalledWith(before, 'a', { title: 'y' }, NOW);
    expect(next.tasks).toBe(after);
  });

  it('hands toggle to F2 toggleTask and keeps its result', () => {
    vi.mocked(toggleTask).mockReturnValue(after);
    const next = taskReducer(state, { type: 'toggle', id: 'a', now: NOW });
    expect(toggleTask).toHaveBeenCalledWith(before, 'a', NOW);
    expect(next.tasks).toBe(after);
  });

  it('hands delete to F3 deleteTask and keeps its result', () => {
    vi.mocked(deleteTask).mockReturnValue(after);
    const next = taskReducer(state, { type: 'delete', id: 'a' });
    expect(deleteTask).toHaveBeenCalledWith(before, 'a');
    expect(next.tasks).toBe(after);
  });

  it('hands clearCompleted to F4 clearCompleted and keeps its result', () => {
    vi.mocked(clearCompleted).mockReturnValue(after);
    const next = taskReducer(state, { type: 'clearCompleted' });
    expect(clearCompleted).toHaveBeenCalledWith(before);
    expect(next.tasks).toBe(after);
  });

  it('returns the same state when a feature returns the same array', () => {
    vi.mocked(deleteTask).mockImplementation((tasks) => tasks);
    expect(taskReducer(state, { type: 'delete', id: 'unknown' })).toBe(state);
  });

  it('merges setFilter into the current filter', () => {
    const withQuery = taskReducer(state, { type: 'setFilter', filter: { query: 'milk' } });
    expect(withQuery.filter).toEqual({ status: 'all', query: 'milk' });
    const withStatus = taskReducer(withQuery, { type: 'setFilter', filter: { status: 'active' } });
    expect(withStatus.filter).toEqual({ status: 'active', query: 'milk' });
    expect(withStatus.tasks).toBe(before);
  });

  it('sets the storage error and keeps the tasks, and dismisses it', () => {
    const error = new TaskStorageError('full');
    const failed = taskReducer(state, { type: 'storageFailed', error });
    expect(failed.storageError).toBe(error);
    expect(failed.tasks).toBe(before);
    expect(taskReducer(failed, { type: 'dismissStorageError' }).storageError).toBeNull();
  });
});
