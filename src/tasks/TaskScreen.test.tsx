import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeTask } from '../test/taskFixtures';
import type { TaskStorage } from './storage';
import { TaskScreen } from './TaskScreen';

// With every feature still a stub: the screen renders and React reports nothing.
describe('TaskScreen with the feature stubs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['no tasks', []],
    ['saved tasks', [makeTask({ id: 'a' }), makeTask({ id: 'b', completed: true })]],
  ])('renders the Tasks region with %s and no console errors or warnings', (_label, saved) => {
    const error = vi.spyOn(console, 'error');
    const warn = vi.spyOn(console, 'warn');
    const storage: TaskStorage = { load: () => saved, save: vi.fn() };

    render(
      <StrictMode>
        <TaskScreen storage={storage} />
      </StrictMode>,
    );

    expect(screen.getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tasks', level: 2 })).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('renders with its default storage', () => {
    render(<TaskScreen />);
    expect(screen.getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
  });
});
