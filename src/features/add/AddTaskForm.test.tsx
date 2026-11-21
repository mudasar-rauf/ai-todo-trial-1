import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PRIORITY } from '../../tasks/types';
import { AddTaskForm } from './AddTaskForm';

function renderForm() {
  const onAdd = vi.fn();
  const user = userEvent.setup();
  render(<AddTaskForm onAdd={onAdd} />);
  return { onAdd, user };
}

const title = () => screen.getByLabelText('Title');
const notes = () => screen.getByLabelText('Notes');
const priority = () => screen.getByRole('combobox', { name: 'Priority' });
const dueDate = () => screen.getByRole('combobox', { name: 'Due date' });
const addButton = () => screen.getByRole('button', { name: 'Add task' });

/**
 * The text of the elements Title's aria-describedby points at, where its error shows.
 * (The design system also copies the message into a shared live region to announce it,
 * so a plain getByText would find two.)
 */
function titleDescription(): string {
  const ids = title().getAttribute('aria-describedby')?.split(' ') ?? [];
  return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
}

async function choosePriority(user: UserEvent, label: string) {
  await user.click(priority());
  await user.click(screen.getByRole('option', { name: label }));
}

describe('AddTaskForm', () => {
  it('is a form named "Add task" with a visible label on every control', () => {
    renderForm();

    expect(screen.getByRole('form', { name: 'Add task' })).toBeInTheDocument();
    for (const name of ['Title', 'Notes', 'Priority', 'Due date']) {
      expect(screen.getByText(name, { selector: 'label' })).toBeVisible();
    }
    expect(addButton()).toBeVisible();
  });

  it('starts with an empty title, notes and due date, and the default priority', () => {
    renderForm();

    expect(title()).toHaveValue('');
    expect(notes()).toHaveValue('');
    expect(priority()).toHaveTextContent('Medium');
    expect(dueDate()).toHaveValue('');
  });

  it('adds a task from a title alone when Enter is pressed in Title', async () => {
    const { onAdd, user } = renderForm();

    await user.type(title(), 'Buy bread{Enter}');

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith({ title: 'Buy bread', notes: '', priority: DEFAULT_PRIORITY, dueDate: null });
  });

  it('adds a task with every field as entered when Add task is clicked', async () => {
    const { onAdd, user } = renderForm();

    await user.type(title(), 'Plan trip');
    await user.type(notes(), 'Book trains{Enter}Pack bags');
    await choosePriority(user, 'High');
    await user.type(dueDate(), '2026-12-01');
    await user.click(addButton());

    expect(onAdd).toHaveBeenCalledWith({
      title: 'Plan trip',
      notes: 'Book trains\nPack bags',
      priority: 'high',
      dueDate: '2026-12-01',
    });
  });

  it('keeps Enter in Notes as a new line instead of adding the task', async () => {
    const { onAdd, user } = renderForm();

    await user.type(title(), 'Plan trip');
    await user.type(notes(), 'one{Enter}two');

    expect(onAdd).not.toHaveBeenCalled();
    expect(notes()).toHaveValue('one\ntwo');
  });

  it('can be filled and submitted with the keyboard alone', async () => {
    const { onAdd, user } = renderForm();

    await user.tab();
    expect(title()).toHaveFocus();
    await user.keyboard('Call Sam');
    await user.tab();
    expect(notes()).toHaveFocus();
    await user.keyboard('About the move');
    await user.tab();
    expect(priority()).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByRole('option', { name: 'Low' }));
    title().focus();
    await user.keyboard('{Enter}');

    expect(onAdd).toHaveBeenCalledWith({ title: 'Call Sam', notes: 'About the move', priority: 'low', dueDate: null });
  });

  it.each([
    ['an empty title', ''],
    ['a spaces-only title', '   '],
  ])('refuses %s with an error tied to Title', async (_case, typed) => {
    const { onAdd, user } = renderForm();

    await user.type(notes(), 'kept');
    await user.click(title());
    await user.keyboard(`${typed}{Enter}`);

    expect(onAdd).not.toHaveBeenCalled();
    expect(title()).toHaveAttribute('aria-invalid', 'true');
    expect(titleDescription()).toContain('Title is required');
    expect(title()).toHaveFocus();
    expect(notes()).toHaveValue('kept');
  });

  it('moves focus to Title when Add task is clicked with no title', async () => {
    const { onAdd, user } = renderForm();

    await user.click(addButton());

    expect(onAdd).not.toHaveBeenCalled();
    expect(titleDescription()).toContain('Title is required');
    expect(title()).toHaveFocus();
  });

  it('clears the error once the title has text again', async () => {
    const { user } = renderForm();

    await user.type(title(), '{Enter}');
    await user.type(title(), ' ');
    expect(titleDescription()).toContain('Title is required');

    await user.type(title(), 'x');

    expect(titleDescription()).not.toContain('Title is required');
    expect(title()).not.toHaveAttribute('aria-invalid');
  });

  it('empties every field and puts focus back in Title after adding', async () => {
    const { onAdd, user } = renderForm();

    await user.type(title(), 'Plan trip');
    await user.type(notes(), 'Book trains');
    await choosePriority(user, 'High');
    await user.type(dueDate(), '2026-12-01');
    await user.click(addButton());

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(title()).toHaveValue('');
    expect(notes()).toHaveValue('');
    expect(priority()).toHaveTextContent('Medium');
    expect(dueDate()).toHaveValue('');
    expect(title()).toHaveFocus();
  });

  it('adds the next task straight away after the first', async () => {
    const { onAdd, user } = renderForm();

    await user.type(title(), 'First{Enter}');
    await user.keyboard('Second{Enter}');

    expect(onAdd).toHaveBeenCalledTimes(2);
    expect(onAdd).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Second' }));
  });
});
