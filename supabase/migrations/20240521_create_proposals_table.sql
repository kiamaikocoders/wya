-- Migration: Create proposals table for event proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_date DATE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) NOT NULL, -- Assuming submitted_by is auth.users.id
  submitted_on TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expected_attendees INTEGER,
  budget TEXT,
  sponsor_needs TEXT
);

-- Add Row Level Security (RLS)
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can submit their own proposals
CREATE POLICY "Users can submit their own proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Policy: Admins can view all proposals
CREATE POLICY "Admins can view all proposals" ON public.proposals
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND username = 'admin'));

-- Policy: Admins can update proposals
CREATE POLICY "Admins can update proposals" ON public.proposals
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND username = 'admin'));

-- Policy: Admins can delete proposals
CREATE POLICY "Admins can delete proposals" ON public.proposals
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND username = 'admin')); 