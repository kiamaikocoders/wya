-- Ticket Marketplace / Transfer
-- Paid recovery transfers (KES 100 fee per ticket, seller-paid) + gift comps (no money).
-- QR rotates only after successful buy/claim. Transfer window closes 12h before event.date.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================
-- TABLES
-- ==============================================

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id BIGSERIAL PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('paid_transfer', 'gift')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'gifted', 'expired', 'cancelled', 'failed')),
  ticket_count INTEGER NOT NULL DEFAULT 0 CHECK (ticket_count > 0),
  gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gross_amount >= 0),
  fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  seller_payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (seller_payout_amount >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.marketplace_listing_items (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  ticket_id INTEGER NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  locked_price NUMERIC(12, 2) NOT NULL CHECK (locked_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, ticket_id)
);

CREATE TABLE IF NOT EXISTS public.marketplace_transfers (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('paid_transfer', 'gift')),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'completing', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  seller_payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_payouts (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT NOT NULL REFERENCES public.marketplace_transfers(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'skipped')),
  payout_method TEXT DEFAULT 'ledger_stub',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_qr_tokens (
  id BIGSERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_qr_tokens_active_ticket
  ON public.ticket_qr_tokens (ticket_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_qr_tokens_token
  ON public.ticket_qr_tokens (token);

-- One active listing per ticket (via listing status join enforced in trigger + helper index)
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings (status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_event ON public.marketplace_listings (event_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON public.marketplace_listings (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_expires ON public.marketplace_listings (expires_at)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_items_ticket ON public.marketplace_listing_items (ticket_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listing_items_listing ON public.marketplace_listing_items (listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transfers_listing ON public.marketplace_transfers (listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transfers_buyer ON public.marketplace_transfers (buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transfers_status ON public.marketplace_transfers (status);
CREATE INDEX IF NOT EXISTS idx_marketplace_payouts_status ON public.marketplace_payouts (status);
CREATE INDEX IF NOT EXISTS idx_ticket_qr_tokens_ticket ON public.ticket_qr_tokens (ticket_id);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS transfer_version INTEGER NOT NULL DEFAULT 0;

-- ==============================================
-- HELPERS
-- ==============================================

CREATE OR REPLACE FUNCTION public.marketplace_fee_per_ticket()
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 100::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_transfer_cutoff(p_event_start TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_event_start - INTERVAL '12 hours';
$$;

CREATE OR REPLACE FUNCTION public.marketplace_ticket_checked_in(p_ticket_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.event_checkins') IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.event_checkins ec WHERE ec.ticket_id = p_ticket_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_ticket_in_active_listing(p_ticket_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.marketplace_listing_items li
    JOIN public.marketplace_listings l ON l.id = li.listing_id
    WHERE li.ticket_id = p_ticket_id
      AND l.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.marketplace_assert_transfer_window(p_event_id INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_start TIMESTAMPTZ;
  v_cutoff TIMESTAMPTZ;
BEGIN
  SELECT e.date INTO v_event_start
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_event_start IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  v_cutoff := public.marketplace_transfer_cutoff(v_event_start);
  IF NOW() >= v_cutoff THEN
    RAISE EXCEPTION 'Transfers close 12 hours before the event starts';
  END IF;

  RETURN v_cutoff;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_rotate_ticket_qr(
  p_ticket_id INTEGER,
  p_new_owner_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_ref TEXT;
  v_token TEXT;
BEGIN
  v_new_ref := 'TKT-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  UPDATE public.tickets
  SET
    user_id = p_new_owner_id,
    reference_code = v_new_ref,
    transfer_version = COALESCE(transfer_version, 0) + 1,
    status = CASE
      WHEN status IN ('pending', 'cancelled') THEN status
      ELSE 'confirmed'
    END
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found during QR rotate', p_ticket_id;
  END IF;

  UPDATE public.ticket_qr_tokens
  SET status = 'revoked', revoked_at = NOW()
  WHERE ticket_id = p_ticket_id AND status = 'active';

  IF to_regclass('public.qr_code_logs') IS NOT NULL THEN
    UPDATE public.qr_code_logs
    SET status = 'revoked'
    WHERE ticket_id = p_ticket_id AND status = 'active';
  END IF;

  v_token := 'TICKET:' || p_ticket_id::TEXT || ':' || v_new_ref;

  INSERT INTO public.ticket_qr_tokens (ticket_id, owner_id, token, status)
  VALUES (p_ticket_id, p_new_owner_id, v_token, 'active');

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_ensure_ticket_qr(p_ticket_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_token TEXT;
BEGIN
  SELECT id, user_id, reference_code INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  SELECT t.token INTO v_token
  FROM public.ticket_qr_tokens t
  WHERE t.ticket_id = p_ticket_id AND t.status = 'active'
  LIMIT 1;

  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  v_token := 'TICKET:' || v_ticket.id::TEXT || ':' || v_ticket.reference_code;

  INSERT INTO public.ticket_qr_tokens (ticket_id, owner_id, token, status)
  VALUES (v_ticket.id, v_ticket.user_id, v_token, 'active')
  ON CONFLICT DO NOTHING;

  RETURN v_token;
END;
$$;

-- ==============================================
-- CORE RPCs
-- ==============================================

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

  IF p_ticket_ids IS NULL OR array_length(p_ticket_ids, 1) IS NULL OR array_length(p_ticket_ids, 1) < 1 THEN
    RAISE EXCEPTION 'Select at least one ticket';
  END IF;

  -- Deduplicate
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

CREATE OR REPLACE FUNCTION public.marketplace_cancel_listing(p_listing_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_listing RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.seller_id IS DISTINCT FROM v_uid AND NOT public.is_admin(v_uid) THEN
    RAISE EXCEPTION 'Not allowed to cancel this listing';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Listing is not active';
  END IF;

  UPDATE public.marketplace_listings
  SET status = 'cancelled', closed_at = NOW(), updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN json_build_object('listing_id', p_listing_id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_complete_transfer(p_transfer_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_listing RECORD;
  v_item RECORD;
  v_tokens JSONB := '[]'::JSONB;
  v_new_token TEXT;
  v_payout_id BIGINT;
BEGIN
  SELECT * INTO v_transfer
  FROM public.marketplace_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF v_transfer.status = 'completed' THEN
    RETURN json_build_object('transfer_id', p_transfer_id, 'status', 'completed', 'idempotent', true);
  END IF;

  IF v_transfer.status NOT IN ('pending_payment', 'completing') THEN
    RAISE EXCEPTION 'Transfer cannot be completed from status %', v_transfer.status;
  END IF;

  UPDATE public.marketplace_transfers
  SET status = 'completing', updated_at = NOW()
  WHERE id = p_transfer_id;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = v_transfer.listing_id
  FOR UPDATE;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    UPDATE public.marketplace_transfers
    SET status = 'failed', error_message = 'Listing no longer active', updated_at = NOW()
    WHERE id = p_transfer_id;
    RAISE EXCEPTION 'Listing no longer active';
  END IF;

  PERFORM public.marketplace_assert_transfer_window(v_listing.event_id);

  FOR v_item IN
    SELECT li.*, t.user_id AS current_owner, t.status AS ticket_status
    FROM public.marketplace_listing_items li
    JOIN public.tickets t ON t.id = li.ticket_id
    WHERE li.listing_id = v_listing.id
    FOR UPDATE OF t
  LOOP
    IF v_item.current_owner IS DISTINCT FROM v_transfer.seller_id THEN
      RAISE EXCEPTION 'Ticket % ownership changed during transfer', v_item.ticket_id;
    END IF;
    IF v_item.ticket_status NOT IN ('confirmed', 'active') THEN
      RAISE EXCEPTION 'Ticket % is no longer transferable', v_item.ticket_id;
    END IF;
    IF public.marketplace_ticket_checked_in(v_item.ticket_id) THEN
      RAISE EXCEPTION 'Ticket % was checked in before transfer completed', v_item.ticket_id;
    END IF;

    v_new_token := public.marketplace_rotate_ticket_qr(v_item.ticket_id, v_transfer.buyer_id);
    v_tokens := v_tokens || jsonb_build_array(
      jsonb_build_object('ticket_id', v_item.ticket_id, 'token', v_new_token)
    );
  END LOOP;

  UPDATE public.marketplace_listings
  SET
    status = CASE WHEN v_transfer.mode = 'gift' THEN 'gifted' ELSE 'sold' END,
    closed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_listing.id;

  UPDATE public.marketplace_transfers
  SET status = 'completed', completed_at = NOW(), updated_at = NOW(), error_message = NULL
  WHERE id = p_transfer_id;

  IF v_transfer.mode = 'paid_transfer' AND v_transfer.seller_payout_amount > 0 THEN
    INSERT INTO public.marketplace_payouts (
      transfer_id, seller_id, amount, status, payout_method
    ) VALUES (
      p_transfer_id, v_transfer.seller_id, v_transfer.seller_payout_amount, 'pending', 'ledger_stub'
    )
    RETURNING id INTO v_payout_id;
  ELSIF v_transfer.mode = 'paid_transfer' THEN
    INSERT INTO public.marketplace_payouts (
      transfer_id, seller_id, amount, status, payout_method
    ) VALUES (
      p_transfer_id, v_transfer.seller_id, 0, 'skipped', 'none'
    )
    RETURNING id INTO v_payout_id;
  END IF;

  RETURN json_build_object(
    'transfer_id', p_transfer_id,
    'listing_id', v_listing.id,
    'status', 'completed',
    'mode', v_transfer.mode,
    'tokens', v_tokens,
    'payout_id', v_payout_id
  );
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.marketplace_transfers
    SET status = 'failed', error_message = SQLERRM, updated_at = NOW()
    WHERE id = p_transfer_id AND status <> 'completed';
    RAISE;
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

  -- Until real M-Pesa webhook exists, treat successful initiate as paid and complete atomically.
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

CREATE OR REPLACE FUNCTION public.marketplace_confirm_payment(
  p_transfer_id BIGINT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
BEGIN
  -- Intended for payment webhooks / service role. Also allows buyer to confirm their pending transfer.
  SELECT * INTO v_transfer
  FROM public.marketplace_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF auth.uid() IS NOT NULL
     AND auth.uid() IS DISTINCT FROM v_transfer.buyer_id
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF v_transfer.status = 'completed' THEN
    RETURN json_build_object('transfer_id', p_transfer_id, 'status', 'completed', 'idempotent', true);
  END IF;

  IF p_payment_reference IS NOT NULL THEN
    UPDATE public.marketplace_transfers
    SET payment_reference = p_payment_reference, updated_at = NOW()
    WHERE id = p_transfer_id;
  END IF;

  RETURN public.marketplace_complete_transfer(p_transfer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_expire_due_listings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.marketplace_listings
    SET status = 'expired', closed_at = NOW(), updated_at = NOW()
    WHERE status = 'active'
      AND (expires_at <= NOW() OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND NOW() >= public.marketplace_transfer_cutoff(e.date)
      ))
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN json_build_object('expired_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_process_pending_payouts(p_limit INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_paid INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT *
    FROM public.marketplace_payouts
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT GREATEST(COALESCE(p_limit, 50), 1)
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Stub payout rail: mark paid in ledger. Replace with M-Pesa B2C later.
      UPDATE public.marketplace_payouts
      SET
        status = 'paid',
        payout_method = 'ledger_stub',
        attempt_count = attempt_count + 1,
        paid_at = NOW(),
        updated_at = NOW(),
        last_error = NULL
      WHERE id = v_row.id;
      v_paid := v_paid + 1;
    EXCEPTION
      WHEN OTHERS THEN
        UPDATE public.marketplace_payouts
        SET
          status = 'failed',
          attempt_count = attempt_count + 1,
          last_error = SQLERRM,
          updated_at = NOW()
        WHERE id = v_row.id;
        v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN json_build_object('paid_count', v_paid, 'failed_count', v_failed);
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_retry_payout(p_payout_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_payout RECORD;
BEGIN
  IF v_uid IS NULL OR NOT public.is_admin(v_uid) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_payout
  FROM public.marketplace_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF v_payout.status = 'paid' THEN
    RETURN json_build_object('payout_id', p_payout_id, 'status', 'paid', 'idempotent', true);
  END IF;

  UPDATE public.marketplace_payouts
  SET status = 'pending', last_error = NULL, updated_at = NOW()
  WHERE id = p_payout_id;

  UPDATE public.marketplace_payouts
  SET
    status = 'paid',
    payout_method = 'ledger_stub',
    attempt_count = attempt_count + 1,
    paid_at = NOW(),
    updated_at = NOW(),
    last_error = NULL
  WHERE id = p_payout_id;

  RETURN json_build_object('payout_id', p_payout_id, 'status', 'paid');
END;
$$;

CREATE OR REPLACE FUNCTION public.marketplace_cancel_listings_for_event(p_event_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  WITH cancelled AS (
    UPDATE public.marketplace_listings
    SET status = 'cancelled', closed_at = NOW(), updated_at = NOW()
    WHERE event_id = p_event_id AND status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM cancelled;

  RETURN json_build_object('event_id', p_event_id, 'cancelled_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_marketplace_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  RETURN json_build_object(
    'active_listings', (SELECT COUNT(*) FROM public.marketplace_listings WHERE status = 'active'),
    'sold_listings', (SELECT COUNT(*) FROM public.marketplace_listings WHERE status = 'sold'),
    'gifted_listings', (SELECT COUNT(*) FROM public.marketplace_listings WHERE status = 'gifted'),
    'completed_transfers', (SELECT COUNT(*) FROM public.marketplace_transfers WHERE status = 'completed'),
    'failed_transfers', (SELECT COUNT(*) FROM public.marketplace_transfers WHERE status = 'failed'),
    'fees_collected', (
      SELECT COALESCE(SUM(fee_amount), 0)
      FROM public.marketplace_transfers
      WHERE status = 'completed' AND mode = 'paid_transfer'
    ),
    'pending_payouts', (SELECT COUNT(*) FROM public.marketplace_payouts WHERE status = 'pending'),
    'failed_payouts', (SELECT COUNT(*) FROM public.marketplace_payouts WHERE status = 'failed'),
    'paid_payout_amount', (
      SELECT COALESCE(SUM(amount), 0) FROM public.marketplace_payouts WHERE status = 'paid'
    )
  );
END;
$$;

-- ==============================================
-- RLS
-- ==============================================

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_qr_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active listings are viewable by authenticated" ON public.marketplace_listings;
CREATE POLICY "Active listings are viewable by authenticated"
  ON public.marketplace_listings FOR SELECT TO authenticated
  USING (status = 'active' OR seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Sellers manage own listings" ON public.marketplace_listings;
CREATE POLICY "Sellers manage own listings"
  ON public.marketplace_listings FOR ALL TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Listing items viewable with listing" ON public.marketplace_listing_items;
CREATE POLICY "Listing items viewable with listing"
  ON public.marketplace_listing_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.seller_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Transfers visible to parties" ON public.marketplace_transfers;
CREATE POLICY "Transfers visible to parties"
  ON public.marketplace_transfers FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Payouts visible to seller or admin" ON public.marketplace_payouts;
CREATE POLICY "Payouts visible to seller or admin"
  ON public.marketplace_payouts FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users view own active QR tokens" ON public.ticket_qr_tokens;
CREATE POLICY "Users view own active QR tokens"
  ON public.ticket_qr_tokens FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

-- ==============================================
-- GRANTS
-- ==============================================

GRANT SELECT ON public.marketplace_listings TO authenticated;
GRANT SELECT ON public.marketplace_listing_items TO authenticated;
GRANT SELECT ON public.marketplace_transfers TO authenticated;
GRANT SELECT ON public.marketplace_payouts TO authenticated;
GRANT SELECT ON public.ticket_qr_tokens TO authenticated;

GRANT EXECUTE ON FUNCTION public.marketplace_create_listing(INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_cancel_listing(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_purchase_listing(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_claim_gift(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_confirm_payment(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_complete_transfer(BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_expire_due_listings() TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_process_pending_payouts(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_retry_payout(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_cancel_listings_for_event(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.marketplace_cancel_listings_for_event(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_marketplace_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_ensure_ticket_qr(INTEGER) TO authenticated;

COMMENT ON TABLE public.marketplace_listings IS 'Ticket marketplace listings (paid recovery transfer or gift comps)';
COMMENT ON FUNCTION public.marketplace_purchase_listing IS 'Buyer pays locked gross; seller receives gross minus KES 100 per ticket. Completes transfer + QR rotate.';
COMMENT ON FUNCTION public.marketplace_claim_gift IS 'Zero-price gift claim; no money movement; QR rotates on success.';
