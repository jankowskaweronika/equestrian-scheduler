'use client';

import { useState } from 'react';

import { spacing, typography, colors } from '@equestrian-scheduler/ui-tokens';

import { createLesson } from '@/lib/calendar/actions';
import { Button, Field, Input, RESOURCE_TYPE_LABELS, Select } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import type { LessonFormOptions } from '@/lib/calendar/types';

let rowCounter = 0;

export function AddLessonForm({
  options,
  defaultDate,
}: {
  options: LessonFormOptions;
  defaultDate: string;
}) {
  const [rows, setRows] = useState<number[]>(() => [rowCounter++]);

  const canCreate = options.resources.length > 0 && options.instructors.length > 0;

  if (!canCreate) {
    return (
      <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
        Aby dodać lekcję, potrzebujesz co najmniej jednego zasobu i jednego instruktora (w
        zakładkach Zasoby i Zespół).
      </p>
    );
  }

  return (
    <form action={createLesson} style={{ display: 'grid', gap: spacing.md }}>
      <div
        style={{
          display: 'grid',
          gap: spacing.md,
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}
      >
        <Field label="Data">
          <Input type="date" name="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="Zasób">
          <Select name="resourceId" required defaultValue="">
            <option value="" disabled>
              — wybierz —
            </option>
            {options.resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({RESOURCE_TYPE_LABELS[resource.type]})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Instruktor">
          <Select name="instructorId" required defaultValue="">
            <option value="" disabled>
              — wybierz —
            </option>
            {options.instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Od">
          <Input type="time" name="startTime" step={900} defaultValue="10:00" required />
        </Field>
        <Field label="Do">
          <Input type="time" name="endTime" step={900} defaultValue="11:00" required />
        </Field>
        <Field label="Maks. uczestników">
          <Input type="number" name="maxParticipants" min={1} defaultValue={1} required />
        </Field>
      </div>

      <div>
        <p
          style={{
            margin: `0 0 ${spacing.sm}px`,
            fontSize: typography.fontSize.sm,
            fontWeight: 600,
          }}
        >
          Uczestnicy i konie
        </p>
        <div style={{ display: 'grid', gap: spacing.sm }}>
          {rows.map((rowId) => (
            <div
              key={rowId}
              style={{
                display: 'grid',
                gap: spacing.sm,
                gridTemplateColumns: '1fr 1fr auto',
                alignItems: 'center',
              }}
            >
              <Select name="participantUserId" defaultValue="">
                <option value="">— uczestnik (opcjonalnie) —</option>
                {options.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              <Select name="participantHorseId" defaultValue="">
                <option value="">— koń (opcjonalnie) —</option>
                {options.horses.map((horse) => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRows((current) => current.filter((id) => id !== rowId))}
                disabled={rows.length === 1}
                aria-label="Usuń wiersz"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setRows((current) => [...current, rowCounter++])}
          style={{ marginTop: spacing.sm }}
        >
          <PlusIcon width={16} height={16} /> Dodaj uczestnika
        </Button>
      </div>

      <Button type="submit" style={{ justifySelf: 'start' }}>
        <PlusIcon width={16} height={16} /> Dodaj lekcję
      </Button>
    </form>
  );
}
