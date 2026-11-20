import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddTaskForm } from '../features/add/AddTaskForm';
import { TaskList } from '../features/complete/TaskList';
import { TaskItemActions } from '../features/edit/TaskItemActions';
import { TaskEmptyState } from '../features/empty/TaskEmptyState';
import { TaskFilterBar } from '../features/filter/TaskFilterBar';
import { StorageErrorBanner } from '../features/persistence/StorageErrorBanner';
import { makeTask } from '../test/taskFixtures';
import { TaskStorageError, type TaskStorage } from './storage';
import { TaskScreen } from './TaskScreen';
import { DEFAULT_FILTER } from './types';

// Each feature component is replaced by a marker, so this checks what TaskScreen wires to each.
vi.mock('../features/add/AddTaskForm', () => ({ AddTaskForm: vi.fn(() => <p>AddTaskForm</p>) }));
vi.mock('../features/complete/TaskList', () => ({
  TaskList: vi.fn(({ tasks, renderActions }) => (
    <ul aria-label="TaskList">
      {tasks.map((task: { id: string }) => (
        <li key={task.id}>{renderActions(task)}</li>
      ))}
    </ul>
  )),
}));
vi.mock('../features/edit/TaskItemActions', () => ({
  TaskItemActions: vi.fn(({ task }) => <span>TaskItemActions {task.id}</span>),
}));
vi.mock('../features/filter/TaskFilterBar', () => ({ TaskFilterBar: vi.fn(() => <p>TaskFilterBar</p>) }));
vi.mock('../features/persistence/StorageErrorBanner', () => ({
  StorageErrorBanner: vi.fn(() => <p>StorageErrorBanner</p>),
}));
vi.mock('../features/empty/TaskEmptyState', () => ({ TaskEmptyState: vi.fn(() => <p>TaskEmptyState</p>) }));

function lastProps<P>(component: (props: P) => unknown): P {
  const calls = vi.mocked(component).mock.calls;
  return calls[calls.length - 1][0];
}

const storageWith = (saved = [makeTask({ id: 'a' }), makeTask({ id: 'b', completed: true })]): TaskStorage => ({
  load: () => saved,
  save: vi.fn(),
});

describe('TaskScreen composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders F1, F4 and F5 with the store wired to their props', () => {
    render(<TaskScreen storage={storageWith()} />);

    expect(screen.getByText('StorageErrorBanner')).toBeInTheDocument();
    expect(screen.getByText('AddTaskForm')).toBeInTheDocument();
    expect(screen.getByText('TaskFilterBar')).toBeInTheDocument();

    expect(lastProps(StorageErrorBanner)).toEqual({ error: null, onDismiss: expect.any(Function) });
    expect(lastProps(AddTaskForm)).toEqual({ onAdd: expect.any(Function) });
    expect(lastProps(TaskFilterBar)).toEqual({
      filter: DEFAULT_FILTER,
      onFilterChange: expect.any(Function),
      completedCount: 1,
      onClearCompleted: expect.any(Function),
    });
  });

  it('renders F2 TaskList with F3 TaskItemActions in each item when tasks are visible', () => {
    render(<TaskScreen storage={storageWith()} />);

    expect(screen.getByRole('list', { name: 'TaskList' })).toBeInTheDocument();
    expect(screen.getByText('TaskItemActions a')).toBeInTheDocument();
    expect(screen.getByText('TaskItemActions b')).toBeInTheDocument();
    expect(screen.queryByText('TaskEmptyState')).not.toBeInTheDocument();

    expect(lastProps(TaskList)).toEqual({
      tasks: [expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 'b' })],
      onToggle: expect.any(Function),
      renderActions: expect.any(Function),
    });
    expect(lastProps(TaskItemActions)).toEqual({
      task: expect.objectContaining({ id: 'b' }),
      onUpdate: expect.any(Function),
      onDelete: expect.any(Function),
    });
  });

  it('renders F6 TaskEmptyState instead of the list when no task is visible', () => {
    render(<TaskScreen storage={storageWith([])} />);

    expect(screen.getByText('TaskEmptyState')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'TaskList' })).not.toBeInTheDocument();
    expect(lastProps(TaskEmptyState)).toEqual({ totalCount: 0, filter: DEFAULT_FILTER });
  });

  it('passes the filter change from F4 back to F4 and to F6', () => {
    render(<TaskScreen storage={storageWith([])} />);
    act(() => lastProps(TaskFilterBar).onFilterChange({ query: 'milk' }));
    expect(lastProps(TaskFilterBar).filter).toEqual({ status: 'all', query: 'milk' });
    expect(lastProps(TaskEmptyState).filter).toEqual({ status: 'all', query: 'milk' });
  });

  it('passes a storage error to F5 and clears it on dismiss', () => {
    const error = new TaskStorageError('unreadable');
    const storage: TaskStorage = {
      load: () => {
        throw error;
      },
      save: vi.fn(),
    };
    render(<TaskScreen storage={storage} />);
    expect(lastProps(StorageErrorBanner).error).toBe(error);
    act(() => lastProps(StorageErrorBanner).onDismiss());
    expect(lastProps(StorageErrorBanner).error).toBeNull();
  });
});
