-- Email / Resend settings keys for superadmin System page (Agribeta-style).
-- Secrets stay in Edge Function env (RESEND_API_KEY); DB holds non-secret config only.

INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform.site_name', '"WYA"'::jsonb, 'Product / brand name used in emails and admin'),
  ('platform.site_url', '"https://www.wya254.com"'::jsonb, 'Canonical public site URL'),
  ('email.provider', '"resend"'::jsonb, 'Email provider id (resend)'),
  ('email.smtp_host', '"smtp.resend.com"'::jsonb, 'SMTP host (Resend)'),
  ('email.smtp_port', '465'::jsonb, 'SMTP port'),
  ('email.smtp_user', '"resend"'::jsonb, 'SMTP username'),
  ('email.from_email', '"team@wya254.com"'::jsonb, 'From address — matches Auth SMTP admin email / Resend domain'),
  ('email.from_name', '"WYA"'::jsonb, 'From display name'),
  ('email.notifications_enabled', 'true'::jsonb, 'Master switch for platform transactional emails'),
  ('email.smtp_pass_set', 'false'::jsonb, 'Legacy flag only — real key lives in RESEND_API_KEY secret')
ON CONFLICT (key) DO NOTHING;
