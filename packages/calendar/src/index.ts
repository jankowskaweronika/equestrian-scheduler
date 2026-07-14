export type TimeRange = {
  startsAt: Date;
  endsAt: Date;
};

export type ConflictSeverity = 'warning' | 'error';

export type ConflictType =
  | 'resource_capacity'
  | 'instructor_overlap'
  | 'horse_overlap'
  | 'horse_daily_limit'
  | 'group_capacity';

export interface CalendarConflict {
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
  relatedEntityId?: string;
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function countOverlapping<T extends { range: TimeRange; isActive: boolean }>(
  items: T[],
  target: TimeRange,
): number {
  return items.filter((item) => item.isActive && rangesOverlap(item.range, target)).length;
}

export function calculateHorseUtilization(
  activeRidesToday: number,
  dailyLimit: number,
): { count: number; limit: number; percentage: number } {
  if (dailyLimit <= 0) {
    return { count: activeRidesToday, limit: dailyLimit, percentage: 0 };
  }

  const percentage = Math.round((activeRidesToday / dailyLimit) * 100);
  return {
    count: activeRidesToday,
    limit: dailyLimit,
    percentage: Math.min(percentage, 100),
  };
}

export function formatHorseUtilization(activeRidesToday: number, dailyLimit: number): string {
  const { count, limit, percentage } = calculateHorseUtilization(activeRidesToday, dailyLimit);
  return `${percentage}% (${count}/${limit} rides)`;
}

export interface LessonConflictInput {
  lessonId?: string;
  range: TimeRange;
  resourceId: string;
  resourceCapacity: number;
  instructorId: string;
  maxParticipants: number;
  participantCount: number;
  assignedHorseIds: string[];
}

export interface ExistingLessonSnapshot {
  lessonId: string;
  range: TimeRange;
  resourceId: string;
  instructorId: string;
  isActive: boolean;
  activeParticipantCount: number;
  assignedHorseIds: string[];
}

export interface HorseRideSnapshot {
  horseId: string;
  range: TimeRange;
  isActive: boolean;
}

export function detectLessonConflicts(
  input: LessonConflictInput,
  existingLessons: ExistingLessonSnapshot[],
  horseRides: HorseRideSnapshot[],
  horseDailyRideCounts: Record<string, number>,
  horseDailyLimits: Record<string, number>,
): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];
  const others = existingLessons.filter((lesson) => lesson.lessonId !== input.lessonId);

  const overlappingOnResource = others.filter(
    (lesson) =>
      lesson.isActive &&
      lesson.resourceId === input.resourceId &&
      rangesOverlap(lesson.range, input.range),
  );

  const totalParallel = overlappingOnResource.length + 1;
  if (totalParallel > input.resourceCapacity) {
    conflicts.push({
      type: 'resource_capacity',
      severity: 'warning',
      message: `Resource capacity exceeded (${totalParallel}/${input.resourceCapacity} parallel lessons).`,
      relatedEntityId: input.resourceId,
    });
  }

  const instructorOverlap = others.some(
    (lesson) =>
      lesson.isActive &&
      lesson.instructorId === input.instructorId &&
      rangesOverlap(lesson.range, input.range),
  );

  if (instructorOverlap) {
    conflicts.push({
      type: 'instructor_overlap',
      severity: 'warning',
      message: 'Instructor is already assigned to another active lesson in this time range.',
      relatedEntityId: input.instructorId,
    });
  }

  if (input.participantCount > input.maxParticipants) {
    conflicts.push({
      type: 'group_capacity',
      severity: 'warning',
      message: `Group capacity exceeded (${input.participantCount}/${input.maxParticipants} participants).`,
    });
  }

  for (const horseId of input.assignedHorseIds) {
    const horseOverlap = horseRides.some(
      (ride) =>
        ride.isActive &&
        ride.horseId === horseId &&
        ride.range.startsAt.toDateString() === input.range.startsAt.toDateString() &&
        rangesOverlap(ride.range, input.range) &&
        !isSameLessonHorse(input.lessonId, ride, existingLessons),
    );

    if (horseOverlap) {
      conflicts.push({
        type: 'horse_overlap',
        severity: 'warning',
        message: 'Horse is already assigned to another active lesson in this time range.',
        relatedEntityId: horseId,
      });
    }

    const dailyLimit = horseDailyLimits[horseId];
    const dailyCount = horseDailyRideCounts[horseId] ?? 0;

    if (dailyLimit !== undefined && dailyCount >= dailyLimit) {
      conflicts.push({
        type: 'horse_daily_limit',
        severity: 'warning',
        message: formatHorseUtilization(dailyCount, dailyLimit),
        relatedEntityId: horseId,
      });
    }
  }

  return conflicts;
}

function isSameLessonHorse(
  lessonId: string | undefined,
  ride: HorseRideSnapshot,
  existingLessons: ExistingLessonSnapshot[],
): boolean {
  if (!lessonId) {
    return false;
  }

  const sourceLesson = existingLessons.find((lesson) => lesson.lessonId === lessonId);
  return sourceLesson?.assignedHorseIds.includes(ride.horseId) ?? false;
}

export function calculateAnonymousResourceOccupancy(
  lessons: ExistingLessonSnapshot[],
  resourceId: string,
  range: TimeRange,
): number {
  return lessons.filter(
    (lesson) =>
      lesson.isActive && lesson.resourceId === resourceId && rangesOverlap(lesson.range, range),
  ).length;
}
