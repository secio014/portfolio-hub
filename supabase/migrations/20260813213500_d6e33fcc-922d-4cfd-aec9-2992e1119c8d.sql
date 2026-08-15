-- Restore EXECUTE on is_admin() for the `authenticated` role.
-- It was revoked in 20260813212815, which breaks every "admin write" RLS
-- policy for the browser-side admin panel: those policies call
-- public.is_admin(auth.uid()) while running as `authenticated`, and Postgres
-- requires EXECUTE on the function to even invoke it inside a policy check.
-- Public writes (contact form, analytics) are unaffected — they go through
-- server functions using the service_role client, not the browser session.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
