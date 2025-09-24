-- Revenue Sharing System
-- This migration adds comprehensive revenue sharing and monetization features

-- ==============================================
-- REVENUE SHARING TABLES
-- ==============================================

-- Revenue sharing configuration
CREATE TABLE IF NOT EXISTS public.revenue_sharing_config (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  platform_commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform takes 10%
  organizer_commission_rate DECIMAL(5,2) DEFAULT 85.00, -- Organizer gets 85%
  sponsor_commission_rate DECIMAL(5,2) DEFAULT 5.00, -- Sponsors get 5%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue transactions
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES public.payments(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- ticket_sale, sponsorship, commission
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  platform_commission DECIMAL(10,2) DEFAULT 0,
  organizer_commission DECIMAL(10,2) DEFAULT 0,
  sponsor_commission DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processed, failed
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue payouts
CREATE TABLE IF NOT EXISTS public.revenue_payouts (
  id SERIAL PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_type TEXT NOT NULL, -- organizer, sponsor, platform
  event_id INTEGER REFERENCES public.events(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  payout_method TEXT NOT NULL, -- bank_transfer, mpesa, paypal
  payout_details JSONB, -- Account details, phone numbers, etc.
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  transaction_reference TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue analytics
CREATE TABLE IF NOT EXISTS public.revenue_analytics (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  platform_revenue DECIMAL(10,2) DEFAULT 0,
  organizer_revenue DECIMAL(10,2) DEFAULT 0,
  sponsor_revenue DECIMAL(10,2) DEFAULT 0,
  total_tickets_sold INTEGER DEFAULT 0,
  average_ticket_price DECIMAL(10,2) DEFAULT 0,
  revenue_per_attendee DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- RLS POLICIES FOR REVENUE TABLES
-- ==============================================

-- Revenue sharing config RLS
ALTER TABLE public.revenue_sharing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can manage revenue config" ON public.revenue_sharing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all revenue config" ON public.revenue_sharing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Revenue transactions RLS
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can view their revenue transactions" ON public.revenue_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all revenue transactions" ON public.revenue_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Revenue payouts RLS
ALTER TABLE public.revenue_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts" ON public.revenue_payouts
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Event organizers can view event payouts" ON public.revenue_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all payouts" ON public.revenue_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Revenue analytics RLS
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event organizers can view their analytics" ON public.revenue_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all analytics" ON public.revenue_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- ==============================================
-- REVENUE SHARING FUNCTIONS
-- ==============================================

-- Function to calculate revenue split
CREATE OR REPLACE FUNCTION public.calculate_revenue_split(
  p_event_id INTEGER,
  p_amount DECIMAL(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
  result JSON;
BEGIN
  -- Get revenue sharing configuration
  SELECT * INTO config_record
  FROM public.revenue_sharing_config
  WHERE event_id = p_event_id;

  -- Use default rates if no config found
  IF NOT FOUND THEN
    config_record.platform_commission_rate := 10.00;
    config_record.organizer_commission_rate := 85.00;
    config_record.sponsor_commission_rate := 5.00;
  END IF;

  -- Calculate splits
  SELECT json_build_object(
    'total_amount', p_amount,
    'platform_commission', ROUND((p_amount * config_record.platform_commission_rate / 100), 2),
    'organizer_commission', ROUND((p_amount * config_record.organizer_commission_rate / 100), 2),
    'sponsor_commission', ROUND((p_amount * config_record.sponsor_commission_rate / 100), 2),
    'platform_rate', config_record.platform_commission_rate,
    'organizer_rate', config_record.organizer_commission_rate,
    'sponsor_rate', config_record.sponsor_commission_rate
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to process revenue split
CREATE OR REPLACE FUNCTION public.process_revenue_split(
  p_event_id INTEGER,
  p_payment_id INTEGER,
  p_transaction_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record RECORD;
  revenue_split JSON;
  transaction_id INTEGER;
  result JSON;
BEGIN
  -- Get payment details
  SELECT * INTO payment_record
  FROM public.payments
  WHERE id = p_payment_id AND event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Calculate revenue split
  SELECT public.calculate_revenue_split(p_event_id, payment_record.amount) INTO revenue_split;

  -- Create revenue transaction
  INSERT INTO public.revenue_transactions (
    event_id, payment_id, transaction_type, amount, currency,
    platform_commission, organizer_commission, sponsor_commission,
    status
  ) VALUES (
    p_event_id, p_payment_id, p_transaction_type, payment_record.amount, payment_record.currency,
    (revenue_split->>'platform_commission')::DECIMAL,
    (revenue_split->>'organizer_commission')::DECIMAL,
    (revenue_split->>'sponsor_commission')::DECIMAL,
    'processed'
  ) RETURNING id INTO transaction_id;

  -- Update revenue analytics
  INSERT INTO public.revenue_analytics (event_id, total_revenue, platform_revenue, organizer_revenue, sponsor_revenue)
  VALUES (
    p_event_id,
    payment_record.amount,
    (revenue_split->>'platform_commission')::DECIMAL,
    (revenue_split->>'organizer_commission')::DECIMAL,
    (revenue_split->>'sponsor_commission')::DECIMAL
  )
  ON CONFLICT (event_id) 
  DO UPDATE SET 
    total_revenue = revenue_analytics.total_revenue + payment_record.amount,
    platform_revenue = revenue_analytics.platform_revenue + (revenue_split->>'platform_commission')::DECIMAL,
    organizer_revenue = revenue_analytics.organizer_revenue + (revenue_split->>'organizer_commission')::DECIMAL,
    sponsor_revenue = revenue_analytics.sponsor_revenue + (revenue_split->>'sponsor_commission')::DECIMAL,
    last_updated = NOW();

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'transaction_id', transaction_id,
    'revenue_split', revenue_split,
    'processed_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get revenue analytics for event
CREATE OR REPLACE FUNCTION public.get_event_revenue_analytics(p_event_id INTEGER)
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
    RAISE EXCEPTION 'Unauthorized: Only event organizers can view revenue analytics';
  END IF;

  SELECT json_build_object(
    'event_id', p_event_id,
    'total_revenue', COALESCE(ra.total_revenue, 0),
    'platform_revenue', COALESCE(ra.platform_revenue, 0),
    'organizer_revenue', COALESCE(ra.organizer_revenue, 0),
    'sponsor_revenue', COALESCE(ra.sponsor_revenue, 0),
    'total_tickets_sold', COALESCE(ra.total_tickets_sold, 0),
    'average_ticket_price', COALESCE(ra.average_ticket_price, 0),
    'revenue_per_attendee', COALESCE(ra.revenue_per_attendee, 0),
    'revenue_breakdown', (
      SELECT json_agg(
        json_build_object(
          'transaction_type', rt.transaction_type,
          'amount', rt.amount,
          'platform_commission', rt.platform_commission,
          'organizer_commission', rt.organizer_commission,
          'sponsor_commission', rt.sponsor_commission,
          'created_at', rt.created_at
        )
      ) FROM public.revenue_transactions rt
      WHERE rt.event_id = p_event_id
      ORDER BY rt.created_at DESC
    ),
    'payouts', (
      SELECT json_agg(
        json_build_object(
          'recipient_type', rp.recipient_type,
          'amount', rp.amount,
          'status', rp.status,
          'processed_at', rp.processed_at
        )
      ) FROM public.revenue_payouts rp
      WHERE rp.event_id = p_event_id
    ),
    'last_updated', ra.last_updated
  ) INTO analytics
  FROM public.revenue_analytics ra
  WHERE ra.event_id = p_event_id;

  RETURN COALESCE(analytics, json_build_object('event_id', p_event_id, 'total_revenue', 0));
END;
$$;

-- Function to create payout request
CREATE OR REPLACE FUNCTION public.create_payout_request(
  p_event_id INTEGER,
  p_recipient_type TEXT,
  p_amount DECIMAL(10,2),
  p_payout_method TEXT,
  p_payout_details JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payout_id INTEGER;
  result JSON;
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
    RAISE EXCEPTION 'Unauthorized: Only event organizers can create payout requests';
  END IF;

  -- Create payout request
  INSERT INTO public.revenue_payouts (
    recipient_id, recipient_type, event_id, amount, 
    payout_method, payout_details, status
  ) VALUES (
    auth.uid(), p_recipient_type, p_event_id, p_amount,
    p_payout_method, p_payout_details, 'pending'
  ) RETURNING id INTO payout_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'payout_id', payout_id,
    'amount', p_amount,
    'status', 'pending',
    'created_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to process payouts (admin only)
CREATE OR REPLACE FUNCTION public.process_payouts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payout_record RECORD;
  processed_count INTEGER := 0;
  result JSON;
BEGIN
  -- Only admins can process payouts
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can process payouts';
  END IF;

  -- Process pending payouts
  FOR payout_record IN 
    SELECT * FROM public.revenue_payouts 
    WHERE status = 'pending'
    ORDER BY created_at ASC
  LOOP
    -- Update payout status to processing
    UPDATE public.revenue_payouts 
    SET 
      status = 'processing',
      transaction_reference = 'PAYOUT_' || id || '_' || extract(epoch from now())::text,
      processed_at = NOW()
    WHERE id = payout_record.id;

    processed_count := processed_count + 1;
  END LOOP;

  -- Return processing summary
  SELECT json_build_object(
    'success', TRUE,
    'processed_count', processed_count,
    'processed_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Revenue sharing config indexes
CREATE INDEX IF NOT EXISTS idx_revenue_sharing_config_event_id ON public.revenue_sharing_config(event_id);

-- Revenue transactions indexes
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_event_id ON public.revenue_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_payment_id ON public.revenue_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_status ON public.revenue_transactions(status);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created_at ON public.revenue_transactions(created_at);

-- Revenue payouts indexes
CREATE INDEX IF NOT EXISTS idx_revenue_payouts_recipient_id ON public.revenue_payouts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_revenue_payouts_event_id ON public.revenue_payouts(event_id);
CREATE INDEX IF NOT EXISTS idx_revenue_payouts_status ON public.revenue_payouts(status);

-- Revenue analytics indexes
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_event_id ON public.revenue_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_last_updated ON public.revenue_analytics(last_updated);
