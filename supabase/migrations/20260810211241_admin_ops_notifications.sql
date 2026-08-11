-- Reliable admin ops notifications via SECURITY DEFINER fan-out + table triggers.
-- Covers tickets, payments, signups, feedback/contact, marketplace, moderation, proposals.
-- In-app only (SQL inserts); push/email still go through dispatch-notification when used.

CREATE OR REPLACE FUNCTION public.notify_admins(
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_id integer DEFAULT NULL,
  p_resource_uuid uuid DEFAULT NULL,
  p_data jsonb DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_type IS NULL OR btrim(p_type) = '' THEN
    RAISE EXCEPTION 'notify_admins: type is required';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'notify_admins: title is required';
  END IF;
  IF p_message IS NULL OR btrim(p_message) = '' THEN
    RAISE EXCEPTION 'notify_admins: message is required';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    resource_type,
    resource_id,
    resource_uuid,
    data,
    read
  )
  SELECT
    p.id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_resource_type,
    p_resource_id,
    p_resource_uuid,
    p_data,
    false
  FROM public.profiles p
  WHERE p.username = 'admin';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_admins failed: %', SQLERRM;
    RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins(
  text, text, text, text, text, integer, uuid, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_admins(
  text, text, text, text, text, integer, uuid, jsonb
) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tickets: new purchase + payment status transitions
-- ---------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_admin_notify_ticket ON public.tickets;
CREATE TRIGGER trg_admin_notify_ticket
  AFTER INSERT OR UPDATE OF status ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_ticket();

-- ---------------------------------------------------------------------------
-- Feedback / contact (works for anon guest inserts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_admin_notify_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview text;
  v_title text;
  v_message text;
BEGIN
  v_preview := left(regexp_replace(COALESCE(NEW.message, ''), '\s+', ' ', 'g'), 120);
  IF NEW.category = 'contact' THEN
    v_title := 'New contact message';
    v_message := COALESCE(NULLIF(v_preview, ''), 'A contact form was submitted.');
  ELSE
    v_title := 'New app feedback';
    v_message := format('%s: %s', COALESCE(NEW.category, 'feedback'), COALESCE(NULLIF(v_preview, ''), '—'));
  END IF;

  PERFORM public.notify_admins(
    'app_feedback',
    v_title,
    v_message,
    '/admin/feedback',
    'app_feedback',
    NULL,
    NEW.id,
    jsonb_build_object(
      'feedback_id', NEW.id,
      'category', NEW.category,
      'user_id', NEW.user_id
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notify_feedback ON public.app_feedback;
CREATE TRIGGER trg_admin_notify_feedback
  AFTER INSERT ON public.app_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_feedback();

-- ---------------------------------------------------------------------------
-- New user signup (profile created by handle_new_user)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_admin_notify_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username = 'admin' THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_admins(
    'user_signup',
    'New user signed up',
    format(
      '%s joined WYA.',
      COALESCE(NULLIF(NEW.full_name, ''), NULLIF(NEW.username, ''), 'A new user')
    ),
    '/admin/users',
    'user',
    NULL,
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'username', NEW.username,
      'location', NEW.location
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notify_signup ON public.profiles;
CREATE TRIGGER trg_admin_notify_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_signup();

-- ---------------------------------------------------------------------------
-- Marketplace transfer completed / failed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_admin_notify_marketplace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' THEN
    PERFORM public.notify_admins(
      'marketplace_sale',
      'Marketplace sale completed',
      format('Transfer #%s completed (%s).', NEW.id, COALESCE(NEW.mode, 'transfer')),
      '/admin/marketplace',
      'marketplace_transfer',
      NEW.id,
      NULL,
      jsonb_build_object(
        'transfer_id', NEW.id,
        'listing_id', NEW.listing_id,
        'buyer_id', NEW.buyer_id,
        'seller_id', NEW.seller_id,
        'mode', NEW.mode,
        'status', NEW.status
      )
    );
  ELSIF NEW.status = 'failed' THEN
    PERFORM public.notify_admins(
      'marketplace_sale',
      'Marketplace transfer failed',
      format(
        'Transfer #%s failed%s.',
        NEW.id,
        CASE WHEN NEW.error_message IS NOT NULL THEN ': ' || left(NEW.error_message, 80) ELSE '' END
      ),
      '/admin/marketplace',
      'marketplace_transfer',
      NEW.id,
      NULL,
      jsonb_build_object(
        'transfer_id', NEW.id,
        'listing_id', NEW.listing_id,
        'status', NEW.status,
        'error_message', NEW.error_message
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notify_marketplace ON public.marketplace_transfers;
CREATE TRIGGER trg_admin_notify_marketplace
  AFTER INSERT OR UPDATE OF status ON public.marketplace_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_marketplace();

-- ---------------------------------------------------------------------------
-- Content moderation queue (stories + forum posts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_admin_notify_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_TABLE_NAME;
  v_label text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.moderation_status IS NOT DISTINCT FROM NEW.moderation_status THEN
    RETURN NEW;
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'pending' THEN
    RETURN NEW;
  END IF;

  v_label := CASE WHEN v_kind = 'stories' THEN 'story' ELSE 'forum post' END;

  PERFORM public.notify_admins(
    'moderation',
    'Content awaiting moderation',
    format('A new %s needs review.', v_label),
    '/admin/moderation',
    v_kind,
    NEW.id,
    NULL,
    jsonb_build_object(
      'source', v_kind,
      'source_id', NEW.id,
      'event_id', NEW.event_id,
      'user_id', NEW.user_id
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notify_moderation_stories ON public.stories;
CREATE TRIGGER trg_admin_notify_moderation_stories
  AFTER INSERT OR UPDATE OF moderation_status ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_moderation();

DROP TRIGGER IF EXISTS trg_admin_notify_moderation_forum ON public.forum_posts;
CREATE TRIGGER trg_admin_notify_moderation_forum
  AFTER INSERT OR UPDATE OF moderation_status ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_moderation();

-- ---------------------------------------------------------------------------
-- Event proposals submitted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_admin_notify_proposal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'proposal_submitted',
    'New event proposal',
    format('"%s" is awaiting review.', COALESCE(NULLIF(NEW.title, ''), 'Untitled proposal')),
    '/admin/proposals',
    'proposal',
    NEW.id,
    NULL,
    jsonb_build_object(
      'proposal_id', NEW.id,
      'proposal_title', NEW.title,
      'contact_email', NEW.contact_email
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notify_proposal ON public.proposals;
CREATE TRIGGER trg_admin_notify_proposal
  AFTER INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_admin_notify_proposal();
