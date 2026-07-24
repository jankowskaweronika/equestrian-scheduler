import type {
  BillingCycle,
  MembershipRole,
  SubscriptionStatus,
} from '../types/index.js';

export interface Organization {
  id: string;
  name: string;
  timezone: string;
  calendarOpensAt: string;
  calendarClosesAt: string;
  logoUrl: string | null;
  address: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  suspendedAt: string | null;
  archivedAt: string | null;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  archivedAt: string | null;
}

export interface FacilityResource {
  id: string;
  organizationId: string;
  name: string;
  type: 'indoor' | 'outdoor_arena' | 'other';
  parallelCapacity: number;
  archivedAt: string | null;
}

export type FacilityEventKind = 'public_event' | 'maintenance';

export interface FacilityEvent {
  id: string;
  organizationId: string;
  resourceId: string | null;
  kind: FacilityEventKind;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  blocksScheduling: boolean;
  archivedAt: string | null;
  createdBy: string | null;
}

export interface Horse {
  id: string;
  organizationId: string;
  name: string;
  dailyRideLimit: number;
  isActive: boolean;
  archivedAt: string | null;
}

export interface Lesson {
  id: string;
  organizationId: string;
  resourceId: string;
  instructorId: string;
  seriesId: string | null;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'cancelled';
  maxParticipants: number;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface LessonParticipant {
  id: string;
  lessonId: string;
  userId: string;
  status: 'active' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid';
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface ParticipantHorse {
  id: string;
  participantId: string;
  horseId: string;
}

export interface BookingRequest {
  id: string;
  organizationId: string;
  requestedBy: string;
  resourceId: string;
  instructorId: string | null;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: MembershipRole;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
}

// Platform-level SaaS subscription an organization holds with the operator.
// Tracked manually by the product admin during the pilot phase.
export interface Subscription {
  id: string;
  organizationId: string;
  plan: string;
  status: SubscriptionStatus;
  priceAmount: number;
  currency: string;
  billingCycle: BillingCycle;
  currentPeriodEnd: string | null;
  notes: string | null;
}

// A single recorded payment an organization made to the platform operator.
export interface ServicePayment {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  note: string | null;
}
