import { describe, expect, it } from 'vitest';
import { TaskStorageError } from './storage';

describe('TaskStorageError', () => {
  it('is an Error named TaskStorageError', () => {
    const error = new TaskStorageError('could not save');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TaskStorageError');
    expect(error.message).toBe('could not save');
  });

  it('keeps the cause it was given', () => {
    const cause = new DOMException('quota', 'QuotaExceededError');
    expect(new TaskStorageError('could not save', { cause }).cause).toBe(cause);
  });
});
