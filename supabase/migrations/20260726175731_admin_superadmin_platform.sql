-- Superadmin platform layer: settings, announcements, audit log, finance helpers.
-- Complements ticket marketplace. Admin-gated via public.is_admin().

-- ==============================================
-- TABLES
-- ==============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'attendees', 'organizers', 'admins')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_announcements_status
  ON public.platform_announcements (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
  ON public.admin_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
  ON public.admin_audit_log (entity_type, entity_id);

-- ==============================================
-- SEED DEFAULT SETTINGS
-- ==============================================

INSERT INTO public.system_settings (key, value, description) VALUES
  ('marketplace.fee_per_ticket_kes', '100'::jsonb, 'Platform fee deducted from seller per ticket on paid transfers'),
  ('marketplace.transfer_close_hours', '12'::jsonb, 'Hours before event start when transfers/marketplace close'),
  ('marketplace.enabled', 'true'::jsonb, 'Feature flag: ticket marketplace'),
  ('platform.maintenance_mode', 'false'::jsonb, 'When true, show maintenance banner / block non-admin writes'),
  ('platform.registration_open', 'true'::jsonb, 'Allow new user signups'),
  ('platform.support_email', '"support@wya.app"'::jsonb, 'Public support contact'),
  ('tickets.refunds_enabled', 'true'::jsonb, 'Allow admin-initiated refund marking')
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- HELPERS / RPCs
-- ==============================================

CREATE OR REPLACE FUNCTION public.admin_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_system_settings()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_row RECORD;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  FOR v_row IN SELECT key, value, description, updated_at FROM public.system_settings ORDER BY key LOOP
    v_result := v_result || jsonb_build_object(
      v_row.key,
      jsonb_build_object(
        'value', v_row.value,
        'description', v_row.description,
        'updated_at', v_row.updated_at
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_system_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  INSERT INTO public.system_settings (key, value, description, updated_by, updated_at)
  VALUES (p_key, p_value, p_description, auth.uid(), NOW())
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, public.system_settings.description),
    updated_by = auth.uid(),
    updated_at = NOW();

  PERFORM public.admin_audit(
    'system_setting_upsert',
    'system_settings',
    p_key,
    jsonb_build_object('value', p_value)
  );

  RETURN jsonb_build_object('key', p_key, 'value', p_value);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_audit_log(p_limit INTEGER DEFAULT 100)
RETURNS SETOF public.admin_audit_log
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.admin_audit_log
  ORDER BY created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_finance_overview()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payments_total NUMERIC := 0;
  v_payments_completed NUMERIC := 0;
  v_payments_pending NUMERIC := 0;
  v_payments_failed NUMERIC := 0;
  v_ticket_count BIGINT := 0;
  v_ticket_confirmed BIGINT := 0;
  v_ticket_pending BIGINT := 0;
  v_ticket_cancelled BIGINT := 0;
  v_marketplace_fees NUMERIC := 0;
  v_payout_pending NUMERIC := 0;
  v_payout_paid NUMERIC := 0;
  v_payout_failed BIGINT := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    SELECT
      COALESCE(SUM(amount), 0),
      COALESCE(SUM(amount) FILTER (WHERE status IN ('completed', 'success', 'paid')), 0),
      COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'initiated')), 0),
      COALESCE(SUM(amount) FILTER (WHERE status IN ('failed', 'cancelled')), 0)
    INTO v_payments_total, v_payments_completed, v_payments_pending, v_payments_failed
    FROM public.payments;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'active')),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_ticket_count, v_ticket_confirmed, v_ticket_pending, v_ticket_cancelled
  FROM public.tickets;

  IF to_regclass('public.marketplace_transfers') IS NOT NULL THEN
    SELECT COALESCE(SUM(fee_amount), 0)
    INTO v_marketplace_fees
    FROM public.marketplace_transfers
    WHERE status = 'completed' AND mode = 'paid_transfer';
  END IF;

  IF to_regclass('public.marketplace_payouts') IS NOT NULL THEN
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
      COUNT(*) FILTER (WHERE status = 'failed')
    INTO v_payout_pending, v_payout_paid, v_payout_failed
    FROM public.marketplace_payouts;
  END IF;

  RETURN json_build_object(
    'payments', json_build_object(
      'total_amount', v_payments_total,
      'completed_amount', v_payments_completed,
      'pending_amount', v_payments_pending,
      'failed_amount', v_payments_failed
    ),
    'tickets', json_build_object(
      'total', v_ticket_count,
      'confirmed', v_ticket_confirmed,
      'pending', v_ticket_pending,
      'cancelled', v_ticket_cancelled
    ),
    'marketplace', json_build_object(
      'fees_collected', v_marketplace_fees,
      'payouts_pending_amount', v_payout_pending,
      'payouts_paid_amount', v_payout_paid,
      'payouts_failed_count', v_payout_failed
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_force_cancel_marketplace_listing(p_listing_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing RECORD;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF to_regclass('public.marketplace_listings') IS NULL THEN
    RAISE EXCEPTION 'Marketplace not installed';
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Listing is not active';
  END IF;

  UPDATE public.marketplace_listings
  SET status = 'cancelled', closed_at = NOW(), updated_at = NOW()
  WHERE id = p_listing_id;

  PERFORM public.admin_audit(
    'marketplace_force_cancel',
    'marketplace_listing',
    p_listing_id::TEXT,
    jsonb_build_object('seller_id', v_listing.seller_id, 'event_id', v_listing.event_id)
  );

  RETURN json_build_object('listing_id', p_listing_id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_ticket_cancelled(
  p_ticket_id INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- Cancel any active listing containing this ticket
  IF to_regclass('public.marketplace_listings') IS NOT NULL THEN
    UPDATE public.marketplace_listings l
    SET status = 'cancelled', closed_at = NOW(), updated_at = NOW()
    WHERE l.status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.marketplace_listing_items li
        WHERE li.listing_id = l.id AND li.ticket_id = p_ticket_id
      );
  END IF;

  UPDATE public.tickets
  SET status = 'cancelled'
  WHERE id = p_ticket_id;

  IF to_regclass('public.ticket_qr_tokens') IS NOT NULL THEN
    UPDATE public.ticket_qr_tokens
    SET status = 'revoked', revoked_at = NOW()
    WHERE ticket_id = p_ticket_id AND status = 'active';
  END IF;

  PERFORM public.admin_audit(
    'ticket_cancel',
    'ticket',
    p_ticket_id::TEXT,
    jsonb_build_object('reason', p_reason, 'previous_status', v_ticket.status, 'user_id', v_ticket.user_id)
  );

  RETURN json_build_object('ticket_id', p_ticket_id, 'status', 'cancelled');
END;
$$;

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

  UPDATE public.platform_announcements
  SET status = 'published', published_at = NOW(), updated_at = NOW()
  WHERE id = p_announcement_id;

  -- Fan-out in-app notifications (best-effort; capped for safety)
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
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        v_uid,
        'system',
        v_ann.title,
        left(
          CASE
            WHEN v_ann.link IS NOT NULL AND length(trim(v_ann.link)) > 0
              THEN v_ann.body || E'\n' || v_ann.link
            ELSE v_ann.body
          END,
          500
        )
      );
      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- skip bad rows
    END;
  END LOOP;

  PERFORM public.admin_audit(
    'announcement_publish',
    'platform_announcement',
    p_announcement_id::TEXT,
    jsonb_build_object('notified', v_count, 'audience', v_ann.audience)
  );

  RETURN json_build_object(
    'announcement_id', p_announcement_id,
    'status', 'published',
    'notified_count', v_count
  );
END;
$$;

-- ==============================================
-- RLS
-- ==============================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage system settings" ON public.system_settings;
CREATE POLICY "Admins manage system settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage announcements" ON public.platform_announcements;
CREATE POLICY "Admins manage announcements"
  ON public.platform_announcements FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Published announcements readable" ON public.platform_announcements;
CREATE POLICY "Published announcements readable"
  ON public.platform_announcements FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_announcements TO authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.platform_announcements_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.admin_audit_log_id_seq TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_audit(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_system_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_system_setting(TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_finance_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_cancel_marketplace_listing(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_ticket_cancelled(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_announcement(BIGINT) TO authenticated;

-- Broader ticket visibility for admins (ops)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tickets'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
    CREATE POLICY "Admins can view all tickets"
      ON public.tickets FOR SELECT TO authenticated
      USING (public.is_admin() OR auth.uid() = user_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
    CREATE POLICY "Admins can view all payments"
      ON public.payments FOR SELECT TO authenticated
      USING (public.is_admin() OR auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.system_settings IS 'Platform feature flags and operational knobs for superadmin';
COMMENT ON TABLE public.platform_announcements IS 'Admin broadcast announcements to users';
COMMENT ON TABLE public.admin_audit_log IS 'Immutable-ish audit trail of privileged admin actions';
