import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { Task } from '../../tasks/types';
import { deleteTask } from './deleteTask';

function threeTasks(): Task[] {
  return [makeTask({ id: 'a', title: 'A' }), makeTask({ id: 'b', title: 'B' }), makeTask({ id: 'c', title: 'C' })];
}

describe('deleteTask', () => {
  it('removes only the given task and keeps the order of the rest', () => {
    const tasks = threeTasks();

    expect(deleteTask(tasks, 'b')).toEqual([tasks[0], tasks[2]]);
  });

  it('does not mutate the list', () => {
    const tasks = Object.freeze(threeTasks()) as Task[];

    const result = deleteTask(tasks, 'a');

    expect(tasks.map((task) => task.id)).toEqual(['a', 'b', 'c']);
    expect(result).not.toBe(tasks);
  });

  it('returns the same array for an unknown id', () => {
    const tasks = threeTasks();

    expect(deleteTask(tasks, 'missing')).toBe(tasks);
  });

  it('returns an empty list after deleting the only task', () => {
    expect(deleteTask([makeTask({ id: 'a' })], 'a')).toEqual([]);
  });
});
