import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskStorage } from '../../tasks/storage';
import { TaskScreen } from '../../tasks/TaskScreen';
import type { Task } from '../../tasks/types';

// jsdom has <dialog> but not its modal methods; give it the open/close behaviour Astryx relies on.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const NOW = '2026-11-21T10:00:00.000Z';

// The real screen, store, reducer, F1's composer and F2's list, with in-memory storage and a fixed time.
function renderScreen() {
  const milk = makeTask({ id: 'milk', title: 'Buy milk', createdAt: '2026-01-02T00:00:00.000Z' });
  const dog = makeTask({ id: 'dog', title: 'Walk dog', createdAt: '2026-01-01T00:00:00.000Z' });
  const storage = { load: vi.fn(() => [milk, dog]), save: vi.fn<(tasks: Task[]) => void>() } satisfies TaskStorage;
  render(<TaskScreen storage={storage} createId={() => 'new'} now={() => NOW} />);
  return { storage, milk, dog, user: userEvent.setup() };
}

const lastSaved = (storage: ReturnType<typeof renderScreen>['storage']) => storage.save.mock.calls.at(-1)?.[0];
const list = () => screen.getByRole('list', { name: 'Tasks' });
const composerTitle = () => within(screen.getByRole('form', { name: 'Add task' })).getByLabelText('Title');
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('Editing and deleting a task on the task screen', () => {
  it('saves an edit, shows it on the row, and returns focus to that row’s Edit button', async () => {
    const { storage, milk, dog, user } = renderScreen();

    await user.click(screen.getByRole('button', { name: 'Edit “Walk dog”' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });
    await user.clear(within(dialog).getByLabelText('Title'));
    await user.type(within(dialog).getByLabelText('Title'), 'Walk the dog');
    await user.type(within(dialog).getByLabelText('Notes'), 'Round the park');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await settle();

    expect(lastSaved(storage)).toEqual([
      milk,
      { ...dog, title: 'Walk the dog', notes: 'Round the park', updatedAt: NOW },
    ]);
    expect(within(list()).getByRole('checkbox', { name: 'Walk the dog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit “Walk the dog”' })).toHaveFocus();
  });

  it('changes and saves nothing on Cancel', async () => {
    const { storage, user } = renderScreen();
    const savesBefore = storage.save.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Edit “Buy milk”' }));
    await user.type(within(screen.getByRole('dialog', { name: 'Edit task' })).getByLabelText('Title'), ' now');
    await user.keyboard('{Escape}');
    await settle();

    expect(storage.save.mock.calls.length).toBe(savesBefore);
    expect(within(list()).getByRole('checkbox', { name: 'Buy milk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit “Buy milk”' })).toHaveFocus();
  });

  it('deletes after confirming, saves the rest, and puts focus in the composer’s Title', async () => {
    const { storage, dog, user } = renderScreen();

    await user.click(screen.getByRole('button', { name: 'Delete “Buy milk”' }));
    const alert = screen.getByRole('alertdialog', { name: 'Delete task?' });
    expect(alert).toHaveTextContent('“Buy milk” will be deleted.');
    await user.click(within(alert).getByRole('button', { name: 'Delete' }));
    await settle();

    expect(lastSaved(storage)).toEqual([dog]);
    expect(within(list()).queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument();
    expect(composerTitle()).toHaveFocus();
  });

  it('keeps the task when the delete is cancelled', async () => {
    const { storage, user } = renderScreen();
    const savesBefore = storage.save.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Delete “Buy milk”' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));

    expect(storage.save.mock.calls.length).toBe(savesBefore);
    expect(within(list()).getAllByRole('checkbox')).toHaveLength(2);
  });

  it('puts focus in the composer’s Title after deleting the last task', async () => {
    const { user } = renderScreen();

    for (const title of ['Buy milk', 'Walk dog']) {
      await user.click(screen.getByRole('button', { name: `Delete “${title}”` }));
      await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
      await settle();
    }

    expect(screen.queryByRole('list', { name: 'Tasks' })).not.toBeInTheDocument();
    expect(composerTitle()).toHaveFocus();
  });
});
