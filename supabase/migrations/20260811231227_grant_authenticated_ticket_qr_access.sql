-- `marketplace_ensure_ticket_qr` is called by the authenticated ticket-detail
-- client and now verifies that caller owns the ticket (or is an administrator).
-- Keep anonymous execution denied while allowing that guarded client flow.
REVOKE EXECUTE ON FUNCTION public.marketplace_ensure_ticket_qr(integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketplace_ensure_ticket_qr(integer)
  TO authenticated, service_role;
;
