-- Shareable read-only links for the admin Event Media gallery (organizers / partners).
-- Rows are read/written only via Edge Functions (service role). No client RLS policies.

CREATE TABLE IF NOT EXISTS public.event_media_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id integer NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT event_media_share_links_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_event_media_share_links_event_id ON public.event_media_share_links(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_share_links_token_hash ON public.event_media_share_links(token_hash);

ALTER TABLE public.event_media_share_links ENABLE ROW LEVEL SECURITY;
