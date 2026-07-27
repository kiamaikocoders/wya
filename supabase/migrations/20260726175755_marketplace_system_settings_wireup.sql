-- Wire marketplace + public flags to system_settings (single superadmin model).
-- Depends on: ticket_marketplace + admin_superadmin_platform

CREATE OR REPLACE FUNCTION public.marketplace_setting_number(p_key TEXT, p_default NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw JSONB;
  v_num NUMERIC;
BEGIN
  IF to_regclass('public.system_settings') IS NULL THEN
    RETURN p_default;
  END IF;

  SELECT value INTO v_raw FROM public.system_settings WHERE key = p_key;
  IF v_raw IS NULL THEN
    RETURN p_default;
  END IF;

  BEGIN
    v_num := (v_raw #>> '{}')::NUMERIC;
    IF v_num IS NULL THEN
      RETURN p_default;
    END IF;
    RETURN v_num;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN p_default;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_setting_bool(p_key TEXT, p_default BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw JSONB;
BEGIN
  IF to_regclass('public.system_settings') IS NULL THEN
    RETURN p_default;
  END IF;

  SELECT value INTO v_raw FROM public.system_settings WHERE key = p_key;
  IF v_raw IS NULL THEN
    RETURN p_default;
  END IF;

  BEGIN
    RETURN COALESCE((v_raw #>> '{}')::BOOLEAN, p_default);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN p_default;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_fee_per_ticket()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.marketplace_setting_number('marketplace.fee_per_ticket_kes', 100);
$$;

CREATE OR REPLACE FUNCTION public.marketplace_transfer_cutoff(p_event_start TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours NUMERIC;
BEGIN
  v_hours := public.marketplace_setting_number('marketplace.transfer_close_hours', 12);
  IF v_hours IS NULL OR v_hours < 1 THEN
    v_hours := 12;
  END IF;
  RETURN p_event_start - make_interval(hours => v_hours::INT);
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_assert_enabled()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.marketplace_setting_bool('marketplace.enabled', true) THEN
    RAISE EXCEPTION 'Marketplace is temporarily disabled';
  END IF;
END;
$$;

-- Patch create listing to assert enabled
CREATE OR REPLACE FUNCTION public.marketplace_create_listing(p_ticket_ids INTEGER[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_ticket RECORD;
  v_event_id INTEGER;
  v_mode TEXT;
  v_cutoff TIMESTAMPTZ;
  v_gross NUMERIC(12, 2) := 0;
  v_fee NUMERIC(12, 2) := 0;
  v_payout NUMERIC(12, 2) := 0;
  v_fee_unit NUMERIC := public.marketplace_fee_per_ticket();
  v_listing_id BIGINT;
  v_id INTEGER;
  v_count INTEGER;
  v_zero_count INTEGER := 0;
  v_paid_count INTEGER := 0;
  v_ticket_fee NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.marketplace_assert_enabled();

  IF p_ticket_ids IS NULL OR array_length(p_ticket_ids, 1) IS NULL OR array_length(p_ticket_ids, 1) < 1 THEN
    RAISE EXCEPTION 'Select at least one ticket';
  END IF;

  p_ticket_ids := ARRAY(SELECT DISTINCT unnest(p_ticket_ids));

  FOREACH v_id IN ARRAY p_ticket_ids LOOP
    SELECT t.* INTO v_ticket
    FROM public.tickets t
    WHERE t.id = v_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ticket % not found', v_id;
    END IF;

    IF v_ticket.user_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'You do not own ticket %', v_id;
    END IF;

    IF v_ticket.status NOT IN ('confirmed', 'active') THEN
      RAISE EXCEPTION 'Ticket % is not transferable (status %)', v_id, v_ticket.status;
    END IF;

    IF public.marketplace_ticket_checked_in(v_id) THEN
      RAISE EXCEPTION 'Ticket % is already checked in', v_id;
    END IF;

    IF public.marketplace_ticket_in_active_listing(v_id) THEN
      RAISE EXCEPTION 'Ticket % is already listed', v_id;
    END IF;

    IF v_event_id IS NULL THEN
      v_event_id := v_ticket.event_id;
    ELSIF v_event_id IS DISTINCT FROM v_ticket.event_id THEN
      RAISE EXCEPTION 'All tickets in a listing must belong to the same event';
    END IF;

    IF COALESCE(v_ticket.price, 0) = 0 THEN
      v_zero_count := v_zero_count + 1;
    ELSE
      v_paid_count := v_paid_count + 1;
    END IF;
  END LOOP;

  IF v_zero_count > 0 AND v_paid_count > 0 THEN
    RAISE EXCEPTION 'Cannot mix paid and free (gift) tickets in one listing';
  END IF;

  IF v_paid_count > 0 THEN
    v_mode := 'paid_transfer';
  ELSE
    v_mode := 'gift';
  END IF;

  v_cutoff := public.marketplace_assert_transfer_window(v_event_id);

  FOREACH v_id IN ARRAY p_ticket_ids LOOP
    SELECT t.price INTO v_ticket FROM public.tickets t WHERE t.id = v_id;
    v_gross := v_gross + COALESCE(v_ticket.price, 0);
    IF v_mode = 'paid_transfer' THEN
      v_ticket_fee := LEAST(v_fee_unit, COALESCE(v_ticket.price, 0));
      v_fee := v_fee + v_ticket_fee;
      v_payout := v_payout + (COALESCE(v_ticket.price, 0) - v_ticket_fee);
    END IF;
  END LOOP;

  v_count := array_length(p_ticket_ids, 1);

  INSERT INTO public.marketplace_listings (
    seller_id, event_id, mode, status, ticket_count,
    gross_amount, fee_amount, seller_payout_amount, expires_at
  ) VALUES (
    v_uid, v_event_id, v_mode, 'active', v_count,
    v_gross, v_fee, v_payout, v_cutoff
  )
  RETURNING id INTO v_listing_id;

  FOREACH v_id IN ARRAY p_ticket_ids LOOP
    INSERT INTO public.marketplace_listing_items (listing_id, ticket_id, locked_price)
    SELECT v_listing_id, t.id, COALESCE(t.price, 0)
    FROM public.tickets t
    WHERE t.id = v_id;

    PERFORM public.marketplace_ensure_ticket_qr(v_id);
  END LOOP;

  RETURN json_build_object(
    'listing_id', v_listing_id,
    'mode', v_mode,
    'ticket_count', v_count,
    'gross_amount', v_gross,
    'fee_amount', v_fee,
    'seller_payout_amount', v_payout,
    'expires_at', v_cutoff
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_purchase_listing(
  p_listing_id BIGINT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_listing RECORD;
  v_transfer_id BIGINT;
  v_result JSON;
  v_ref TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.marketplace_assert_enabled();

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Listing is not available';
  END IF;

  IF v_listing.mode IS DISTINCT FROM 'paid_transfer' THEN
    RAISE EXCEPTION 'This listing is a gift — use claim instead of purchase';
  END IF;

  IF v_listing.seller_id = v_uid THEN
    RAISE EXCEPTION 'Cannot purchase your own listing';
  END IF;

  PERFORM public.marketplace_assert_transfer_window(v_listing.event_id);

  v_ref := COALESCE(
    NULLIF(trim(p_payment_reference), ''),
    'MP-MKT-' || p_listing_id::TEXT || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))
  );

  INSERT INTO public.marketplace_transfers (
    listing_id, buyer_id, seller_id, mode, status,
    payment_reference, gross_amount, fee_amount, seller_payout_amount
  ) VALUES (
    v_listing.id, v_uid, v_listing.seller_id, 'paid_transfer', 'pending_payment',
    v_ref, v_listing.gross_amount, v_listing.fee_amount, v_listing.seller_payout_amount
  )
  RETURNING id INTO v_transfer_id;

  v_result := public.marketplace_complete_transfer(v_transfer_id);
  RETURN v_result || json_build_object('payment_reference', v_ref, 'buyer_paid', v_listing.gross_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_claim_gift(p_listing_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_listing RECORD;
  v_transfer_id BIGINT;
  v_result JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.marketplace_assert_enabled();

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Listing is not available';
  END IF;

  IF v_listing.mode IS DISTINCT FROM 'gift' THEN
    RAISE EXCEPTION 'This listing is paid — use purchase instead of claim';
  END IF;

  IF v_listing.seller_id = v_uid THEN
    RAISE EXCEPTION 'Cannot claim your own listing';
  END IF;

  PERFORM public.marketplace_assert_transfer_window(v_listing.event_id);

  INSERT INTO public.marketplace_transfers (
    listing_id, buyer_id, seller_id, mode, status,
    gross_amount, fee_amount, seller_payout_amount
  ) VALUES (
    v_listing.id, v_uid, v_listing.seller_id, 'gift', 'pending_payment',
    0, 0, 0
  )
  RETURNING id INTO v_transfer_id;

  v_result := public.marketplace_complete_transfer(v_transfer_id);
  RETURN v_result;
END;
$$;

-- Public (authenticated) read of non-sensitive platform flags
CREATE OR REPLACE FUNCTION public.get_public_platform_flags()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'marketplace_enabled', public.marketplace_setting_bool('marketplace.enabled', true),
    'maintenance_mode', public.marketplace_setting_bool('platform.maintenance_mode', false),
    'registration_open', public.marketplace_setting_bool('platform.registration_open', true),
    'marketplace_fee_per_ticket_kes', public.marketplace_setting_number('marketplace.fee_per_ticket_kes', 100),
    'marketplace_transfer_close_hours', public.marketplace_setting_number('marketplace.transfer_close_hours', 12)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_flags() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_setting_number(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_setting_bool(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_assert_enabled() TO authenticated;
