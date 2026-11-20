import type { Task } from '../tasks/types';

/** A complete Task for tests; override only the fields a test cares about. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Buy milk',
    notes: '',
    priority: 'medium',
    dueDate: null,
    completed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
