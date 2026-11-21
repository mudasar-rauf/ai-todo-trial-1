import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { TaskItemActionsProps } from '../../tasks/props';
import { makeTask } from '../../test/taskFixtures';
import type { Task, TaskPatch } from '../../tasks/types';
import { TaskItemActions } from './TaskItemActions';

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

const TASK = makeTask({
  id: 'task-1',
  title: 'Buy milk',
  notes: 'Semi-skimmed',
  priority: 'high',
  dueDate: '2026-12-01',
});

interface HarnessProps {
  initial: Task;
  onUpdate: TaskItemActionsProps['onUpdate'];
  onDelete: TaskItemActionsProps['onDelete'];
  withComposer: boolean;
  /** Takes the row off the screen on update, as a search the new title no longer matches would. */
  hideOnUpdate: boolean;
}

/**
 * Holds the task in state like the store does, inside a section with a stand-in composer
 * (a labelled Title input), and a decoy Title inside a dialog that must be skipped.
 */
function Harness({ initial, onUpdate, onDelete, withComposer, hideOnUpdate }: HarnessProps) {
  const [task, setTask] = useState<Task | null>(initial);
  return (
    <section aria-label="Tasks">
      <dialog>
        <label>
          Title <input data-testid="decoy" />
        </label>
      </dialog>
      {withComposer && (
        <label>
          Title * <input data-testid="composer-title" />
        </label>
      )}
      <ul>
        {task && (
          <li>
            {/* F2 might wrap its list in a section of its own; the composer is found above it. */}
            <section aria-label="Row">
              <TaskItemActions
                task={task}
                onUpdate={(id: string, patch: TaskPatch) => {
                  onUpdate(id, patch);
                  setTask((current) => (current && !hideOnUpdate ? { ...current, ...patch } : null));
                }}
                onDelete={(id: string) => {
                  onDelete(id);
                  setTask(null);
                }}
              />
            </section>
          </li>
        )}
      </ul>
    </section>
  );
}

function renderActions(task: Task = TASK, { withComposer = true, hideOnUpdate = false } = {}) {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const user = userEvent.setup();
  render(
    <Harness
      initial={task}
      onUpdate={onUpdate}
      onDelete={onDelete}
      withComposer={withComposer}
      hideOnUpdate={hideOnUpdate}
    />,
  );
  return { onUpdate, onDelete, user };
}

const editButton = () => screen.getByRole('button', { name: /^Edit/ });
const deleteButton = () => screen.getByRole('button', { name: /^Delete/ });
const editDialog = () => screen.getByRole('dialog', { name: 'Edit task' });
const queryEditDialog = () => screen.queryByRole('dialog', { name: 'Edit task' });
const inEdit = () => within(editDialog());
const titleField = () => inEdit().getByLabelText('Title');
const alert = () => screen.getByRole('alertdialog', { name: 'Delete task?' });
const queryAlert = () => screen.queryByRole('alertdialog');

/** The text Title's aria-describedby points at, where its error shows. */
function titleDescription(): string {
  const ids = titleField().getAttribute('aria-describedby')?.split(' ') ?? [];
  return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
}

