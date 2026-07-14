import type {
  BookingRequest,
  FacilityResource,
  Horse,
  Invite,
  Lesson,
  LessonParticipant,
  Membership,
  Organization,
  Profile,
} from '../entities/index.js';
import type { MembershipRole } from '../types/index.js';

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  create(organization: Organization): Promise<Organization>;
  update(organization: Organization): Promise<Organization>;
}

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByEmail(email: string): Promise<Profile | null>;
  create(profile: Profile): Promise<Profile>;
  update(profile: Profile): Promise<Profile>;
}

export interface MembershipRepository {
  findByUserAndOrganization(userId: string, organizationId: string): Promise<Membership | null>;
  listByUser(userId: string): Promise<Membership[]>;
  listByOrganization(organizationId: string): Promise<Membership[]>;
  create(membership: Membership): Promise<Membership>;
}

export interface FacilityResourceRepository {
  listByOrganization(organizationId: string): Promise<FacilityResource[]>;
  create(resource: FacilityResource): Promise<FacilityResource>;
  update(resource: FacilityResource): Promise<FacilityResource>;
}

export interface HorseRepository {
  listByOrganization(organizationId: string): Promise<Horse[]>;
  create(horse: Horse): Promise<Horse>;
  update(horse: Horse): Promise<Horse>;
}

export interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
  listByOrganization(
    organizationId: string,
    range: { startsAt: string; endsAt: string },
  ): Promise<Lesson[]>;
  create(lesson: Lesson): Promise<Lesson>;
  update(lesson: Lesson): Promise<Lesson>;
}

export interface LessonParticipantRepository {
  listByLesson(lessonId: string): Promise<LessonParticipant[]>;
  listByUser(
    userId: string,
    range: { startsAt: string; endsAt: string },
  ): Promise<LessonParticipant[]>;
  create(participant: LessonParticipant): Promise<LessonParticipant>;
  update(participant: LessonParticipant): Promise<LessonParticipant>;
}

export interface BookingRequestRepository {
  listByOrganization(organizationId: string): Promise<BookingRequest[]>;
  create(request: BookingRequest): Promise<BookingRequest>;
  update(request: BookingRequest): Promise<BookingRequest>;
}

export interface InviteRepository {
  findByToken(token: string): Promise<Invite | null>;
  create(invite: Invite): Promise<Invite>;
  update(invite: Invite): Promise<Invite>;
}

export interface AuthService {
  sendInviteEmail(invite: Invite, organizationName: string): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
}

export interface NotificationService {
  sendInAppNotification(params: {
    userId: string;
    organizationId: string;
    category: 'reminder' | 'schedule_change' | 'booking_request' | 'instructor_message';
    title: string;
    body: string;
  }): Promise<void>;
}

export interface AuditLogger {
  log(event: {
    organizationId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
  }): Promise<void>;
}

export interface CurrentUserContext {
  userId: string;
  organizationId: string;
  role: MembershipRole;
}
