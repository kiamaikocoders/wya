-- Allow file + location attachment kinds on messages
DO $$
BEGIN
  ALTER TABLE public.messages
    DROP CONSTRAINT IF EXISTS messages_attachment_kind_check;

  ALTER TABLE public.messages
    ADD CONSTRAINT messages_attachment_kind_check
    CHECK (
      attachment_kind IS NULL
      OR attachment_kind IN (
        'text',
        'image',
        'video',
        'voice',
        'share',
        'file',
        'location'
      )
    );
END $$;
