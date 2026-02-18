-- Rate limit table for password reset: max 3 attempts per email per hour
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_time
  ON public.password_reset_attempts (email, attempted_at DESC);

ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (e.g. Edge Functions) can insert/select. Blocks anon/authenticated.
COMMENT ON TABLE public.password_reset_attempts IS 'Rate limit for password reset (e.g. 3 per email per hour). Access via service role only.';
