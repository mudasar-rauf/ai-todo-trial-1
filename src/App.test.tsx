import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_NAME } from './appName';

describe('App frame', () => {
  it('has exactly one banner landmark, holding the app name', () => {
    render(<App />);
    const banners = screen.getAllByRole('banner');
    expect(banners).toHaveLength(1);
    expect(within(banners[0]).getByText(APP_NAME)).toBeInTheDocument();
  });

  it('has exactly one main landmark, empty for the task screen', () => {
    render(<App />);
    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveTextContent('');
  });
});

describe('App behind VITE_FF_TASKS', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows the task screen in the main landmark when the flag is "true"', () => {
    vi.stubEnv('VITE_FF_TASKS', 'true');
    render(<App />);
    const main = screen.getByRole('main');
    expect(within(main).getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('leaves the main landmark empty when the flag is anything else', () => {
    vi.stubEnv('VITE_FF_TASKS', 'false');
    render(<App />);
    expect(screen.getByRole('main')).toHaveTextContent('');
    expect(screen.queryByRole('region', { name: 'Tasks' })).not.toBeInTheDocument();
  });
});
