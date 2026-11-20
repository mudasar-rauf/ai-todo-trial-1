import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTasksEnabled } from './flags';

describe('isTasksEnabled (VITE_FF_TASKS)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off when the variable is unset', () => {
    vi.stubEnv('VITE_FF_TASKS', undefined);
    expect(isTasksEnabled()).toBe(false);
  });

  it.each(['false', '1', 'TRUE', 'yes', ''])('is off for %j', (value) => {
    vi.stubEnv('VITE_FF_TASKS', value);
    expect(isTasksEnabled()).toBe(false);
  });

  it('is on only for "true"', () => {
    vi.stubEnv('VITE_FF_TASKS', 'true');
    expect(isTasksEnabled()).toBe(true);
  });
});
