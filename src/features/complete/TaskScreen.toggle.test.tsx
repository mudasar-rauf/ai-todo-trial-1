import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskStorage } from '../../tasks/storage';
import { TaskScreen } from '../../tasks/TaskScreen';

const NOW = '2026-02-02T10:00:00.000Z';

// The real screen, store and reducer with in-memory storage. Queries stay inside F2's list,
// so other features' controls (as they land) do not change what this test sees.
function renderScreen() {
  const saved = [
    makeTask({ id: 'old', title: 'Old task', createdAt: '2026-01-01T00:00:00.000Z' }),
    makeTask({ id: 'new', title: 'New task', createdAt: '2026-01-03T00:00:00.000Z' }),
    makeTask({ id: 'done', title: 'Done task', completed: true, createdAt: '2026-01-02T00:00:00.000Z' }),
  ];
  const storage: TaskStorage = { load: () => saved, save: vi.fn() };
  render(<TaskScreen storage={storage} now={() => NOW} createId={() => 'unused'} />);
  return storage;
}

const list = () => screen.getByRole('list', { name: 'Tasks' });
const labelOf = (box: HTMLElement) => (box as HTMLInputElement).labels?.[0]?.textContent;
const titles = () => within(list()).getAllByRole('checkbox').map(labelOf);
const checkbox = (name: string) => within(list()).getByRole('checkbox', { name });

describe('TaskScreen with F2', () => {
  it('lists incomplete tasks first, newest first, then completed ones', () => {
    renderScreen();

    expect(titles()).toEqual(['New task', 'Old task', 'Done task']);
  });

  it('moves a task into the completed group when checked with Space, and back when unchecked', async () => {
    const user = userEvent.setup();
    const storage = renderScreen();

    checkbox('New task').focus();
    await user.keyboard(' ');

    expect(titles()).toEqual(['Old task', 'New task', 'Done task']);
    expect(checkbox('New task')).toBeChecked();
    expect(storage.save).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'new', completed: true, updatedAt: NOW })]),
    );

    await user.keyboard(' ');

    expect(titles()).toEqual(['New task', 'Old task', 'Done task']);
    expect(checkbox('New task')).not.toBeChecked();
  });

  it('moves a task back above the completed ones when unchecked with the mouse', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(checkbox('Done task'));

    expect(titles()).toEqual(['New task', 'Done task', 'Old task']);
    expect(checkbox('Done task')).not.toBeChecked();
  });

  it('keeps focus on the toggled checkbox after its row moves', async () => {
    const user = userEvent.setup();
    renderScreen();

    checkbox('New task').focus();
    await user.keyboard(' ');

    expect(titles()).toEqual(['Old task', 'New task', 'Done task']);
    expect(checkbox('New task')).toHaveFocus();
  });
});
