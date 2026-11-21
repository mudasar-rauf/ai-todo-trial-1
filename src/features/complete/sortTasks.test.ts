import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import { sortTasks } from './sortTasks';

const ids = (tasks: { id: string }[]) => tasks.map((task) => task.id);

describe('sortTasks', () => {
  it('puts incomplete tasks above completed ones, newest first within each group', () => {
    const tasks = [
      makeTask({ id: 'done-old', completed: true, createdAt: '2026-01-01T00:00:00.000Z' }),
      makeTask({ id: 'todo-old', completed: false, createdAt: '2026-01-02T00:00:00.000Z' }),
      makeTask({ id: 'done-new', completed: true, createdAt: '2026-01-05T00:00:00.000Z' }),
      makeTask({ id: 'todo-new', completed: false, createdAt: '2026-01-04T00:00:00.000Z' }),
      makeTask({ id: 'todo-mid', completed: false, createdAt: '2026-01-03T00:00:00.000Z' }),
    ];

    expect(ids(sortTasks(tasks))).toEqual(['todo-new', 'todo-mid', 'todo-old', 'done-new', 'done-old']);
  });

  it('keeps the input order for tasks created at the same time', () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    const tasks = [
      makeTask({ id: 'a', createdAt }),
      makeTask({ id: 'b', createdAt }),
      makeTask({ id: 'c', createdAt, completed: true }),
      makeTask({ id: 'd', createdAt }),
    ];

    expect(ids(sortTasks(tasks))).toEqual(['a', 'b', 'd', 'c']);
  });

  it('orders by createdAt, not by updatedAt', () => {
    const tasks = [
      makeTask({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-03-01T00:00:00.000Z' }),
      makeTask({ id: 'new', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }),
    ];

    expect(ids(sortTasks(tasks))).toEqual(['new', 'old']);
  });

  it('returns a new array and leaves its input untouched', () => {
    const tasks = Object.freeze([
      Object.freeze(makeTask({ id: 'done', completed: true })),
      Object.freeze(makeTask({ id: 'todo' })),
    ]) as unknown as ReturnType<typeof makeTask>[];

    const sorted = sortTasks(tasks);

    expect(sorted).not.toBe(tasks);
    expect(ids(tasks)).toEqual(['done', 'todo']);
    expect(ids(sorted)).toEqual(['todo', 'done']);
  });

  it('handles an empty list', () => {
    expect(sortTasks([])).toEqual([]);
  });
});
