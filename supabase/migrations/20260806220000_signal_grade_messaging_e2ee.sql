-- Applied remotely as signal_grade_messaging_e2ee
-- Signal-grade messaging: advanced features + E2EE key directory

ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS ciphertext text,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'plaintext_legacy',
  ADD COLUMN IF NOT EXISTS signal_registration_id integer;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('prekey', 'whisper', 'plaintext_legacy'));

DROP POLICY IF EXISTS "Receivers can mark messages read" ON public.messages;
CREATE POLICY "Receivers can mark messages read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE TABLE IF NOT EXISTS public.typing_status (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_partner_id)
);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pinned_by, message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.signal_identity_keys (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_id integer NOT NULL,
  identity_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_identity_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.signal_signed_prekeys (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_id integer NOT NULL,
  public_key text NOT NULL,
  signature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key_id)
);

ALTER TABLE public.signal_signed_prekeys ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.signal_one_time_prekeys (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_id integer NOT NULL,
  public_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key_id)
);

ALTER TABLE public.signal_one_time_prekeys ENABLE ROW LEVEL SECURITY;
