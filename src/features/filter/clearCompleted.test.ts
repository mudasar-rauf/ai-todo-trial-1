import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { Task } from '../../tasks/types';
import { clearCompleted } from './clearCompleted';

const active1 = makeTask({ id: 'a1', title: 'Active one' });
const done1 = makeTask({ id: 'd1', title: 'Done one', completed: true });
const active2 = makeTask({ id: 'a2', title: 'Active two' });
const done2 = makeTask({ id: 'd2', title: 'Done two', completed: true });

const frozen = (tasks: Task[]): Task[] => Object.freeze(tasks.map((t) => Object.freeze({ ...t }))) as Task[];

describe('clearCompleted', () => {
  it('removes the completed tasks and keeps the active ones in their order', () => {
    expect(clearCompleted([active1, done1, active2, done2]).map((t) => t.id)).toEqual(['a1', 'a2']);
  });

  it('keeps the same task objects', () => {
    const result = clearCompleted([active1, done1, active2]);

    expect(result[0]).toBe(active1);
    expect(result[1]).toBe(active2);
  });

  it('returns the same array when no task is completed', () => {
    const tasks = [active1, active2];

    expect(clearCompleted(tasks)).toBe(tasks);
  });

  it('returns the same array for an empty list', () => {
    const tasks: Task[] = [];

    expect(clearCompleted(tasks)).toBe(tasks);
  });

  it('returns an empty list when every task is completed', () => {
    expect(clearCompleted([done1, done2])).toEqual([]);
  });

  it('never changes its input', () => {
    const tasks = frozen([active1, done1, active2, done2]);
    const before = structuredClone(tasks);

    const result = clearCompleted(tasks);

    expect(tasks).toEqual(before);
    expect(result).not.toBe(tasks);
  });
});