/** Lets the focus moves that run after a dialog closes or a row goes away settle. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('TaskItemActions: the row buttons', () => {
  it('shows Edit and Delete buttons named for the task', () => {
    renderActions();

    expect(screen.getByRole('button', { name: 'Edit “Buy milk”' })).toHaveTextContent('Edit');
    expect(screen.getByRole('button', { name: 'Delete “Buy milk”' })).toHaveTextContent('Delete');
  });
});

describe('TaskItemActions: editing', () => {
  it('opens a dialog named "Edit task" prefilled with the task', async () => {
    const { user } = renderActions();

    await user.click(editButton());

    expect(titleField()).toHaveValue('Buy milk');
    expect(inEdit().getByLabelText('Notes')).toHaveValue('Semi-skimmed');
    expect(inEdit().getByRole('combobox', { name: 'Priority' })).toHaveTextContent('High');
    // The date input shows the date formatted for the locale; the next test checks the value it holds.
    expect(inEdit().getByRole('combobox', { name: 'Due date' })).not.toHaveValue('');
    expect(inEdit().getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(inEdit().getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('sends the task’s own values when saved unchanged', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.click(inEdit().getByRole('button', { name: 'Save' }));

    expect(onUpdate).toHaveBeenCalledWith('task-1', {
      title: 'Buy milk',
      notes: 'Semi-skimmed',
      priority: 'high',
      dueDate: '2026-12-01',
    });
  });

  it('saves every edited field, closes, and returns focus to Edit', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.clear(titleField());
    await user.type(titleField(), '  Buy oat milk ');
    await user.clear(inEdit().getByLabelText('Notes'));
    await user.type(inEdit().getByLabelText('Notes'), 'Two cartons');
    await user.click(inEdit().getByRole('combobox', { name: 'Priority' }));
    await user.click(screen.getByRole('option', { name: 'Low' }));
    await user.clear(inEdit().getByRole('combobox', { name: 'Due date' }));
    await user.click(inEdit().getByRole('button', { name: 'Save' }));
    await settle();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith('task-1', {
      title: 'Buy oat milk',
      notes: 'Two cartons',
      priority: 'low',
      dueDate: null,
    });
    expect(queryEditDialog()).not.toBeInTheDocument();
    expect(editButton()).toHaveAccessibleName('Edit “Buy oat milk”');
    expect(editButton()).toHaveFocus();
  });

  it('moves focus to the composer’s Title when the save takes the row off the screen', async () => {
    const { onUpdate, user } = renderActions(TASK, { hideOnUpdate: true });

    await user.click(editButton());
    await user.click(inEdit().getByRole('button', { name: 'Save' }));
    await settle();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('composer-title')).toHaveFocus();
  });

  it('saves when Enter is pressed in Title', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.type(titleField(), ' today{Enter}');

    expect(onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({ title: 'Buy milk today' }));
    expect(queryEditDialog()).not.toBeInTheDocument();
  });

  it('closes on Cancel without saving, returns focus to Edit, and reopens with the task, not the abandoned edit', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.type(titleField(), ' changed');
    await user.click(inEdit().getByRole('button', { name: 'Cancel' }));
    await settle();

    expect(onUpdate).not.toHaveBeenCalled();
    expect(queryEditDialog()).not.toBeInTheDocument();
    expect(editButton()).toHaveFocus();

    await user.click(editButton());
    expect(titleField()).toHaveValue('Buy milk');
  });

  it('closes on Escape without saving and returns focus to Edit', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.type(titleField(), ' changed');
    await user.keyboard('{Escape}');
    await settle();

    expect(onUpdate).not.toHaveBeenCalled();
    expect(queryEditDialog()).not.toBeInTheDocument();
    expect(editButton()).toHaveFocus();
  });

  it.each([
    ['empty', ''],
    ['spaces-only', '   '],
  ])('blocks saving an %s title with the required-title error on Title', async (_kind, title) => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.clear(titleField());
    if (title) await user.type(titleField(), title);
    await user.click(inEdit().getByRole('button', { name: 'Save' }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(editDialog()).toBeInTheDocument();
    expect(titleField()).toHaveAttribute('aria-invalid', 'true');
    expect(titleDescription()).toContain('Title is required');
    expect(titleField()).toHaveFocus();
  });

  it('clears the error once a title is typed, then saves', async () => {
    const { onUpdate, user } = renderActions();

    await user.click(editButton());
    await user.clear(titleField());
    await user.click(inEdit().getByRole('button', { name: 'Save' }));
    await user.type(titleField(), 'Buy bread');

    expect(titleDescription()).not.toContain('Title is required');

    await user.click(inEdit().getByRole('button', { name: 'Save' }));
    expect(onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({ title: 'Buy bread' }));
  });

  it('shows task text with markup as plain text', async () => {
    const { user } = renderActions(makeTask({ title: '<b>bold</b> & co', notes: '<i>x</i>' }));

    expect(editButton()).toHaveAccessibleName('Edit “<b>bold</b> & co”');
    await user.click(editButton());

    expect(titleField()).toHaveValue('<b>bold</b> & co');
    expect(inEdit().getByLabelText('Notes')).toHaveValue('<i>x</i>');
    expect(document.querySelector('b, i')).toBeNull();
  });

  it('can be used with the keyboard alone', async () => {
    const { onUpdate, user } = renderActions();

    editButton().focus();
    await user.keyboard('{Enter}');
    expect(editDialog()).toBeInTheDocument();

    titleField().focus();
    await user.keyboard('{End}!{Enter}');
    await settle();

    expect(onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({ title: 'Buy milk!' }));
    expect(editButton()).toHaveFocus();
  });
});

describe('TaskItemActions: deleting', () => {
  it('asks for confirmation in a dialog that names the task', async () => {
    const { onDelete, user } = renderActions();

    await user.click(deleteButton());

    expect(alert()).toHaveTextContent('“Buy milk” will be deleted.');
    expect(within(alert()).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(alert()).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('keeps the task on Cancel', async () => {
    const { onDelete, user } = renderActions();

    await user.click(deleteButton());
    await user.click(within(alert()).getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(queryAlert()).not.toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
  });

  it('keeps the task on Escape', async () => {
    const { onDelete, user } = renderActions();

    await user.click(deleteButton());
    await user.keyboard('{Escape}');

    expect(onDelete).not.toHaveBeenCalled();
    expect(queryAlert()).not.toBeInTheDocument();
  });

  it('deletes on Delete and moves focus to the composer’s Title, skipping a Title inside a dialog', async () => {
    const { onDelete, user } = renderActions();

    await user.click(deleteButton());
    await user.click(within(alert()).getByRole('button', { name: 'Delete' }));
    await settle();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('task-1');
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('composer-title')).toHaveFocus());
  });

  it('still deletes when there is no composer Title to focus', async () => {
    const { onDelete, user } = renderActions(TASK, { withComposer: false });

    await user.click(deleteButton());
    await user.click(within(alert()).getByRole('button', { name: 'Delete' }));
    await settle();

    expect(onDelete).toHaveBeenCalledWith('task-1');
    expect(screen.getByTestId('decoy')).not.toHaveFocus();
  });

  it('names a task with markup as plain text', async () => {
    const { user } = renderActions(makeTask({ title: '<b>bold</b>' }));

    await user.click(deleteButton());

    expect(alert()).toHaveTextContent('“<b>bold</b>” will be deleted.');
    expect(document.querySelector('b')).toBeNull();
  });
});
