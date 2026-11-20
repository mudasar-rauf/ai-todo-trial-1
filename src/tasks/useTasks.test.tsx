import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTask } from '../features/add/addTask';
import { sortTasks } from '../features/complete/sortTasks';
import { toggleTask } from '../features/complete/toggleTask';
import { filterTasks } from '../features/filter/filterTasks';
import { makeTask } from '../test/taskFixtures';
import { TaskStorageError, type TaskStorage } from './storage';
import type { Task, TaskDraft } from './types';
import { useTasks } from './useTasks';

vi.mock('../features/add/addTask', () => ({ addTask: vi.fn() }));
vi.mock('../features/complete/toggleTask', () => ({ toggleTask: vi.fn() }));
vi.mock('../features/complete/sortTasks', () => ({ sortTasks: vi.fn() }));
vi.mock('../features/filter/filterTasks', () => ({ filterTasks: vi.fn() }));

const NOW = '2026-03-03T12:00:00.000Z';
const draft: TaskDraft = { title: 'Walk the dog', notes: '', priority: 'high', dueDate: '2026-03-04' };

function fakeStorage(saved: Task[] = []) {
  return { load: vi.fn<TaskStorage['load']>(() => saved), save: vi.fn<TaskStorage['save']>() };
}

function render(storage: TaskStorage, wrapper?: (props: { children: ReactNode }) => ReactNode) {
  return renderHook(() => useTasks({ storage, createId: () => 'new-id', now: () => NOW }), { wrapper });
}

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addTask).mockImplementation((tasks, d, env) => [
      ...tasks,
      makeTask({ ...d, id: env.createId(), createdAt: env.now(), updatedAt: env.now() }),
    ]);
    vi.mocked(toggleTask).mockImplementation((tasks) => tasks);
    vi.mocked(filterTasks).mockImplementation((tasks) => tasks);
    vi.mocked(sortTasks).mockImplementation((tasks) => tasks);
  });

  it('loads the saved tasks once, and does not save on mount', () => {
    const saved = [makeTask({ id: 'a' })];
    const storage = fakeStorage(saved);
    const { result, rerender } = render(storage);
    rerender();
    expect(result.current.tasks).toEqual(saved);
    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('does not save on mount under StrictMode either', () => {
    const storage = fakeStorage([makeTask()]);
    render(storage, StrictMode);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('adds through F1 with the injected id and time, and saves the new list', () => {
    const storage = fakeStorage();
    const { result } = render(storage);
    act(() => result.current.addTask(draft));
    expect(result.current.tasks).toEqual([
      makeTask({ ...draft, id: 'new-id', createdAt: NOW, updatedAt: NOW }),
    ]);
    expect(storage.save).toHaveBeenCalledTimes(1);
    expect(storage.save).toHaveBeenLastCalledWith(result.current.tasks);
  });

  it('passes the injected time to toggle, and saves nothing when the list is unchanged', () => {
    const storage = fakeStorage([makeTask({ id: 'a' })]);
    const { result } = render(storage);
    act(() => result.current.toggleTask('a'));
    expect(toggleTask).toHaveBeenCalledWith(result.current.tasks, 'a', NOW);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('keeps the tasks in memory and sets the error when a save fails', () => {
    const storage = fakeStorage();
    const error = new TaskStorageError('quota exceeded');
    storage.save.mockImplementation(() => {
      throw error;
    });
    const { result } = render(storage);
    act(() => result.current.addTask(draft));
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.storageError).toBe(error);
  });

  it('tries again on the next change, and keeps the error until it is dismissed', () => {
    const storage = fakeStorage();
    storage.save.mockImplementationOnce(() => {
      throw new TaskStorageError('quota exceeded');
    });
    const { result } = render(storage);
    act(() => result.current.addTask(draft));
    act(() => result.current.addTask(draft));
    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(result.current.storageError).not.toBeNull();
    act(() => result.current.dismissStorageError());
    expect(result.current.storageError).toBeNull();
  });

  it('starts empty with the error when the saved tasks cannot be read', () => {
    const storage = fakeStorage();
    const error = new TaskStorageError('unreadable');
    storage.load.mockImplementation(() => {
      throw error;
    });
    const { result } = render(storage);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.storageError).toBe(error);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('does not swallow errors that are not TaskStorageErrors', () => {
    const storage = fakeStorage();
    storage.load.mockImplementation(() => {
      throw new TypeError('bug');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(storage)).toThrow(TypeError);
  });

  it('shows sortTasks(filterTasks(tasks, filter)) and counts the completed tasks', () => {
    const a = makeTask({ id: 'a', completed: true });
    const b = makeTask({ id: 'b' });
    const c = makeTask({ id: 'c', completed: true });
    vi.mocked(filterTasks).mockImplementation((tasks, filter) =>
      filter.query === 'x' ? tasks.slice(0, 2) : tasks,
    );
    vi.mocked(sortTasks).mockImplementation((tasks) => [...tasks].reverse());
    const { result } = render(fakeStorage([a, b, c]));
    act(() => result.current.setFilter({ query: 'x' }));
    expect(filterTasks).toHaveBeenLastCalledWith([a, b, c], { status: 'all', query: 'x' });
    expect(result.current.visibleTasks).toEqual([b, a]);
    expect(result.current.completedCount).toBe(2);
    expect(result.current.filter).toEqual({ status: 'all', query: 'x' });
  });
});
