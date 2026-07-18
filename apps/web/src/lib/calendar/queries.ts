import { calculateHorseUtilization } from '@equestrian-scheduler/calendar';

import { createClient } from '@/lib/supabase/server';

import { formatTime, getMinutesOfDay, getZonedDayRange } from './time';
import type {
  CalendarDayData,
  CalendarLesson,
  CalendarLessonHorse,
  CalendarResource,
  HorseUsage,
  LessonFormOptions,
  LessonStatus,
  PersonOption,
  ResourceType,
} from './types';

type ProfileRelation =
  { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
type HorseRelation =
  | { id: string; name: string; daily_ride_limit: number }
  | { id: string; name: string; daily_ride_limit: number }[]
  | null;

type ParticipantHorseRow = { horses: HorseRelation };

type ParticipantRow = {
  id: string;
  status: LessonStatus;
  // PostgREST returns a single object (not an array) when the embedded table has
  // a unique constraint on the foreign key, so account for both shapes.
  participant_horses: ParticipantHorseRow[] | ParticipantHorseRow | null;
};

type LessonRow = {
  id: string;
  resource_id: string;
  status: LessonStatus;
  starts_at: string;
  ends_at: string;
  max_participants: number;
  cancellation_reason: string | null;
  instructor: ProfileRelation;
  lesson_participants: ParticipantRow[] | null;
};

function unwrap<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation ?? null;
}

// Normalizes a PostgREST embedded relation (which may be an array, a single
// object for unique relations, or null) into an array.
function toArray<T>(relation: T | T[] | null | undefined): T[] {
  if (relation == null) return [];
  return Array.isArray(relation) ? relation : [relation];
}

export async function getCalendarDay(
  organizationId: string,
  dateStr: string,
  timeZone: string,
): Promise<CalendarDayData> {
  const supabase = await createClient();
  const { startUtc, endUtc } = getZonedDayRange(dateStr, timeZone);

  const [resourcesResult, lessonsResult] = await Promise.all([
    supabase
      .from('facility_resources')
      .select('id, name, type, parallel_capacity')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('name'),
    supabase
      .from('lessons')
      .select(
        `id, resource_id, status, starts_at, ends_at, max_participants, cancellation_reason,
         instructor:profiles!lessons_instructor_id_fkey ( first_name, last_name ),
         lesson_participants ( id, status, participant_horses ( horses ( id, name, daily_ride_limit ) ) )`,
      )
      .eq('organization_id', organizationId)
      .gte('starts_at', startUtc.toISOString())
      .lt('starts_at', endUtc.toISOString())
      .order('starts_at'),
  ]);

  const resources: CalendarResource[] = (resourcesResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as ResourceType,
    parallelCapacity: row.parallel_capacity as number,
  }));

  const lessonRows = (lessonsResult.data ?? []) as unknown as LessonRow[];

  // Aggregate active rides per horse to compute today's utilization. Only active
  // participants on active lessons count towards a horse's daily load.
  const horseUsageMap = new Map<string, { name: string; dailyLimit: number; rides: number }>();

  const lessons: CalendarLesson[] = lessonRows.map((row) => {
    const startsAt = new Date(row.starts_at);
    const endsAt = new Date(row.ends_at);
    const instructor = unwrap(row.instructor);
    const instructorName = instructor
      ? `${instructor.first_name} ${instructor.last_name}`.trim()
      : 'Bez instruktora';

    const activeParticipants = toArray(row.lesson_participants).filter(
      (participant) => participant.status === 'active',
    );

    const horses: CalendarLessonHorse[] = [];
    for (const participant of activeParticipants) {
      for (const link of toArray(participant.participant_horses)) {
        const horse = unwrap(link.horses);
        if (!horse) continue;
        horses.push({ id: horse.id, name: horse.name });

        if (row.status === 'active') {
          const existing = horseUsageMap.get(horse.id);
          if (existing) {
            existing.rides += 1;
          } else {
            horseUsageMap.set(horse.id, {
              name: horse.name,
              dailyLimit: horse.daily_ride_limit,
              rides: 1,
            });
          }
        }
      }
    }

    return {
      id: row.id,
      resourceId: row.resource_id,
      instructorName,
      status: row.status,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      startMinutes: getMinutesOfDay(startsAt, timeZone),
      endMinutes: getMinutesOfDay(endsAt, timeZone),
      startLabel: formatTime(startsAt, timeZone),
      endLabel: formatTime(endsAt, timeZone),
      durationMinutes: Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
      maxParticipants: row.max_participants,
      participantCount: activeParticipants.length,
      horses,
      cancellationReason: row.cancellation_reason,
    };
  });

  const horseUsage: HorseUsage[] = Array.from(horseUsageMap.entries())
    .map(([id, value]) => {
      const { percentage } = calculateHorseUtilization(value.rides, value.dailyLimit);
      return {
        id,
        name: value.name,
        ridesToday: value.rides,
        dailyLimit: value.dailyLimit,
        percentage,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name, 'pl'));

  return { resources, lessons, horseUsage };
}

type MembershipOptionRow = {
  user_id: string;
  role: string;
  profiles:
    { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
};

// Fetches the selectable options a manager needs to create a lesson:
// active resources, instructors (manager/instructor), potential participants
// (client/boarder) and active horses.
export async function getLessonFormOptions(organizationId: string): Promise<LessonFormOptions> {
  const supabase = await createClient();

  const [resourcesResult, membersResult, horsesResult] = await Promise.all([
    supabase
      .from('facility_resources')
      .select('id, name, type, parallel_capacity')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('name'),
    supabase
      .from('memberships')
      .select('user_id, role, profiles ( first_name, last_name )')
      .eq('organization_id', organizationId)
      .is('archived_at', null),
    supabase
      .from('horses')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .is('archived_at', null)
      .order('name'),
  ]);

  const resources: CalendarResource[] = (resourcesResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as ResourceType,
    parallelCapacity: row.parallel_capacity as number,
  }));

  const memberRows = (membersResult.data ?? []) as unknown as MembershipOptionRow[];
  const instructors: PersonOption[] = [];
  const clients: PersonOption[] = [];

  for (const row of memberRows) {
    const profile = unwrap(row.profiles);
    const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Bez nazwy';
    const option: PersonOption = { id: row.user_id, name };

    if (row.role === 'manager' || row.role === 'instructor') {
      instructors.push(option);
    }
    if (row.role === 'client' || row.role === 'boarder') {
      clients.push(option);
    }
  }

  instructors.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  clients.sort((a, b) => a.name.localeCompare(b.name, 'pl'));

  const horses = (horsesResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));

  return { resources, instructors, clients, horses };
}
