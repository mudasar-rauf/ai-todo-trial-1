import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { Task } from '../../tasks/types';
import { toggleTask } from './toggleTask';

const NOW = '2026-02-02T10:00:00.000Z';

function frozen(tasks: Task[]): Task[] {
  return Object.freeze(tasks.map((task) => Object.freeze(task))) as Task[];
}

describe('toggleTask', () => {
  it('marks an incomplete task complete and stamps updatedAt', () => {
    const tasks = frozen([makeTask({ id: 'a' }), makeTask({ id: 'b' })]);

    const result = toggleTask(tasks, 'a', NOW);

    expect(result[0]).toEqual({ ...tasks[0], completed: true, updatedAt: NOW });
    expect(result[1]).toBe(tasks[1]);
  });

  it('marks a completed task incomplete again', () => {
    const tasks = frozen([makeTask({ id: 'a', completed: true })]);

    expect(toggleTask(tasks, 'a', NOW)[0]).toEqual({ ...tasks[0], completed: false, updatedAt: NOW });
  });

  it('keeps createdAt and every other field', () => {
    const task = makeTask({ id: 'a', title: 'Call', notes: 'n', priority: 'high', dueDate: '2026-03-14' });

    const [toggled] = toggleTask(frozen([task]), 'a', NOW);

    expect(toggled).toEqual({ ...task, completed: true, updatedAt: NOW });
  });

  it('returns a new array without mutating its input', () => {
    const tasks = frozen([makeTask({ id: 'a' })]);

    const result = toggleTask(tasks, 'a', NOW);

    expect(result).not.toBe(tasks);
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns the same array for an unknown id', () => {
    const tasks = frozen([makeTask({ id: 'a' })]);

    expect(toggleTask(tasks, 'missing', NOW)).toBe(tasks);
  });

  it('returns the same array for an empty list', () => {
    const tasks = frozen([]);

    expect(toggleTask(tasks, 'a', NOW)).toBe(tasks);
  });
});
