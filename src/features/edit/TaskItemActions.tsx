// Owned by F3 (Edit and delete); see docs/contracts/tasks.md.
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { TaskItemActionsProps } from '../../tasks/props';
import type { Priority, Task, TaskDraft } from '../../tasks/types';

// The same words as the composer's (F1), so the two forms read alike.
const TITLE_REQUIRED = 'Title is required';
const COMPOSER_TITLE_LABEL = 'Title';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

type DueDate = Parameters<NonNullable<Parameters<typeof DateInput>[0]['onChange']>>[0];

/**
 * The composer's Title field, found from an element in the task screen.
 *
 * The contract gives F3 no handle on F1's input, so this looks for a visible "Title" label
 * (a trailing required marker allowed) that is not inside a dialog, in the nearest enclosing
 * <section> that has one. It walks out through sections, so a section a row or list adds of its
 * own does not hide the composer. Follow-up: replace with an explicit hook in the contract.
 */
function findComposerTitle(from: Element | null): HTMLElement | null {
  for (let section = from?.closest('section'); section; section = section.parentElement?.closest('section')) {
    for (const label of section.querySelectorAll('label')) {
      if (label.closest('dialog')) continue;
      const text = label.textContent?.trim().replace(/\s*\*$/, '');
      if (text === COMPOSER_TITLE_LABEL && label.control) return label.control;
    }
  }
  return null;
}

/**
 * Focuses `preferred` once React has committed and the dialog has handed focus back,
 * or `fallback` if `preferred` has gone (a filter can hide the row an edit changed).
 */
function focusAfterCommit(preferred: HTMLElement | null, fallback: HTMLElement | null) {
  setTimeout(() => {
    const target = preferred?.isConnected ? preferred : fallback;
    if (target?.isConnected) target.focus();
  }, 0);
}

interface EditTaskFormProps {
  task: Task;
  onSave(draft: TaskDraft): void;
  onCancel(): void;
}

/** The edit dialog's form, prefilled from the task when it mounts. */
function EditTaskForm({ task, onSave, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState<DueDate>((task.dueDate ?? undefined) as DueDate);
  const [titleError, setTitleError] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError && value.trim() !== '') setTitleError(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      setTitleError(true);
      titleInput.current?.focus();
      return;
    }
    onSave({ title: trimmedTitle, notes, priority, dueDate: dueDate ?? null });
  };

  return (
    // noValidate: the form shows its own error next to Title instead of the browser's bubble.
    <form aria-label="Edit task" noValidate onSubmit={handleSubmit}>
      <VStack gap={3}>
        <TextInput
          ref={titleInput}
          label="Title"
          value={title}
          onChange={handleTitleChange}
          hasAutoFocus
          status={titleError ? { type: 'error', message: TITLE_REQUIRED } : undefined}
        />
        <TextArea label="Notes" value={notes} onChange={setNotes} />
        <HStack gap={3} wrap="wrap">
          <Selector
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={(value) => setPriority(value as Priority)}
          />
          <DateInput label="Due date" value={dueDate} onChange={setDueDate} />
        </HStack>
        <HStack gap={2} hAlign="end">
          <Button type="button" variant="ghost" label="Cancel" onClick={onCancel} />
          <Button type="submit" label="Save" />
        </HStack>
      </VStack>
    </form>
  );
}

/** Edit in a Dialog; delete behind an AlertDialog. */
export function TaskItemActions({ task, onUpdate, onDelete }: TaskItemActionsProps): ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  const closeEdit = () => {
    const button = editButton.current;
    setIsEditing(false);
    // Back to this row's Edit button; to the composer if the save took the row off the screen.
    focusAfterCommit(button, findComposerTitle(button));
  };

  const saveEdit = (draft: TaskDraft) => {
    onUpdate(task.id, draft);
    closeEdit();
  };

  const confirmDelete = () => {
    // Look the composer up while this row is still in the document.
    const composerTitle = findComposerTitle(deleteButton.current);
    setIsConfirmingDelete(false);
    onDelete(task.id);
    focusAfterCommit(composerTitle, null);
  };

  return (
    <HStack gap={2}>
      <Button ref={editButton} variant="secondary" label="Edit" aria-label={`Edit “${task.title}”`} onClick={() => setIsEditing(true)} />
      <Button
        ref={deleteButton}
        variant="secondary"
        label="Delete"
        aria-label={`Delete “${task.title}”`}
        onClick={() => setIsConfirmingDelete(true)}
      />
      <Dialog isOpen={isEditing} onOpenChange={(open) => !open && closeEdit()} purpose="form">
        {/* The form exists only while open: each opening starts from the task, not an abandoned
            draft, and a row does not carry a hidden form's fields in its content. */}
        {isEditing && (
          <VStack gap={4}>
            <DialogHeader title="Edit task" onOpenChange={(open) => !open && closeEdit()} />
            <EditTaskForm task={task} onSave={saveEdit} onCancel={closeEdit} />
          </VStack>
        )}
      </Dialog>
      <AlertDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete task?"
        description={`“${task.title}” will be deleted.`}
        actionLabel="Delete"
        actionVariant="destructive"
        onAction={confirmDelete}
      />
    </HStack>
  );
}
