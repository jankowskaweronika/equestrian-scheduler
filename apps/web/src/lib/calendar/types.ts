// View-model types for the manager resource calendar. Kept free of any
// server-only imports so they can be shared with client components.

export type ResourceType = 'indoor' | 'outdoor_arena' | 'other';

export type LessonStatus = 'active' | 'cancelled';

export interface CalendarResource {
  id: string;
  name: string;
  type: ResourceType;
  parallelCapacity: number;
}

export interface CalendarLessonHorse {
  id: string;
  name: string;
}

export interface CalendarLesson {
  id: string;
  resourceId: string;
  instructorName: string;
  status: LessonStatus;
  startsAt: string;
  endsAt: string;
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
  maxParticipants: number;
  participantCount: number;
  horses: CalendarLessonHorse[];
  cancellationReason: string | null;
}

export interface HorseUsage {
  id: string;
  name: string;
  ridesToday: number;
  dailyLimit: number;
  percentage: number;
}

export interface CalendarDayData {
  resources: CalendarResource[];
  lessons: CalendarLesson[];
  horseUsage: HorseUsage[];
}

export interface PersonOption {
  id: string;
  name: string;
}

export interface HorseOption {
  id: string;
  name: string;
}

export interface LessonFormOptions {
  resources: CalendarResource[];
  instructors: PersonOption[];
  clients: PersonOption[];
  horses: HorseOption[];
}
