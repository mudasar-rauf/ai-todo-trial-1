// Owned by F2 (Order and complete); see docs/contracts/tasks.md.
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { useLayoutEffect, useRef, type ReactNode, type RefCallback } from 'react';
import type { TaskListProps } from '../../tasks/props';
import type { Priority, Task } from '../../tasks/types';

const PRIORITY_BADGE: Record<Priority, { label: string; variant: BadgeVariant }> = {
  high: { label: 'High priority', variant: 'error' },
  medium: { label: 'Medium priority', variant: 'warning' },
  low: { label: 'Low priority', variant: 'neutral' },
};

// dueDate is a date-only 'YYYY-MM-DD'; read and format it in UTC so the day never shifts.
const dueDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

function formatDueDate(dueDate: string): string {
  return dueDateFormat.format(new Date(`${dueDate}T00:00:00Z`));
}

const listStyle = { listStyle: 'none', margin: 0, padding: 0 } as const;
// Line-through rather than a muted colour, so a completed title keeps its contrast.
const completedStyle = { textDecoration: 'line-through' } as const;

interface TaskRowProps {
  task: Task;
  onToggle(id: string, hadFocus: boolean): void;
  checkboxRef: RefCallback<HTMLInputElement>;
  actions: ReactNode;
}

function TaskRow({ task, onToggle, checkboxRef, actions }: TaskRowProps) {
  const badge = PRIORITY_BADGE[task.priority];
  return (
    <li>
      <HStack gap={3} vAlign="center" wrap="wrap" paddingBlock={2}>
        <div data-completed={task.completed} style={task.completed ? completedStyle : undefined}>
          <CheckboxInput
            ref={checkboxRef}
            label={task.title}
            description={task.notes || undefined}
            value={task.completed}
            onChange={(_checked, event) => onToggle(task.id, event.target === document.activeElement)}
          />
        </div>
        <Badge label={badge.label} variant={badge.variant} />
        {task.dueDate !== null && <time dateTime={task.dueDate}>Due {formatDueDate(task.dueDate)}</time>}
        {actions}
      </HStack>
    </li>
  );
}

/** Renders each task, its completion checkbox, and renderActions(task). */
export function TaskList({ tasks, onToggle, renderActions }: TaskListProps): ReactNode {
  const checkboxes = useRef(new Map<string, HTMLInputElement>());
  const refocusId = useRef<string | null>(null);

  // Toggling moves the row to the other group, and a browser drops focus from an element
  // React moves. Put focus back on the checkbox the person just used, if it is still shown.
  useLayoutEffect(() => {
    const id = refocusId.current;
    if (id === null) return;
    refocusId.current = null;
    const checkbox = checkboxes.current.get(id);
    if (checkbox && checkbox !== document.activeElement) checkbox.focus();
  }, [tasks]);

  const handleToggle = (id: string, hadFocus: boolean) => {
    refocusId.current = hadFocus ? id : null;
    onToggle(id);
  };

  const checkboxRef =
    (id: string): RefCallback<HTMLInputElement> =>
    (element) => {
      if (element) checkboxes.current.set(id, element);
      else checkboxes.current.delete(id);
    };

  return (
    <ul aria-label="Tasks" style={listStyle}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={handleToggle}
          checkboxRef={checkboxRef(task.id)}
          actions={renderActions(task)}
        />
      ))}
    </ul>
  );
}
