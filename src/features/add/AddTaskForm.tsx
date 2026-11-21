// Owned by F1 (Add); see docs/contracts/tasks.md.
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { AddTaskFormProps } from '../../tasks/props';
import { DEFAULT_PRIORITY, type Priority } from '../../tasks/types';

const TITLE_REQUIRED = 'Title is required';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

type DueDate = Parameters<NonNullable<Parameters<typeof DateInput>[0]['onChange']>>[0];

/** The composer: Title, Notes, Priority and Due date. Validates the title, then hands the draft to onAdd. */
export function AddTaskForm({ onAdd }: AddTaskFormProps): ReactNode {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
  const [dueDate, setDueDate] = useState<DueDate>(undefined);
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
      // Land keyboard and screen-reader users on the field the error belongs to.
      titleInput.current?.focus();
      return;
    }

    onAdd({ title: trimmedTitle, notes, priority, dueDate: dueDate ?? null });
    setTitle('');
    setNotes('');
    setPriority(DEFAULT_PRIORITY);
    setDueDate(undefined);
    titleInput.current?.focus();
  };

  return (
    // noValidate: the form shows its own error next to Title instead of the browser's bubble.
    <form aria-label="Add task" noValidate onSubmit={handleSubmit}>
      <VStack gap={3}>
        <TextInput
          ref={titleInput}
          label="Title"
          value={title}
          onChange={handleTitleChange}
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
        <HStack>
          <Button type="submit" label="Add task" />
        </HStack>
      </VStack>
    </form>
  );
}
