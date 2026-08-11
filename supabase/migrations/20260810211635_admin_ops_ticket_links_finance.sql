CREATE OR REPLACE FUNCTION public.trg_admin_notify_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_title := COALESCE(NULLIF(NEW.event_title, ''), 'an event');
    PERFORM public.notify_admins(
      'ticket_purchase',
      'New ticket purchase',
      format(
        'Ticket %s for "%s" (%s) — status %s.',
        COALESCE(NEW.reference_code, '#' || NEW.id::text),
        v_title,
        COALESCE(NEW.ticket_type, 'standard'),
        COALESCE(NEW.status, 'unknown')
      ),
      '/admin/finance',
      'ticket',
      NEW.id,
      NULL,
      jsonb_build_object(
        'ticket_id', NEW.id,
        'event_id', NEW.event_id,
        'user_id', NEW.user_id,
        'status', NEW.status,
        'price', NEW.price
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_title := COALESCE(NULLIF(NEW.event_title, ''), 'an event');

    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
      PERFORM public.notify_admins(
        'payment',
        'Ticket payment confirmed',
        format('Payment confirmed for "%s" (%s).', v_title, COALESCE(NEW.reference_code, '#' || NEW.id::text)),
        '/admin/finance',
        'ticket',
        NEW.id,
        NULL,
        jsonb_build_object(
          'ticket_id', NEW.id,
          'event_id', NEW.event_id,
          'user_id', NEW.user_id,
          'from_status', OLD.status,
          'to_status', NEW.status
        )
      );
    ELSIF NEW.status = 'cancelled' THEN
      PERFORM public.notify_admins(
        'payment',
        'Ticket cancelled',
        format(
          'Ticket for "%s" was cancelled (%s).',
          v_title,
          COALESCE(NEW.reference_code, '#' || NEW.id::text)
        ),
        '/admin/finance',
        'ticket',
        NEW.id,
        NULL,
        jsonb_build_object(
          'ticket_id', NEW.id,
          'event_id', NEW.event_id,
          'user_id', NEW.user_id,
          'from_status', OLD.status,
          'to_status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;
