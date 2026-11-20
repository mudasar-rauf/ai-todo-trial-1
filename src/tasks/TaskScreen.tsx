// Shared composition root (#4): wires the store to every feature's component. Features do not edit it.
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
import { useId, useState } from 'react';
import { AddTaskForm } from '../features/add/AddTaskForm';
import { TaskList } from '../features/complete/TaskList';
import { TaskItemActions } from '../features/edit/TaskItemActions';
import { TaskEmptyState } from '../features/empty/TaskEmptyState';
import { TaskFilterBar } from '../features/filter/TaskFilterBar';
import { StorageErrorBanner } from '../features/persistence/StorageErrorBanner';
import { createLocalStorageTaskStorage } from '../features/persistence/localStorageTaskStorage';
import type { Task } from './types';
import { useTasks, type UseTasksOptions } from './useTasks';

export type TaskScreenProps = Partial<UseTasksOptions>;

export function TaskScreen({ storage: givenStorage, createId, now }: TaskScreenProps) {
  // Created once, so the store's save effect sees a stable storage.
  const [storage] = useState(() => givenStorage ?? createLocalStorageTaskStorage());
  const store = useTasks({ storage, createId, now });
  const headingId = useId();

  const renderActions = (task: Task) => (
    <TaskItemActions task={task} onUpdate={store.updateTask} onDelete={store.deleteTask} />
  );

  return (
    <VStack as="section" aria-labelledby={headingId} gap={4} padding={4}>
      <Heading level={2} id={headingId}>
        Tasks
      </Heading>
      <StorageErrorBanner error={store.storageError} onDismiss={store.dismissStorageError} />
      <AddTaskForm onAdd={store.addTask} />
      <TaskFilterBar
        filter={store.filter}
        onFilterChange={store.setFilter}
        completedCount={store.completedCount}
        onClearCompleted={store.clearCompleted}
      />
      {store.visibleTasks.length > 0 ? (
        <TaskList tasks={store.visibleTasks} onToggle={store.toggleTask} renderActions={renderActions} />
      ) : (
        <TaskEmptyState totalCount={store.tasks.length} filter={store.filter} />
      )}
    </VStack>
  );
}
