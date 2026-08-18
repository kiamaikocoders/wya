-- SECURITY DEFINER least-privilege hardening.
-- Every function below was reviewed against the native client, the WYA web client,
-- Supabase Edge Functions, trigger dependencies, and visible auth guards.

-- Client-facing functions that require an authenticated WYA user (or service_role).
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.admin_audit(text,text,text,jsonb)'::regprocedure,
    'public.admin_delete_ghost_story(bigint)'::regprocedure,
    'public.admin_finance_overview()'::regprocedure,
    'public.admin_force_cancel_marketplace_listing(bigint)'::regprocedure,
    'public.admin_get_system_settings()'::regprocedure,
    'public.admin_list_audit_log(integer)'::regprocedure,
    'public.admin_mark_ticket_cancelled(integer,text)'::regprocedure,
    'public.admin_marketplace_stats()'::regprocedure,
    'public.admin_publish_announcement(bigint)'::regprocedure,
    'public.admin_set_account_status(uuid,text,text)'::regprocedure,
    'public.admin_soft_delete_user(uuid,text)'::regprocedure,
    'public.admin_upsert_system_setting(text,jsonb,text)'::regprocedure,
    'public.anonymize_user_data(uuid)'::regprocedure,
    'public.claim_signal_one_time_prekey(uuid)'::regprocedure,
    'public.create_translation_request(text,integer,character varying,character varying,text)'::regprocedure,
    'public.delete_user_data(uuid)'::regprocedure,
    'public.export_user_data(uuid)'::regprocedure,
    'public.get_user_emails(uuid[])'::regprocedure,
    'public.like_forum_post(bigint)'::regprocedure,
    'public.like_forum_post(integer)'::regprocedure,
    'public.marketplace_cancel_listing(bigint)'::regprocedure,
    'public.marketplace_cancel_listings_for_event(integer)'::regprocedure,
    'public.marketplace_claim_gift(bigint)'::regprocedure,
    'public.marketplace_confirm_payment(bigint,text)'::regprocedure,
    'public.marketplace_create_listing(integer[])'::regprocedure,
    'public.marketplace_purchase_listing(bigint,text)'::regprocedure,
    'public.marketplace_retry_payout(bigint)'::regprocedure,
    'public.unlike_forum_post(bigint)'::regprocedure,
    'public.unlike_forum_post(integer)'::regprocedure
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END;
$$;

-- Functions intended for anonymous product discovery or RLS-policy evaluation.
-- These are documented exceptions, not broad PUBLIC grants.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.current_profile_is_active()'::regprocedure,
    'public.current_user_may_post_user_generated_content()'::regprocedure,
    'public.events_within_radius(double precision,double precision,double precision,integer,integer,text)'::regprocedure,
    'public.events_within_radius_count(double precision,double precision,double precision,text)'::regprocedure,
    'public.get_available_languages()'::regprocedure,
    'public.get_companion_home_stats()'::regprocedure,
    'public.get_ghost_users_by_persona(integer)'::regprocedure,
    'public.get_public_platform_flags()'::regprocedure,
    'public.get_system_translation(text,character varying)'::regprocedure,
    'public.get_translated_content(text,integer,character varying)'::regprocedure,
    'public.increment_forum_post_views(bigint)'::regprocedure,
    'public.is_admin(uuid)'::regprocedure
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn);
  END LOOP;
END;
$$;

