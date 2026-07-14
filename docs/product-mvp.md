# Product MVP

**Status:** agreed specification  
**Goal:** validate scheduling and communication in one real equestrian center within ~4 weeks.

## Core principle

Everything is the **calendar**. Scheduling, booking requests, cancellations, and free slots are different views and permissions on the same calendar — not separate modules.

## Center profile

- Medium center: ~10–25 horses, 3–6 instructors
- Riding school + boarding
- Individual and group lessons
- Resources: indoor arena, outdoor arena, instructor, school horses
- Hybrid planning: weekly recurring schedule + ad-hoc changes

## Roles

| Role          | Calendar access                                                              |
| ------------- | ---------------------------------------------------------------------------- |
| Manager       | Full center calendar, users, resources, horses, settings                     |
| Instructor    | All lessons in center; create, move, cancel, assign horses; hall occupancy   |
| Client        | Own rides + anonymous free slots + booking requests                          |
| Boarder       | Own rides + anonymous hall occupancy; own horse is implicit (not registered) |
| Product admin | Create organizations during pilot                                            |

## Must-have features

1. Multi-resource calendar (day/week, resource columns on web)
2. Individual and group lessons (one event, many participants)
3. Conflict warnings with manager/instructor override
4. Weekly series with single-lesson exceptions
5. Horse utilization indicator (e.g. 3/4 = 75%)
6. Cancellations stay visible (strikethrough + who/when)
7. Free slots for clients with manager-approved requests
8. Anonymous hall occupancy for boarders
9. Payment status checkbox by instructor
10. Invites with roles (7-day expiry, email + password)
11. In-app notification center (including instructor messages)
12. Multi-tenant isolation via `organization_id` + RLS
13. Required phone number on all user profiles
14. Per-organization calendar hours

## Out of scope for MVP

- Accounting, invoices, online payments
- Attachments, veterinary records, medical data
- Groom/stable hand workflows
- Automatic horse matching
- Offline mode
- Self-service organization signup
- SaaS billing

## Success criteria for pilot

- Real weekly schedule runs in the app without a parallel spreadsheet
- Cancellations and requests happen in-app instead of messengers
- Managers trust the calendar as the source of truth
