import type { MembershipRole } from '../types/index.js';

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  product_admin: 100,
  manager: 80,
  instructor: 60,
  client: 40,
  boarder: 40,
};

export function canManageOrganization(role: MembershipRole): boolean {
  return role === 'product_admin' || role === 'manager';
}

export function canOperateLessons(role: MembershipRole): boolean {
  return role === 'product_admin' || role === 'manager' || role === 'instructor';
}

export function canViewAllLessons(role: MembershipRole): boolean {
  return canOperateLessons(role);
}

export function canCancelEntireLesson(role: MembershipRole): boolean {
  return canOperateLessons(role);
}

export function canCancelOwnParticipation(role: MembershipRole): boolean {
  return role === 'client' || role === 'boarder';
}

export function canApproveBookingRequests(role: MembershipRole): boolean {
  return canManageOrganization(role);
}

export function hasRoleAtLeast(role: MembershipRole, minimum: MembershipRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}
