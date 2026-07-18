'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireManagerSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import { zonedWallTimeToUtc } from './time';

function getOrganizationId(session: Awaited<ReturnType<typeof requireManagerSession>>) {
  const organizationId = session.membership?.organizationId ?? session.profile.activeOrganizationId;
  if (!organizationId) {
    throw new Error('Brak aktywnego ośrodka.');
  }
  return organizationId;
}

function redirectToCalendar(dateStr: string, params: { success?: string; error?: string }) {
  const search = new URLSearchParams({ date: dateStr });
  if (params.success) search.set('success', params.success);
  if (params.error) search.set('error', params.error);
  redirect(`/dashboard/calendar?${search.toString()}`);
}

export async function createLesson(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const date = String(formData.get('date') ?? '').trim();
  const resourceId = String(formData.get('resourceId') ?? '').trim();
  const instructorId = String(formData.get('instructorId') ?? '').trim();
  const startTime = String(formData.get('startTime') ?? '').trim();
  const endTime = String(formData.get('endTime') ?? '').trim();
  const maxParticipantsRaw = Number(formData.get('maxParticipants') ?? 1);

  // Participant rows: paired client + horse selects submitted in DOM order.
  const participantIds = formData.getAll('participantUserId').map((value) => String(value));
  const horseIds = formData.getAll('participantHorseId').map((value) => String(value));

  if (!date || !resourceId || !instructorId || !startTime || !endTime) {
    redirectToCalendar(date || new Date().toISOString().slice(0, 10), {
      error: 'Uzupełnij zasób, instruktora, datę i godziny lekcji.',
    });
    return;
  }

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from('organizations')
    .select('timezone')
    .eq('id', organizationId)
    .single();
  const timeZone = organization?.timezone ?? 'Europe/Warsaw';

  const startsAt = zonedWallTimeToUtc(date, startTime, timeZone);
  const endsAt = zonedWallTimeToUtc(date, endTime, timeZone);

  if (endsAt.getTime() <= startsAt.getTime()) {
    redirectToCalendar(date, { error: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia.' });
    return;
  }

  // Deduplicate participants by client, keeping the last selected horse. Rows
  // without a chosen client are ignored.
  const participantHorse = new Map<string, string | null>();
  for (let i = 0; i < participantIds.length; i += 1) {
    const userId = participantIds[i];
    if (!userId) continue;
    const horseId = horseIds[i] ?? '';
    participantHorse.set(userId, horseId || null);
  }

  const participantCount = participantHorse.size;
  const maxParticipants = Math.max(
    1,
    Number.isFinite(maxParticipantsRaw) ? maxParticipantsRaw : 1,
    participantCount,
  );

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      organization_id: organizationId,
      resource_id: resourceId,
      instructor_id: instructorId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active',
      max_participants: maxParticipants,
    })
    .select('id')
    .single();

  if (lessonError || !lesson) {
    redirectToCalendar(date, { error: 'Nie udało się utworzyć lekcji.' });
    return;
  }

  for (const [userId, horseId] of participantHorse) {
    const { data: participant, error: participantError } = await supabase
      .from('lesson_participants')
      .insert({ lesson_id: lesson.id, user_id: userId })
      .select('id')
      .single();

    if (participantError || !participant) {
      continue;
    }

    if (horseId) {
      await supabase
        .from('participant_horses')
        .insert({ participant_id: participant.id, horse_id: horseId });
    }
  }

  revalidatePath('/dashboard/calendar');
  redirectToCalendar(date, { success: 'Dodano lekcję.' });
}
