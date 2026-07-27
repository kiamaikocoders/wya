-- After successful check-in, create an in-app notification.
-- Email fan-out happens when clients use notificationService / dispatch-notification;
-- SQL inserts alone do not call Resend. Organizer apps should call createNotification
-- after process_checkin for email delivery.

CREATE OR REPLACE FUNCTION public.notify_checkin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  SELECT title INTO v_title FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications (user_id, type, title, message, link, read, data, resource_id, resource_type)
  VALUES (
    NEW.user_id,
    'checkin',
    'Checked in',
    coalesce('You checked in at "' || v_title || '".', 'You are checked in.'),
    '/events/' || NEW.event_id,
    false,
    jsonb_build_object('eventTitle', v_title, 'event_id', NEW.event_id),
    NEW.event_id,
    'event'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_checkin_user ON public.event_checkins;
CREATE TRIGGER trg_notify_checkin_user
  AFTER INSERT ON public.event_checkins
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_checkin_user();
