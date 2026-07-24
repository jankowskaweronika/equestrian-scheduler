-- Let every organization member see facility events (public notices and
-- technical work). Managers still exclusively create/update/archive them.
-- Instructors and boarders need this visibility on the shared calendar.

drop policy if exists "facility_events_select_member" on public.facility_events;

create policy "facility_events_select_member"
on public.facility_events for select
using (
  public.is_product_admin()
  or public.is_member_of_org(organization_id)
);