-- Internal helpers, scheduled work, edge-function utilities, and trigger callbacks.
-- SECURITY DEFINER functions retain their ability to call these as their owner;
-- direct PostgREST invocation is restricted to the server/service role.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.create_like_notification(uuid,text,text,text,text,integer,uuid,text,jsonb)'::regprocedure,
    'public.get_user_language(uuid)'::regprocedure,
    'public.handle_new_user()'::regprocedure,
    'public.log_ghost_action(integer,uuid,text,integer,text,boolean,text)'::regprocedure,
    'public.log_ghost_action(integer,uuid,text,text,text,boolean,text)'::regprocedure,
    'public.lookup_auth_user_id_by_email(text)'::regprocedure,
    'public.marketplace_assert_enabled()'::regprocedure,
    'public.marketplace_assert_transfer_window(integer)'::regprocedure,
    'public.marketplace_complete_transfer(bigint)'::regprocedure,
    'public.marketplace_ensure_ticket_qr(integer)'::regprocedure,
    'public.marketplace_expire_due_listings()'::regprocedure,
    'public.marketplace_fee_per_ticket()'::regprocedure,
    'public.marketplace_process_pending_payouts(integer)'::regprocedure,
    'public.marketplace_rotate_ticket_qr(integer,uuid)'::regprocedure,
    'public.marketplace_setting_bool(text,boolean)'::regprocedure,
    'public.marketplace_setting_number(text,numeric)'::regprocedure,
    'public.marketplace_ticket_checked_in(integer)'::regprocedure,
    'public.marketplace_ticket_in_active_listing(integer)'::regprocedure,
    'public.marketplace_transfer_cutoff(timestamp with time zone)'::regprocedure,
    'public.notify_admins(text,text,text,text,text,integer,uuid,jsonb)'::regprocedure,
    'public.notify_checkin_user()'::regprocedure,
    'public.prevent_profile_account_status_user_change()'::regprocedure,
    'public.profile_matches_announcement_locations(uuid,text[])'::regprocedure,
    'public.reset_stuck_processing_actions()'::regprocedure,
    'public.rls_auto_enable()'::regprocedure,
    'public.submit_translation(integer,text)'::regprocedure,
    'public.sync_forum_post_likes_count()'::regprocedure,
    'public.touch_copilot_session()'::regprocedure,
    'public.trg_admin_notify_feedback()'::regprocedure,
    'public.trg_admin_notify_marketplace()'::regprocedure,
    'public.trg_admin_notify_moderation()'::regprocedure,
    'public.trg_admin_notify_proposal()'::regprocedure,
    'public.trg_admin_notify_signup()'::regprocedure,
    'public.trg_admin_notify_ticket()'::regprocedure,
    'public.update_ghost_action_status(integer,text,text)'::regprocedure
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END;
$$;

-- The web client sends story-like notifications directly. Bind that operation to
-- the caller's real like and to the story owner, so a signed-in user cannot
-- fan out arbitrary notifications to another account.
CREATE OR REPLACE FUNCTION public.create_like_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_resource_type text DEFAULT NULL,
  p_resource_id integer DEFAULT NULL,
  p_resource_uuid uuid DEFAULT NULL,
  p_link text DEFAULT NULL,
  p_data jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_resource_type IS DISTINCT FROM 'story' OR p_resource_id IS NULL THEN
    RAISE EXCEPTION 'Unsupported notification resource';
  END IF;

  SELECT s.user_id INTO v_owner_id
  FROM public.stories s
  WHERE s.id = p_resource_id;

  IF v_owner_id IS NULL OR v_owner_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Story owner does not match notification recipient';
  END IF;

  IF v_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot notify yourself about a like';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.story_likes sl
    WHERE sl.story_id = p_resource_id
      AND sl.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Like relationship not found';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    resource_type,
    resource_id,
    resource_uuid,
    link,
    data,
    read
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_resource_type,
    p_resource_id,
    p_resource_uuid,
    p_link,
    p_data,
    false
  );

  RETURN true;
END;
$$;

-- The ticket owner (or an administrator) may ensure their QR token exists.
-- Service-role marketplace workflows remain permitted when auth.uid() is NULL.
CREATE OR REPLACE FUNCTION public.marketplace_ensure_ticket_qr(p_ticket_id integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_ticket RECORD;
  v_token TEXT;
  v_uid UUID := auth.uid();
BEGIN
  SELECT id, user_id, reference_code INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF v_uid IS NOT NULL
     AND v_uid IS DISTINCT FROM v_ticket.user_id
     AND NOT public.is_admin(v_uid) THEN
    RAISE EXCEPTION 'Not allowed to ensure this ticket QR token';
  END IF;

  SELECT t.token INTO v_token
  FROM public.ticket_qr_tokens t
  WHERE t.ticket_id = p_ticket_id
    AND t.status = 'active'
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

REVOKE EXECUTE ON FUNCTION public.create_like_notification(uuid,text,text,text,text,integer,uuid,text,jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_like_notification(uuid,text,text,text,text,integer,uuid,text,jsonb)
  TO authenticated, service_role;
;
