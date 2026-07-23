-- Communications hub: channel on announcements, templates table, publish respects channel

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'both'
    CHECK (channel IN ('email', 'in_app', 'both'));

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS recipient_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.communication_templates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'transactional'
    CHECK (category IN ('auth', 'transactional', 'marketing')),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communication_templates_admin_all ON public.communication_templates;
CREATE POLICY communication_templates_admin_all ON public.communication_templates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_templates TO authenticated;
GRANT ALL ON public.communication_templates TO service_role;

-- Seed catalog (HTML can be edited in admin; defaults are placeholders)
INSERT INTO public.communication_templates (id, category, name, subject, html, description) VALUES
  ('confirm-signup', 'auth', 'Confirm signup', 'Confirm your email — WYA',
   '<p>Welcome to WYA. Confirm your email to continue.</p><p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>',
   'Supabase Auth — paste full HTML from emails/confirm-signup.html'),
  ('reset-password', 'auth', 'Reset password', 'Reset your password — WYA',
   '<p>Reset your password:</p><p><a href="{{ .ConfirmationURL }}">Reset password</a></p>',
   'Supabase Auth template'),
  ('magic-link', 'auth', 'Magic link', 'Your WYA sign-in link',
   '<p>Sign in:</p><p><a href="{{ .ConfirmationURL }}">Open magic link</a></p>',
   'Supabase Auth template'),
  ('change-email', 'auth', 'Change email', 'Confirm your new email — WYA',
   '<p>Confirm email change:</p><p><a href="{{ .ConfirmationURL }}">Confirm</a></p>',
   'Supabase Auth template'),
  ('invite-user', 'auth', 'Invite user', 'You''re invited to WYA',
   '<p>You''ve been invited:</p><p><a href="{{ .ConfirmationURL }}">Accept invite</a></p>',
   'Supabase Auth template'),
  ('reauthentication', 'auth', 'Reauthentication', 'Confirm it''s you — WYA',
   '<p>Confirm this sensitive action:</p><p><a href="{{ .ConfirmationURL }}">Confirm</a></p>',
   'Supabase Auth template'),
  ('ticket-confirmation', 'transactional', 'Ticket confirmation', 'Your tickets for {{eventTitle}}',
   '<p>Hi {{userName}},</p><p>Your ticket for <strong>{{eventTitle}}</strong> is confirmed.</p>',
   'Resend API via dispatch'),
  ('event-reminder', 'transactional', 'Event reminder', 'Reminder: {{eventTitle}}',
   '<p>Hi {{userName}},</p><p>{{eventTitle}} {{whenLabel}}.</p>',
   'Cron send-event-reminders'),
  ('event-updated', 'transactional', 'Event updated', 'Update: {{eventTitle}}',
   '<p>Details for {{eventTitle}} have changed.</p>', 'Ticket holders'),
  ('event-cancelled', 'transactional', 'Event cancelled', 'Cancelled: {{eventTitle}}',
   '<p>{{eventTitle}} has been cancelled.</p>', 'Ticket holders'),
  ('announcement', 'transactional', 'Platform announcement', '{{title}}',
   '<p>{{message}}</p>', 'Broadcast email body'),
  ('newsletter', 'marketing', 'Newsletter', 'This week on WYA',
   '<p>{{message}}</p>', 'Requires marketing_consent')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_publish_announcement(p_announcement_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ann RECORD;
  v_count INTEGER := 0;
  v_uid UUID;
  v_channel TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_ann
  FROM public.platform_announcements
  WHERE id = p_announcement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;

  v_channel := COALESCE(v_ann.channel, 'both');

  UPDATE public.platform_announcements
  SET status = 'published', published_at = NOW(), updated_at = NOW()
  WHERE id = p_announcement_id;

  -- In-app fan-out when channel includes in_app
  IF v_channel IN ('in_app', 'both') THEN
    FOR v_uid IN
      SELECT p.id
      FROM public.profiles p
      WHERE COALESCE(p.is_ghost, false) = false
        AND (
          v_ann.audience = 'all'
          OR (v_ann.audience = 'admins' AND p.username = 'admin')
          OR (v_ann.audience = 'organizers' AND EXISTS (
            SELECT 1 FROM public.events e WHERE e.organizer_id = p.id
          ))
          OR (v_ann.audience = 'attendees' AND p.username IS DISTINCT FROM 'admin')
        )
      LIMIT 2000
    LOOP
      BEGIN
        INSERT INTO public.notifications (user_id, type, title, message, link, read)
        VALUES (
          v_uid,
          'announcement',
          v_ann.title,
          left(v_ann.body, 500),
          NULLIF(trim(COALESCE(v_ann.link, '')), ''),
          false
        );
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END LOOP;
  END IF;

  UPDATE public.platform_announcements
  SET recipient_count = GREATEST(recipient_count, v_count)
  WHERE id = p_announcement_id;

  PERFORM public.admin_audit(
    'announcement_publish',
    'platform_announcement',
    p_announcement_id::TEXT,
    jsonb_build_object(
      'notified', v_count,
      'audience', v_ann.audience,
      'channel', v_channel
    )
  );

  RETURN json_build_object(
    'announcement_id', p_announcement_id,
    'status', 'published',
    'notified_count', v_count,
    'channel', v_channel
  );
END;
$$;
