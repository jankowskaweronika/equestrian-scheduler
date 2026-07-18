-- Public profile fields for an organization (equestrian center).
--
-- These describe the center itself (address, website, social media, public
-- contact) and are managed by the center's own manager in the dashboard. The
-- product admin views them read-only in the admin panel to see what data each
-- center has and whether it actively uses the service.

alter table public.organizations
  add column address text,
  add column website text,
  add column facebook_url text,
  add column instagram_url text,
  add column contact_email text,
  add column contact_phone text;
