-- Event Check-in System with QR Codes
-- This migration adds comprehensive event check-in functionality

-- ==============================================
-- EVENT CHECK-IN TABLES
-- ==============================================

-- Event check-ins table
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES public.tickets(id),
  qr_code TEXT NOT NULL UNIQUE,
  checkin_code VARCHAR(10) NOT NULL UNIQUE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checkin_method TEXT DEFAULT 'qr_code', -- qr_code, manual, nfc
  location_data JSONB, -- GPS coordinates, venue info
  device_info JSONB, -- Device fingerprinting
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendance analytics
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  total_registered INTEGER DEFAULT 0,
  total_checked_in INTEGER DEFAULT 0,
  checkin_rate DECIMAL(5,2) DEFAULT 0.00,
  peak_attendance_time TIMESTAMP WITH TIME ZONE,
  average_checkin_duration INTERVAL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR code generation logs
CREATE TABLE IF NOT EXISTS public.qr_code_logs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id),
  user_id UUID REFERENCES auth.users(id),
  ticket_id INTEGER REFERENCES public.tickets(id),
  qr_code TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' -- active, used, expired, revoked
);

-- ==============================================
-- RLS POLICIES FOR CHECK-IN TABLES
-- ==============================================

-- Event check-ins RLS
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins" ON public.event_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view event check-ins" ON public.event_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create check-ins" ON public.event_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all check-ins" ON public.event_checkins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Event attendance RLS
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event attendance is viewable by organizers" ON public.event_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage attendance data" ON public.event_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- QR code logs RLS
ALTER TABLE public.qr_code_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QR codes" ON public.qr_code_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view event QR codes" ON public.qr_code_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

-- ==============================================
-- QR CODE GENERATION FUNCTIONS
-- ==============================================

-- Function to generate QR code for ticket
CREATE OR REPLACE FUNCTION public.generate_ticket_qr_code(
  p_ticket_id INTEGER,
  p_event_id INTEGER,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qr_data TEXT;
  qr_code TEXT;
  checkin_code VARCHAR(10);
BEGIN
  -- Verify ticket belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = p_ticket_id 
    AND user_id = p_user_id::text 
    AND event_id = p_event_id
  ) THEN
    RAISE EXCEPTION 'Ticket not found or does not belong to user';
  END IF;

  -- Generate unique check-in code
  checkin_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Create QR data payload
  qr_data := json_build_object(
    'ticket_id', p_ticket_id,
    'event_id', p_event_id,
    'user_id', p_user_id,
    'checkin_code', checkin_code,
    'timestamp', extract(epoch from now()),
    'type', 'ticket_checkin'
  )::text;

  -- Generate QR code (in production, use a proper QR library)
  qr_code := encode(digest(qr_data, 'sha256'), 'hex');

  -- Log QR code generation
  INSERT INTO public.qr_code_logs (
    event_id, user_id, ticket_id, qr_code, expires_at
  ) VALUES (
    p_event_id, p_user_id, p_ticket_id, qr_code, NOW() + INTERVAL '24 hours'
  );

  RETURN qr_code;
END;
$$;

