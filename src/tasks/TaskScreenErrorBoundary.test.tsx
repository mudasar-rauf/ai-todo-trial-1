import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskStorageError, type TaskStorage } from './storage';
import { TaskScreen } from './TaskScreen';
import { TaskScreenErrorBoundary } from './TaskScreenErrorBoundary';

function ThrowsInEffect({ error }: { error: unknown }): null {
  useEffect(() => {
    throw error;
  }, [error]);
  return null;
}

function ThrowsInRender({ error }: { error: unknown }): null {
  throw error;
}

function throwingStorage(error: unknown): TaskStorage {
  return {
    load: () => {
      throw error;
    },
    save: vi.fn(),
  };
}

describe('TaskScreenErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React and the boundary both log the caught error; keep the test output quiet.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders its children when nothing throws', () => {
    render(
      <TaskScreenErrorBoundary>
        <TaskScreen storage={{ load: () => [], save: vi.fn() }} />
      </TaskScreenErrorBoundary>,
    );

    expect(screen.getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('alert', { name: 'Something went wrong' })).not.toBeInTheDocument();
  });

  it('shows the message and a Reload button when the task screen throws during render', () => {
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <TaskScreen storage={throwingStorage(new Error('boom'))} />
      </TaskScreenErrorBoundary>,
    );

    const alert = screen.getByRole('alert', { name: 'Something went wrong' });
    expect(within(alert).getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('shows the message when a child throws in an effect', () => {
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <ThrowsInEffect error={new Error('effect boom')} />
      </TaskScreenErrorBoundary>,
    );

    expect(screen.getByRole('alert', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('shows the message when the task screen save effect throws something other than TaskStorageError', async () => {
    const user = userEvent.setup();
    const storage: TaskStorage = {
      load: () => [],
      save: () => {
        throw new Error('save boom');
      },
    };
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <TaskScreen storage={storage} />
      </TaskScreenErrorBoundary>,
    );

    await user.type(screen.getByLabelText('Title'), 'Buy bread{Enter}');

    expect(screen.getByRole('alert', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('keeps the task screen when a save throws TaskStorageError, as today', async () => {
    const user = userEvent.setup();
    const storage: TaskStorage = {
      load: () => [],
      save: () => {
        throw new TaskStorageError('quota');
      },
    };
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <TaskScreen storage={storage} />
      </TaskScreenErrorBoundary>,
    );

    await user.type(screen.getByLabelText('Title'), 'Buy bread{Enter}');

    expect(screen.getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Buy bread' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['0', 0],
  ])('shows the message when a child throws %s', (_label, thrown) => {
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <ThrowsInRender error={thrown} />
      </TaskScreenErrorBoundary>,
    );

    expect(screen.getByRole('alert', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('logs the thrown error to the console', () => {
    const error = new Error('boom');
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <TaskScreen storage={throwingStorage(error)} />
      </TaskScreenErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalledWith('The task screen failed:', error, expect.any(String));
  });

  it('calls onReload when Reload is clicked', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    render(
      <TaskScreenErrorBoundary onReload={onReload}>
        <ThrowsInRender error={new Error('boom')} />
      </TaskScreenErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: 'Reload' }));

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('reaches Reload with Tab and activates it with Enter', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    render(
      <TaskScreenErrorBoundary onReload={onReload}>
        <ThrowsInRender error={new Error('boom')} />
      </TaskScreenErrorBoundary>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Reload' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('reloads the page by default', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(
      <TaskScreenErrorBoundary>
        <ThrowsInRender error={new Error('boom')} />
      </TaskScreenErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('leaves a TaskStorageError from loading to the task screen, as today', () => {
    render(
      <TaskScreenErrorBoundary onReload={vi.fn()}>
        <TaskScreen storage={throwingStorage(new TaskStorageError('cannot read'))} />
      </TaskScreenErrorBoundary>,
    );

    expect(screen.getByRole('region', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
