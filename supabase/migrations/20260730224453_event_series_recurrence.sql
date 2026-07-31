-- Recurring event series: parent rule + occurrence rows on events

CREATE TABLE IF NOT EXISTS public.event_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  interval_count integer NOT NULL DEFAULT 1 CHECK (interval_count >= 1),
  -- JS getDay() convention: 0=Sunday … 6=Saturday
  byweekday smallint[] NULL,
  dtstart date NOT NULL,
  until_date date NULL,
  occurrence_count integer NULL CHECK (occurrence_count IS NULL OR occurrence_count >= 1),
  -- How many calendar days each occurrence spans (1 = single day)
  duration_days integer NOT NULL DEFAULT 1 CHECK (duration_days >= 1),
  time_of_day time NULL,
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  organizer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_series_end_rule CHECK (
    until_date IS NOT NULL OR occurrence_count IS NOT NULL
  ),
  CONSTRAINT event_series_weekly_days CHECK (
    frequency <> 'weekly' OR (byweekday IS NOT NULL AND cardinality(byweekday) > 0)
  )
);

COMMENT ON TABLE public.event_series IS 'Recurrence rule for a series of event occurrences.';
COMMENT ON COLUMN public.event_series.byweekday IS 'Weekdays for weekly rules (0=Sun … 6=Sat).';
COMMENT ON COLUMN public.event_series.duration_days IS 'Inclusive day span of each occurrence (1 = single-day).';

CREATE INDEX IF NOT EXISTS idx_event_series_organizer ON public.event_series (organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_series_dtstart ON public.event_series (dtstart);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.event_series (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_index integer;

COMMENT ON COLUMN public.events.series_id IS 'Parent series when this row is one occurrence of a recurring event.';
COMMENT ON COLUMN public.events.series_index IS '0-based index of this occurrence within its series.';

CREATE INDEX IF NOT EXISTS idx_events_series_id ON public.events (series_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_series_occurrence
  ON public.events (series_id, series_index)
  WHERE series_id IS NOT NULL AND series_index IS NOT NULL;

ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event series are viewable by everyone" ON public.event_series;
CREATE POLICY "Event series are viewable by everyone"
  ON public.event_series
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create event series" ON public.event_series;
CREATE POLICY "Authenticated users can create event series"
  ON public.event_series
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin()
      OR created_by = auth.uid()
      OR organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update event series" ON public.event_series;
CREATE POLICY "Owners and admins can update event series"
  ON public.event_series
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR organizer_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR created_by = auth.uid()
    OR organizer_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners and admins can delete event series" ON public.event_series;
CREATE POLICY "Owners and admins can delete event series"
  ON public.event_series
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR organizer_id = auth.uid()
  );
