// Shared (#15): keeps an unexpected error in the task screen inside the main region. See docs/contracts/tasks.md section 3.
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Component, useId, type ErrorInfo, type ReactNode } from 'react';

export interface TaskScreenErrorBoundaryProps {
  children: ReactNode;
  /** Called by the Reload button. Defaults to reloading the page; tests inject their own. */
  onReload?: () => void;
}

interface TaskScreenErrorBoundaryState {
  /** A flag, not the thrown value: anything can be thrown, including undefined and null. */
  hasError: boolean;
}

const reloadPage = () => window.location.reload();

function TaskScreenErrorFallback({ onReload }: { onReload: () => void }) {
  const headingId = useId();
  return (
    <div role="alert" aria-labelledby={headingId}>
      <VStack gap={2} padding={4}>
        <Heading level={2} id={headingId}>
          Something went wrong
        </Heading>
        <p>The task list hit an unexpected error. Reload the page to try again.</p>
        <HStack>
          <Button type="button" label="Reload" onClick={onReload} />
        </HStack>
      </VStack>
    </div>
  );
}

/**
 * Catches what the task screen throws during render, in lifecycle methods and in effects, logs it,
 * and shows a message with a Reload button in its place. TaskStorageError never gets here: useTasks
 * turns it into storageError state.
 */
export class TaskScreenErrorBoundary extends Component<TaskScreenErrorBoundaryProps, TaskScreenErrorBoundaryState> {
  state: TaskScreenErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): TaskScreenErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('The task screen failed:', error, info.componentStack ?? '');
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <TaskScreenErrorFallback onReload={this.props.onReload ?? reloadPage} />;
  }
}
