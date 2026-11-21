import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_NAME } from './appName';

// A task screen that always fails, so the App's own wiring of the boundary is what is tested.
vi.mock('./tasks/TaskScreen', () => ({
  TaskScreen: () => {
    throw new Error('task screen boom');
  },
}));

describe('App when the task screen throws', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('keeps the banner and shows the message and Reload in the main landmark', () => {
    vi.stubEnv('VITE_FF_TASKS', 'true');
    render(<App />);

    const banners = screen.getAllByRole('banner');
    expect(banners).toHaveLength(1);
    expect(within(banners[0]).getByText(APP_NAME)).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(within(main).getByRole('alert', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(within(main).getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('leaves the main landmark empty with the flag off', () => {
    vi.stubEnv('VITE_FF_TASKS', 'false');
    render(<App />);

    expect(screen.getByRole('main')).toHaveTextContent('');
    expect(screen.queryByRole('alert', { name: 'Something went wrong' })).not.toBeInTheDocument();
  });
});