-- Function to validate and process check-in
CREATE OR REPLACE FUNCTION public.process_checkin(
  p_qr_code TEXT,
  p_checkin_location JSONB DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_record RECORD;
  checkin_record RECORD;
  result JSON;
BEGIN
  -- Find the QR code in logs
  SELECT * INTO ticket_record
  FROM public.qr_code_logs qcl
  JOIN public.tickets t ON t.id = qcl.ticket_id
  JOIN public.events e ON e.id = t.event_id
  WHERE qcl.qr_code = p_qr_code
  AND qcl.status = 'active'
  AND qcl.expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired QR code';
  END IF;

  -- Check if already checked in
  IF EXISTS (
    SELECT 1 FROM public.event_checkins 
    WHERE ticket_id = ticket_record.ticket_id
  ) THEN
    RAISE EXCEPTION 'Ticket already checked in';
  END IF;

  -- Create check-in record
  INSERT INTO public.event_checkins (
    event_id, user_id, ticket_id, qr_code, 
    checkin_code, location_data, device_info, verified
  ) VALUES (
    ticket_record.event_id, ticket_record.user_id, ticket_record.ticket_id,
    p_qr_code, ticket_record.checkin_code, p_checkin_location, p_device_info, TRUE
  ) RETURNING * INTO checkin_record;

  -- Update QR code status
  UPDATE public.qr_code_logs 
  SET status = 'used', used_at = NOW()
  WHERE qr_code = p_qr_code;

  -- Update attendance analytics
  INSERT INTO public.event_attendance (event_id, total_checked_in)
  VALUES (ticket_record.event_id, 1)
  ON CONFLICT (event_id) 
  DO UPDATE SET 
    total_checked_in = event_attendance.total_checked_in + 1,
    last_updated = NOW();

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'checkin_id', checkin_record.id,
    'event_title', ticket_record.title,
    'checked_in_at', checkin_record.checked_in_at,
    'message', 'Successfully checked in to event'
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get event attendance analytics
CREATE OR REPLACE FUNCTION public.get_event_attendance_analytics(p_event_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics JSON;
BEGIN
  -- Check if user is event organizer or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = p_event_id 
    AND (e.organizer_id = auth.uid()::text OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    ))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only event organizers can view analytics';
  END IF;

  SELECT json_build_object(
    'event_id', p_event_id,
    'total_registered', (
      SELECT COUNT(*) FROM public.tickets 
      WHERE event_id = p_event_id AND status = 'confirmed'
    ),
    'total_checked_in', (
      SELECT COUNT(*) FROM public.event_checkins 
      WHERE event_id = p_event_id
    ),
    'checkin_rate', (
      SELECT ROUND(
        (COUNT(*)::DECIMAL / NULLIF((
          SELECT COUNT(*) FROM public.tickets 
          WHERE event_id = p_event_id AND status = 'confirmed'
        ), 0)) * 100, 2
      ) FROM public.event_checkins 
      WHERE event_id = p_event_id
    ),
    'checkin_timeline', (
      SELECT json_agg(
        json_build_object(
          'time', date_trunc('hour', checked_in_at),
          'count', count(*)
        )
      ) FROM public.event_checkins 
      WHERE event_id = p_event_id
      GROUP BY date_trunc('hour', checked_in_at)
      ORDER BY date_trunc('hour', checked_in_at)
    ),
    'peak_attendance_time', (
      SELECT date_trunc('hour', checked_in_at)
      FROM public.event_checkins 
      WHERE event_id = p_event_id
      GROUP BY date_trunc('hour', checked_in_at)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'last_updated', NOW()
  ) INTO analytics;

  RETURN analytics;
END;
$$;

-- Function to generate bulk QR codes for event
CREATE OR REPLACE FUNCTION public.generate_bulk_qr_codes(p_event_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qr_codes JSON;
BEGIN
  -- Check if user is event organizer or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = p_event_id 
    AND (e.organizer_id = auth.uid()::text OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    ))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only event organizers can generate bulk QR codes';
  END IF;

  -- Generate QR codes for all confirmed tickets
  WITH ticket_qrs AS (
    SELECT 
      t.id as ticket_id,
      t.user_id,
      public.generate_ticket_qr_code(t.id, t.event_id, t.user_id::UUID) as qr_code
    FROM public.tickets t
    WHERE t.event_id = p_event_id 
    AND t.status = 'confirmed'
  )
  SELECT json_agg(
    json_build_object(
      'ticket_id', ticket_id,
      'user_id', user_id,
      'qr_code', qr_code
    )
  ) INTO qr_codes
  FROM ticket_qrs;

  RETURN json_build_object(
    'event_id', p_event_id,
    'total_qr_codes', json_array_length(qr_codes),
    'qr_codes', qr_codes,
    'generated_at', NOW()
  );
END;
$$;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for check-ins
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_user_id ON public.event_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_qr_code ON public.event_checkins(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_checkins_checked_in_at ON public.event_checkins(checked_in_at);

-- Indexes for QR code logs
CREATE INDEX IF NOT EXISTS idx_qr_code_logs_qr_code ON public.qr_code_logs(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_code_logs_event_id ON public.qr_code_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_logs_status ON public.qr_code_logs(status);
CREATE INDEX IF NOT EXISTS idx_qr_code_logs_expires_at ON public.qr_code_logs(expires_at);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance(event_id);
