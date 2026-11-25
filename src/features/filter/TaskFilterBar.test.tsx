import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskStorage } from '../../tasks/storage';
import { TaskScreen } from '../../tasks/TaskScreen';
import { DEFAULT_FILTER, type Task } from '../../tasks/types';
import { TaskFilterBar } from './TaskFilterBar';

function renderBar(completedCount: number) {
  const onClearCompleted = vi.fn();
  render(
    <TaskFilterBar
      filter={DEFAULT_FILTER}
      onFilterChange={vi.fn()}
      completedCount={completedCount}
      onClearCompleted={onClearCompleted}
    />,
  );
  return onClearCompleted;
}

const clearButton = (n: number) => screen.getByRole('button', { name: `Clear completed (${n})` });

describe('TaskFilterBar: Clear completed button', () => {
  describe('with completed tasks', () => {
    it('shows "Clear completed (N)" and is not aria-disabled', () => {
      renderBar(2);

      expect(clearButton(2)).toBeInTheDocument();
      expect(clearButton(2)).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('calls onClearCompleted once, with no arguments, on a click', async () => {
      const user = userEvent.setup();
      const onClearCompleted = renderBar(2);

      await user.click(clearButton(2));

      expect(onClearCompleted).toHaveBeenCalledTimes(1);
      expect(onClearCompleted).toHaveBeenCalledWith();
    });

    it('calls onClearCompleted once on Enter', async () => {
      const user = userEvent.setup();
      const onClearCompleted = renderBar(2);

      clearButton(2).focus();
      await user.keyboard('{Enter}');

      expect(onClearCompleted).toHaveBeenCalledTimes(1);
    });

    it('calls onClearCompleted once on Space', async () => {
      const user = userEvent.setup();
      const onClearCompleted = renderBar(2);

      clearButton(2).focus();
      await user.keyboard(' ');

      expect(onClearCompleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('with no completed task', () => {
    it('stays shown, marked aria-disabled="true" and not natively disabled', () => {
      renderBar(0);

      expect(clearButton(0)).toHaveAttribute('aria-disabled', 'true');
      expect(clearButton(0)).not.toHaveAttribute('disabled');
    });

    it('stays reachable with Tab', async () => {
      const user = userEvent.setup();
      renderBar(0);

      await user.tab();

      expect(clearButton(0)).toHaveFocus();
    });

    it('does nothing on a click, Enter or Space', async () => {
      const user = userEvent.setup();
      const onClearCompleted = renderBar(0);

      await user.click(clearButton(0));
      clearButton(0).focus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(onClearCompleted).not.toHaveBeenCalled();
    });
  });
});

// The real screen, store and reducer with in-memory storage.
function renderScreen(saved: Task[]) {
  const storage: TaskStorage = { load: () => saved, save: vi.fn() };
  render(<TaskScreen storage={storage} now={() => '2026-02-02T10:00:00.000Z'} createId={() => 'unused'} />);
  return storage;
}

const mixedTasks = () => [
  makeTask({ id: 'a1', title: 'Active one', createdAt: '2026-01-01T00:00:00.000Z' }),
  makeTask({ id: 'd1', title: 'Done one', completed: true, createdAt: '2026-01-02T00:00:00.000Z' }),
  makeTask({ id: 'a2', title: 'Active two', createdAt: '2026-01-03T00:00:00.000Z' }),
  makeTask({ id: 'd2', title: 'Done two', completed: true, createdAt: '2026-01-04T00:00:00.000Z' }),
];

const labelOf = (box: HTMLElement) => (box as HTMLInputElement).labels?.[0]?.textContent;
const listedTitles = () =>
  within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('checkbox').map(labelOf).sort();

describe('TaskScreen with Clear completed', () => {
  it('removes the completed tasks, keeps the active ones listed, and saves only those', async () => {
    const user = userEvent.setup();
    const saved = mixedTasks();
    const storage = renderScreen(saved);

    await user.click(clearButton(2));

    expect(listedTitles()).toEqual(['Active one', 'Active two']);
    expect(storage.save).toHaveBeenLastCalledWith([saved[0], saved[2]]);
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('keeps focus on the button after a clear with %s, now "(0)" and aria-disabled', async (_key, keys) => {
    const user = userEvent.setup();
    renderScreen(mixedTasks());

    clearButton(2).focus();
    await user.keyboard(keys);

    expect(listedTitles()).toEqual(['Active one', 'Active two']);
    expect(clearButton(0)).toHaveFocus();
    expect(clearButton(0)).toHaveAttribute('aria-disabled', 'true');
    expect(document.activeElement).not.toBe(document.body);
  });

  it('keeps focus on the button when the clear empties the list', async () => {
    const user = userEvent.setup();
    renderScreen([makeTask({ id: 'd1', title: 'Done one', completed: true })]);

    await user.click(clearButton(1));

    expect(clearButton(0)).toHaveFocus();
  });

  it('saves nothing and changes nothing when no task is completed', async () => {
    const user = userEvent.setup();
    const storage = renderScreen([
      makeTask({ id: 'a1', title: 'Active one' }),
      makeTask({ id: 'a2', title: 'Active two' }),
    ]);

    await user.click(clearButton(0));

    expect(storage.save).not.toHaveBeenCalled();
    expect(listedTitles()).toEqual(['Active one', 'Active two']);
  });
});
