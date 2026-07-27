-- Add image_url, admin_notes, and contact fields to proposals table
-- This migration enhances the proposal system with image support and admin editing capabilities

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitted_by ON public.proposals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_proposals_image_url ON public.proposals(image_url) WHERE image_url IS NOT NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN public.proposals.image_url IS 'URL of the event image uploaded by the proposer';
COMMENT ON COLUMN public.proposals.admin_notes IS 'Internal notes added by admins when reviewing proposals';
COMMENT ON COLUMN public.proposals.contact_email IS 'Contact email provided by the proposer';
COMMENT ON COLUMN public.proposals.contact_phone IS 'Contact phone number provided by the proposer';
