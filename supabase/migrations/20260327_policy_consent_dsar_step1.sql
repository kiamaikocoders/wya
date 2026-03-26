-- Profiles, sponsors content_category, consent_audit, data_subject_requests (see step 2 for triggers + GDPR functions)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS terms_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS organizer_content_sharing_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sponsors'
  ) THEN
    ALTER TABLE public.sponsors
      ADD COLUMN IF NOT EXISTS content_category TEXT NOT NULL DEFAULT 'general';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.consent_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN,
  policy_version TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_user_id ON public.consent_audit (user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created_at ON public.consent_audit (created_at DESC);

ALTER TABLE public.consent_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own consent_audit" ON public.consent_audit;
CREATE POLICY "Users insert own consent_audit" ON public.consent_audit
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own consent_audit" ON public.consent_audit;
CREATE POLICY "Users read own consent_audit" ON public.consent_audit
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'anonymize', 'access')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_data_subject_requests_user_id ON public.data_subject_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_requests_created_at ON public.data_subject_requests (created_at DESC);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own data_subject_requests" ON public.data_subject_requests;
CREATE POLICY "Users insert own data_subject_requests" ON public.data_subject_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own data_subject_requests" ON public.data_subject_requests;
CREATE POLICY "Users read own data_subject_requests" ON public.data_subject_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own data_subject_requests" ON public.data_subject_requests;
CREATE POLICY "Users update own data_subject_requests" ON public.data_subject_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
