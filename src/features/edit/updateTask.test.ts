import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { Task } from '../../tasks/types';
import { updateTask } from './updateTask';

const NOW = '2026-11-21T10:00:00.000Z';

function twoTasks(): Task[] {
  return [
    makeTask({ id: 'a', title: 'Buy milk' }),
    makeTask({ id: 'b', title: 'Walk dog', notes: 'Park', priority: 'low', dueDate: '2026-12-01', completed: true }),
  ];
}

/** Deep-freezes the list and its tasks, so any mutation throws in strict mode. */
function frozen(tasks: Task[]): Task[] {
  tasks.forEach((task) => Object.freeze(task));
  return Object.freeze(tasks) as Task[];
}

describe('updateTask', () => {
  it('applies every editable field to the given task and stamps updatedAt with now', () => {
    const tasks = twoTasks();

    const result = updateTask(tasks, 'b', { title: 'Walk the dog', notes: '', priority: 'high', dueDate: null }, NOW);

    expect(result[1]).toEqual({
      ...tasks[1],
      title: 'Walk the dog',
      notes: '',
      priority: 'high',
      dueDate: null,
      updatedAt: NOW,
    });
  });

  it('applies a partial patch and leaves the other fields alone', () => {
    const tasks = twoTasks();

    const result = updateTask(tasks, 'b', { priority: 'medium' }, NOW);

    expect(result[1]).toEqual({ ...tasks[1], priority: 'medium', updatedAt: NOW });
  });

  it('trims the title', () => {
    const result = updateTask(twoTasks(), 'a', { title: '  Buy oat milk  ' }, NOW);

    expect(result[0].title).toBe('Buy oat milk');
  });

  it('keeps id, completed and createdAt', () => {
    const tasks = twoTasks();

    const result = updateTask(tasks, 'b', { title: 'Changed' }, NOW);

    expect(result[1]).toMatchObject({ id: 'b', completed: true, createdAt: tasks[1].createdAt });
  });

  it('keeps the other tasks, the same objects, in the same order', () => {
    const tasks = twoTasks();

    const result = updateTask(tasks, 'b', { title: 'Changed' }, NOW);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(tasks[0]);
  });

  it('does not mutate the list or the task', () => {
    const tasks = frozen(twoTasks());
    const before = structuredClone(tasks);

    const result = updateTask(tasks, 'a', { title: 'Changed', notes: 'x', priority: 'low', dueDate: '2027-01-01' }, NOW);

    expect(tasks).toEqual(before);
    expect(result).not.toBe(tasks);
    expect(result[0]).not.toBe(tasks[0]);
  });

  it('returns the same array for an unknown id', () => {
    const tasks = twoTasks();

    expect(updateTask(tasks, 'missing', { title: 'Changed' }, NOW)).toBe(tasks);
  });

  it('returns the same array when the patch changes nothing', () => {
    const tasks = twoTasks();
    const { title, notes, priority, dueDate } = tasks[1];

    expect(updateTask(tasks, 'b', { title, notes, priority, dueDate }, NOW)).toBe(tasks);
    expect(updateTask(tasks, 'b', {}, NOW)).toBe(tasks);
  });

  it('returns the same array when the title differs only by surrounding spaces', () => {
    const tasks = twoTasks();

    expect(updateTask(tasks, 'a', { title: '  Buy milk ' }, NOW)).toBe(tasks);
  });

  it('ignores an empty or spaces-only title, so a task never loses its title', () => {
    const tasks = twoTasks();

    expect(updateTask(tasks, 'a', { title: '' }, NOW)).toBe(tasks);
    expect(updateTask(tasks, 'a', { title: '   ' }, NOW)).toBe(tasks);
    expect(updateTask(tasks, 'a', { title: '   ', notes: 'Semi-skimmed' }, NOW)[0]).toMatchObject({
      title: 'Buy milk',
      notes: 'Semi-skimmed',
      updatedAt: NOW,
    });
  });
});
