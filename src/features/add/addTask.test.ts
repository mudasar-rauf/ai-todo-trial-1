import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskDraft, TaskEnv } from '../../tasks/types';
import { addTask } from './addTask';

const NOW = '2026-11-21T10:00:00.000Z';

function fixedEnv(): TaskEnv & { nowCalls: number } {
  const env = {
    nowCalls: 0,
    createId: () => 'new-id',
    now: () => {
      env.nowCalls += 1;
      return NOW;
    },
  };
  return env;
}

const draft = (overrides: Partial<TaskDraft> = {}): TaskDraft => ({
  title: 'Write report',
  notes: '',
  priority: 'medium',
  dueDate: null,
  ...overrides,
});

describe('addTask', () => {
  it('puts the new task in front of the existing ones', () => {
    const old = makeTask({ id: 'old' });

    const result = addTask([old], draft(), fixedEnv());

    expect(result.map((task) => task.id)).toEqual(['new-id', 'old']);
    expect(result[1]).toBe(old);
  });

  it('builds an incomplete task with the id from createId and both timestamps from one now()', () => {
    const env = fixedEnv();

    const [task] = addTask([], draft({ priority: 'high', dueDate: '2026-12-01' }), env);

    expect(task).toEqual({
      id: 'new-id',
      title: 'Write report',
      notes: '',
      priority: 'high',
      dueDate: '2026-12-01',
      completed: false,
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(env.nowCalls).toBe(1);
  });

  it('trims the title and the notes, keeping line breaks inside the notes', () => {
    const [task] = addTask([], draft({ title: '  Call Sam  ', notes: '\n first\nsecond \n' }), fixedEnv());

    expect(task.title).toBe('Call Sam');
    expect(task.notes).toBe('first\nsecond');
  });

  it('turns spaces-only notes into an empty string', () => {
    const [task] = addTask([], draft({ notes: '   ' }), fixedEnv());

    expect(task.notes).toBe('');
  });

  it('stores an empty due date as null', () => {
    const [task] = addTask([], draft({ dueDate: '' }), fixedEnv());

    expect(task.dueDate).toBeNull();
  });

  it('does not change the list it is given', () => {
    const tasks = [makeTask({ id: 'old' })];
    const before = structuredClone(tasks);

    addTask(tasks, draft(), fixedEnv());

    expect(tasks).toEqual(before);
  });

  it.each(['', '   ', '\t\n'])('returns the same list for the blank title %j', (title) => {
    const tasks = [makeTask({ id: 'old' })];
    const env = fixedEnv();

    expect(addTask(tasks, draft({ title }), env)).toBe(tasks);
    expect(env.nowCalls).toBe(0);
  });
});
