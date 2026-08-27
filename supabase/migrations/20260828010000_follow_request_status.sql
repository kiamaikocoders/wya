-- Friend requests: new follows start pending; existing rows stay accepted.
ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_status_check;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_status_check CHECK (status IN ('pending', 'accepted'));

CREATE INDEX IF NOT EXISTS idx_follows_following_status
  ON public.follows (following_id, status);

COMMENT ON COLUMN public.follows.status IS 'pending = friend request; accepted = friends / follow';
