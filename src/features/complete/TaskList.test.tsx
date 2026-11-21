import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../../test/taskFixtures';
import type { TaskListProps } from '../../tasks/props';
import type { Task } from '../../tasks/types';
import { TaskList } from './TaskList';

function renderList(tasks: Task[], overrides: Partial<TaskListProps> = {}) {
  const props: TaskListProps = {
    tasks,
    onToggle: vi.fn(),
    renderActions: vi.fn(() => null),
    ...overrides,
  };
  const view = render(<TaskList {...props} />);
  return { ...view, props };
}

const rows = () => within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem');

describe('TaskList', () => {
  it('renders one row per task, in the order given', () => {
    renderList([makeTask({ id: 'a', title: 'First' }), makeTask({ id: 'b', title: 'Second' })]);

    expect(rows()).toHaveLength(2);
    expect(within(rows()[0]).getByRole('checkbox', { name: 'First' })).toBeInTheDocument();
    expect(within(rows()[1]).getByRole('checkbox', { name: 'Second' })).toBeInTheDocument();
  });

  it('renders an empty list without crashing', () => {
    renderList([]);

    expect(screen.getByRole('list', { name: 'Tasks' })).toBeEmptyDOMElement();
  });

  it('labels each checkbox with the task title and checks it when the task is complete', () => {
    renderList([makeTask({ id: 'a', title: 'Open' }), makeTask({ id: 'b', title: 'Done', completed: true })]);

    expect(screen.getByRole('checkbox', { name: 'Open' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Done' })).toBeChecked();
  });

  it('strikes through the title of a completed task only', () => {
    renderList([makeTask({ id: 'a', title: 'Open' }), makeTask({ id: 'b', title: 'Done', completed: true })]);

    expect(screen.getByText('Open').closest('[data-completed]')).toHaveAttribute('data-completed', 'false');
    expect(screen.getByText('Done').closest('[data-completed]')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByText('Done').closest('[data-completed]')).toHaveStyle({ textDecoration: 'line-through' });
    expect(screen.getByText('Open').closest('[data-completed]')).not.toHaveStyle({ textDecoration: 'line-through' });
  });

  it('shows the notes as the checkbox description only when there are some', () => {
    renderList([makeTask({ id: 'a', title: 'With', notes: 'Semi-skimmed' }), makeTask({ id: 'b', title: 'Without' })]);

    expect(screen.getByRole('checkbox', { name: 'With' })).toHaveAccessibleDescription('Semi-skimmed');
    expect(screen.getByRole('checkbox', { name: 'Without' })).not.toHaveAttribute('aria-describedby');
  });

  it.each([
    ['high', 'High priority'],
    ['medium', 'Medium priority'],
    ['low', 'Low priority'],
  ] as const)('shows a %s priority badge', (priority, label) => {
    renderList([makeTask({ priority })]);

    expect(within(rows()[0]).getByText(label)).toBeInTheDocument();
  });

  it('shows the due date as a <time> only when it is set', () => {
    renderList([makeTask({ id: 'a', title: 'Dated', dueDate: '2026-03-14' }), makeTask({ id: 'b', title: 'Undated' })]);

    const [dated, undated] = rows();
    const time = dated.querySelector('time');
    expect(time).toHaveAttribute('dateTime', '2026-03-14');
    expect(time).toHaveTextContent(/^Due /);
    expect(undated.querySelector('time')).toBeNull();
  });

  it('formats the due date in UTC, so the day never shifts', () => {
    renderList([makeTask({ dueDate: '2026-03-14' })]);

    const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date('2026-03-14T00:00:00Z'),
    );
    expect(rows()[0].querySelector('time')).toHaveTextContent(`Due ${expected}`);
  });

  it('renders the task text as text, never as HTML', () => {
    renderList([makeTask({ title: '<b>x</b>', notes: '<i>y</i>' })]);

    expect(screen.getByRole('checkbox', { name: '<b>x</b>' })).toBeInTheDocument();
    expect(screen.getByText('<i>y</i>')).toBeInTheDocument();
    expect(rows()[0].querySelector('b, i')).toBeNull();
  });

  it('renders each row’s actions once, inside that row', () => {
    const tasks = [makeTask({ id: 'a', title: 'A' }), makeTask({ id: 'b', title: 'B' })];
    const renderActions = vi.fn((task: Task) => <button type="button">Edit {task.title}</button>);

    renderList(tasks, { renderActions });

    expect(within(rows()[0]).getByRole('button', { name: 'Edit A' })).toBeInTheDocument();
    expect(within(rows()[1]).getByRole('button', { name: 'Edit B' })).toBeInTheDocument();
    expect(renderActions.mock.calls.map(([task]) => task.id)).toEqual(['a', 'b']);
  });

  it('calls onToggle with the task id when a checkbox is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderList([makeTask({ id: 'a', title: 'A' }), makeTask({ id: 'b', title: 'B', completed: true })]);

    await user.click(screen.getByRole('checkbox', { name: 'B' }));

    expect(props.onToggle).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('puts focus back on the toggled checkbox after its row moves', async () => {
    // A browser blurs a focused element when React moves its row; jsdom does not, so the
    // toggle handler here drops focus the way the browser would before the list re-renders.
    const user = userEvent.setup();
    const a = makeTask({ id: 'a', title: 'A' });
    const b = makeTask({ id: 'b', title: 'B' });
    const onToggle = vi.fn(() => (document.activeElement as HTMLElement | null)?.blur());
    const { rerender, props } = renderList([a, b], { onToggle });

    screen.getByRole('checkbox', { name: 'A' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'A' })).not.toHaveFocus();

    rerender(<TaskList {...props} tasks={[b, { ...a, completed: true }]} />);

    expect(screen.getByRole('checkbox', { name: 'A' })).toHaveFocus();
  });

  it('does not take focus when the checkbox did not have it', () => {
    const a = makeTask({ id: 'a', title: 'A' });
    const b = makeTask({ id: 'b', title: 'B' });
    const { rerender, props } = renderList([a, b]);

    rerender(<TaskList {...props} tasks={[b, { ...a, completed: true }]} />);

    expect(document.body).toHaveFocus();
  });

  it('reaches each checkbox with Tab, in order, and toggles the focused one with Space', async () => {
    const user = userEvent.setup();
    const { props } = renderList([makeTask({ id: 'a', title: 'A' }), makeTask({ id: 'b', title: 'B' })]);

    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'A' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'B' })).toHaveFocus();

    await user.keyboard(' ');
    expect(props.onToggle).toHaveBeenCalledExactlyOnceWith('b');
  });
});
