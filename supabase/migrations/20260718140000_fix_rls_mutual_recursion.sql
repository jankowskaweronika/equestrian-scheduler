-- Fix: eliminate mutual/recursive RLS subqueries.
--
-- Problem: several policies referenced other tables inside their USING/CHECK
-- expressions, and those tables in turn referenced back the first table. The
-- clearest case is the lessons <-> lesson_participants pair:
--   * lessons_select_member subqueries public.lesson_participants
--   * lesson_participants_select_related subqueries public.lessons
-- Because a subquery on a table runs that table's RLS policies, PostgreSQL ends
-- up evaluating the two policies in an endless loop and raises
-- "infinite recursion detected in policy for relation". The participant_horses
-- policies inherit the same loop through lesson_participants/lessons, and the
-- profiles policy carries a (non-recursive but avoidable) cross-table subquery
-- on memberships.
--
-- Fix: move every cross-table lookup into SECURITY DEFINER helper functions.
-- A SECURITY DEFINER function runs with the owner's privileges and therefore
-- bypasses RLS on the tables it reads, breaking the policy-evaluation cycle.
-- This mirrors the existing helpers (is_member_of_org, can_operate_lessons, ...).

-- ---------------------------------------------------------------------------
-- 1. Helper functions
-- ---------------------------------------------------------------------------

-- Does the current user share an organization with target_profile_id where the
-- current user can operate lessons (manager/instructor/product admin)?
create or replace function public.shares_operable_org_with(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on mine.organization_id = theirs.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_profile_id
      and mine.archived_at is null
      and theirs.archived_at is null
      and public.can_operate_lessons(mine.organization_id)
  );
$$;

-- Is the current user an active participant of the given lesson?
create or replace function public.is_lesson_participant(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesson_participants lp
    where lp.lesson_id = target_lesson_id
      and lp.user_id = auth.uid()
  );
$$;

-- Can the current user operate (write) the given lesson?
create or replace function public.can_operate_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    where l.id = target_lesson_id
      and public.can_operate_lessons(l.organization_id)
  );
$$;

-- Can the current user view the participants of the given lesson?
-- (lesson operators, or org members who are themselves participants)
create or replace function public.can_view_lesson_participants(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    where l.id = target_lesson_id
      and (
        public.can_operate_lessons(l.organization_id)
        or (
          public.is_member_of_org(l.organization_id)
          and public.is_lesson_participant(l.id)
        )
      )
  );
$$;

-- Can the current user view the horse assigned to a participant row?
-- (lesson operators, or the participant themselves)
create or replace function public.can_view_participant_horse(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesson_participants lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = target_participant_id
      and (
        public.can_operate_lessons(l.organization_id)
        or lp.user_id = auth.uid()
      )
  );
$$;

-- Can the current user manage (write) the horse assigned to a participant row?
create or replace function public.can_manage_participant_horse(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesson_participants lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = target_participant_id
      and public.can_operate_lessons(l.organization_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Profiles: replace inline memberships subquery
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_self_or_shared_org" on public.profiles;

create policy "profiles_select_self_or_shared_org"
on public.profiles for select
using (
  public.is_product_admin()
  or id = auth.uid()
  or public.shares_operable_org_with(id)
);

-- ---------------------------------------------------------------------------
-- 3. Lessons: replace inline lesson_participants subquery
-- ---------------------------------------------------------------------------

drop policy if exists "lessons_select_member" on public.lessons;

create policy "lessons_select_member"
on public.lessons for select
using (
  public.is_product_admin()
  or public.can_operate_lessons(organization_id)
  or (
    public.is_member_of_org(organization_id)
    and public.is_lesson_participant(id)
  )
);

-- ---------------------------------------------------------------------------
-- 4. Lesson participants: replace inline lessons subqueries
-- ---------------------------------------------------------------------------

drop policy if exists "lesson_participants_select_related" on public.lesson_participants;

create policy "lesson_participants_select_related"
on public.lesson_participants for select
using (
  user_id = auth.uid()
  or public.can_view_lesson_participants(lesson_id)
);

drop policy if exists "lesson_participants_manage_operator" on public.lesson_participants;

create policy "lesson_participants_manage_operator"
on public.lesson_participants for all
using (public.can_operate_lesson(lesson_id))
with check (public.can_operate_lesson(lesson_id));

-- ---------------------------------------------------------------------------
-- 5. Participant horses: replace inline lesson_participants/lessons subqueries
-- ---------------------------------------------------------------------------

drop policy if exists "participant_horses_select_operator" on public.participant_horses;

create policy "participant_horses_select_operator"
on public.participant_horses for select
using (public.can_view_participant_horse(participant_id));

drop policy if exists "participant_horses_manage_operator" on public.participant_horses;

create policy "participant_horses_manage_operator"
on public.participant_horses for all
using (public.can_manage_participant_horse(participant_id))
with check (public.can_manage_participant_horse(participant_id));
