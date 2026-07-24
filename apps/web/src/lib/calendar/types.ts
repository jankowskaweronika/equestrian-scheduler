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

export type FacilityEventKind = 'public_event' | 'maintenance';

export interface CalendarFacilityEvent {
  id: string;
  resourceId: string | null;
  kind: FacilityEventKind;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  blocksScheduling: boolean;
  isOrgWide: boolean;
}

export interface CalendarDayData {
  resources: CalendarResource[];
  lessons: CalendarLesson[];
  events: CalendarFacilityEvent[];
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
