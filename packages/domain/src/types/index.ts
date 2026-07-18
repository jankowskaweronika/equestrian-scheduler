export type OrganizationId = string & { readonly __brand: 'OrganizationId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type LessonId = string & { readonly __brand: 'LessonId' };
export type HorseId = string & { readonly __brand: 'HorseId' };
export type ResourceId = string & { readonly __brand: 'ResourceId' };

export type MembershipRole = 'product_admin' | 'manager' | 'instructor' | 'client' | 'boarder';

export type LessonStatus = 'active' | 'cancelled';
export type ParticipantStatus = 'active' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid';
export type InviteStatus = 'pending' | 'accepted' | 'expired';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly';

export const TIME_SLOT_MINUTES = 15 as const;
export const DEFAULT_TIMEZONE = 'Europe/Warsaw' as const;

export function createOrganizationId(id: string): OrganizationId {
  return id as OrganizationId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createLessonId(id: string): LessonId {
  return id as LessonId;
}

export function createHorseId(id: string): HorseId {
  return id as HorseId;
}

export function createResourceId(id: string): ResourceId {
  return id as ResourceId;
}
