-- Fix event deletion: add ON DELETE to FKs that block event deletion
-- Tables qr_code_logs, revenue_payouts, and stories referenced events without
-- ON DELETE, causing "violates foreign key constraint" when deleting events.

-- ==============================================
-- qr_code_logs: CASCADE - QR logs are tied to the event
-- ==============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'qr_code_logs'
      AND constraint_name = 'qr_code_logs_event_id_fkey'
  ) THEN
    ALTER TABLE public.qr_code_logs
      DROP CONSTRAINT qr_code_logs_event_id_fkey;
    ALTER TABLE public.qr_code_logs
      ADD CONSTRAINT qr_code_logs_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ==============================================
-- revenue_payouts: SET NULL - keep payout records for accounting
-- ==============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'revenue_payouts'
      AND constraint_name = 'revenue_payouts_event_id_fkey'
  ) THEN
    ALTER TABLE public.revenue_payouts
      DROP CONSTRAINT revenue_payouts_event_id_fkey;
    ALTER TABLE public.revenue_payouts
      ADD CONSTRAINT revenue_payouts_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==============================================
-- stories: SET NULL - stories can exist without an event
-- ==============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'stories'
      AND constraint_name = 'stories_event_id_fkey'
  ) THEN
    ALTER TABLE public.stories
      DROP CONSTRAINT stories_event_id_fkey;
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
  END IF;
END $$;
