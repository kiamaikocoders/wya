-- Several "administrators" policies only checked that the caller was signed in.

ALTER POLICY "Sponsors can be managed by administrators" ON public.sponsors
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Event sponsors can be managed by administrators" ON public.event_sponsors
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Sponsor zones can be managed by administrators" ON public.sponsor_zones
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Sponsor content blocks can be managed by administrators" ON public.sponsor_content_blocks
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- event_categories links events to categories; organizers manage links for their own events.
DROP POLICY IF EXISTS "Authenticated users can manage event categories" ON public.event_categories;
DROP POLICY IF EXISTS "Organizers and admins can manage event categories" ON public.event_categories;
CREATE POLICY "Organizers and admins can manage event categories"
  ON public.event_categories FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_categories.event_id AND e.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_categories.event_id AND e.organizer_id = (SELECT auth.uid())
    )
  );

-- The looser duplicates let users create events for any organizer and skipped the active-account check.
DROP POLICY IF EXISTS "Events can be created by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Events can be updated by their organizers" ON public.events;
DROP POLICY IF EXISTS "Events can be deleted by their organizers" ON public.events;
ALTER POLICY "Authenticated users can create events" ON public.events
  WITH CHECK (
    public.is_admin()
    OR ((SELECT auth.uid()) = organizer_id AND public.current_profile_is_active())
  );

-- Cross-user notifications go through edge functions (service role), which verify the relationship.
ALTER POLICY "Authenticated users can create notifications" ON public.notifications
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

-- auth.role() is never 'admin', so this policy never matched.
ALTER POLICY "Admins can update payment status" ON public.payments
  USING (public.is_admin()) WITH CHECK (public.is_admin());
