import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskStorage } from '../../tasks/storage';
import { TaskScreen } from '../../tasks/TaskScreen';
import type { Task } from '../../tasks/types';

const NOW = '2026-11-21T10:00:00.000Z';

// The real screen, store, reducer and F2's list, with in-memory storage and fixed ids and times.
function renderScreen() {
  const old = makeTask({ id: 'old', title: 'Old task', createdAt: '2026-01-01T00:00:00.000Z' });
  const storage = { load: vi.fn(() => [old]), save: vi.fn<(tasks: Task[]) => void>() } satisfies TaskStorage;
  render(<TaskScreen storage={storage} createId={() => 'new'} now={() => NOW} />);
  return { storage, old, user: userEvent.setup() };
}

const lastSaved = (storage: ReturnType<typeof renderScreen>['storage']) => storage.save.mock.calls.at(-1)?.[0];
const form = () => screen.getByRole('form', { name: 'Add task' });
const field = (label: string) => within(form()).getByLabelText(label);
const rows = () => within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem');

describe('Adding a task on the task screen', () => {
  it('adds a title-only task at the top with the default priority and no due date, and saves it', async () => {
    const { storage, old, user } = renderScreen();

    await user.type(field('Title'), '  Buy bread  {Enter}');

    expect(lastSaved(storage)).toEqual([
      {
        id: 'new',
        title: 'Buy bread',
        notes: '',
        priority: 'medium',
        dueDate: null,
        completed: false,
        createdAt: NOW,
        updatedAt: NOW,
      },
      old,
    ]);
    const top = rows()[0];
    expect(within(top).getByRole('checkbox', { name: 'Buy bread' })).toBeInTheDocument();
    expect(within(top).getByText('Medium priority')).toBeInTheDocument();
    expect(within(top).queryByText(/^Due /)).not.toBeInTheDocument();
    expect(rows()).toHaveLength(2);
  });

  it('shows the notes, priority and due date as entered on the new row', async () => {
    const { storage, user } = renderScreen();

    await user.type(field('Title'), 'Plan trip');
    await user.type(field('Notes'), 'Book trains');
    await user.click(within(form()).getByRole('combobox', { name: 'Priority' }));
    await user.click(screen.getByRole('option', { name: 'High' }));
    await user.type(within(form()).getByRole('combobox', { name: 'Due date' }), '2026-12-01');
    await user.click(within(form()).getByRole('button', { name: 'Add task' }));

    expect(lastSaved(storage)?.[0]).toMatchObject({
      title: 'Plan trip',
      notes: 'Book trains',
      priority: 'high',
      dueDate: '2026-12-01',
    });
    const top = rows()[0];
    expect(within(top).getByRole('checkbox', { name: 'Plan trip' })).toHaveAccessibleDescription('Book trains');
    expect(within(top).getByText('High priority')).toBeInTheDocument();
    expect(top.querySelector('time')).toHaveAttribute('dateTime', '2026-12-01');
  });

  it('adds and saves nothing for a spaces-only title, and shows the error at Title', async () => {
    const { storage, user } = renderScreen();
    const savesBefore = storage.save.mock.calls.length;

    await user.type(field('Title'), '   {Enter}');

    expect(storage.save.mock.calls.length).toBe(savesBefore);
    expect(rows()).toHaveLength(1);
    expect(field('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(field('Title')).toHaveFocus();
  });

  it('leaves the form empty with focus in Title, ready for the next task', async () => {
    const { user } = renderScreen();

    await user.type(field('Title'), 'First{Enter}');

    expect(field('Title')).toHaveValue('');
    expect(field('Title')).toHaveFocus();
  });
});
