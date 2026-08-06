-- Event ticket tiers (Early Bird, VIP, Regular, etc.) + Other category parent.

-- 1) Ticket types per event
CREATE TABLE IF NOT EXISTS public.event_ticket_types (
  id BIGSERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_ticket_types_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS event_ticket_types_event_id_idx
  ON public.event_ticket_types (event_id);

CREATE INDEX IF NOT EXISTS event_ticket_types_event_sort_idx
  ON public.event_ticket_types (event_id, sort_order);

COMMENT ON TABLE public.event_ticket_types IS
  'Priced ticket tiers for an event (e.g. Early Bird, VIP, Regular). events.price remains the display/from price (lowest active tier).';

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_type_id BIGINT REFERENCES public.event_ticket_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tickets_ticket_type_id_idx
  ON public.tickets (ticket_type_id);

ALTER TABLE public.event_ticket_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read event ticket types" ON public.event_ticket_types;
CREATE POLICY "Anyone can read event ticket types"
  ON public.event_ticket_types
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins and organizers can insert event ticket types" ON public.event_ticket_types;
CREATE POLICY "Admins and organizers can insert event ticket types"
  ON public.event_ticket_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
        AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and organizers can update event ticket types" ON public.event_ticket_types;
CREATE POLICY "Admins and organizers can update event ticket types"
  ON public.event_ticket_types
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_ticket_types.event_id
        AND e.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_ticket_types.event_id
        AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and organizers can delete event ticket types" ON public.event_ticket_types;
CREATE POLICY "Admins and organizers can delete event ticket types"
  ON public.event_ticket_types
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_ticket_types.event_id
        AND e.organizer_id = auth.uid()
    )
  );

GRANT SELECT ON public.event_ticket_types TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_ticket_types TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.event_ticket_types_id_seq TO authenticated;

-- 2) Seed "Other" parent category for custom event types (if missing)
INSERT INTO public.categories (name, parent_id, order_index, icon)
SELECT 'Other', NULL, 999, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE parent_id IS NULL AND lower(name) = 'other'
);
