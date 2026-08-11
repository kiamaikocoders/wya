-- Chat add-ons: soft-delete, reply, attachment metadata, presence
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_kind text,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.messages
    DROP CONSTRAINT IF EXISTS messages_attachment_kind_check;
  ALTER TABLE public.messages
    ADD CONSTRAINT messages_attachment_kind_check
    CHECK (
      attachment_kind IS NULL
      OR attachment_kind IN ('text', 'image', 'video', 'voice', 'share')
    );
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS messages_pair_attachments_idx
  ON public.messages (created_at DESC)
  WHERE attachment_url IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS messages_reply_to_idx
  ON public.messages (reply_to_id)
  WHERE reply_to_id IS NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_last_seen_at_idx
  ON public.profiles (last_seen_at DESC NULLS LAST);

COMMENT ON COLUMN public.messages.deleted_at IS 'Soft-unsend timestamp; ciphertext retained for tombstone UX';
COMMENT ON COLUMN public.messages.attachment_kind IS 'Client content kind; Signal message_type stays separate';
COMMENT ON COLUMN public.profiles.last_seen_at IS 'Heartbeat for Active now / last seen in chat';
