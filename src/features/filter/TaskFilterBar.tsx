import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import type { ReactNode } from 'react';
import type { TaskFilterBarProps } from '../../tasks/props';

/**
 * F4's filter bar. For now it holds only "Clear completed (N)"; the status and search
 * controls land beside it in a later issue.
 *
 * The button is always rendered and, with nothing to clear, uses Astryx's `isDisabled`,
 * which sets `aria-disabled="true"` (never the native `disabled` attribute) and ignores
 * clicks, Enter and Space. So it stays focusable, and focus stays on it after a clear
 * (docs/contracts/tasks.md, section 4). Keep it a stable child here so it never remounts.
 */
export function TaskFilterBar({ completedCount, onClearCompleted }: TaskFilterBarProps): ReactNode {
  return (
    <HStack>
      <Button
        type="button"
        variant="secondary"
        label={`Clear completed (${completedCount})`}
        isDisabled={completedCount === 0}
        onClick={() => onClearCompleted()}
      />
    </HStack>
  );
}
