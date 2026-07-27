-- Hierarchical Categories System
-- This migration creates a categories table with parent-child relationships
-- and updates the events table to use category_id instead of category TEXT

-- ==============================================
-- CATEGORIES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, parent_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(order_index);

-- ==============================================
-- ADD CATEGORY_ID TO EVENTS TABLE
-- ==============================================

-- Add category_id column (nullable for backward compatibility)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for category_id
CREATE INDEX IF NOT EXISTS idx_events_category_id ON public.events(category_id);

-- ==============================================
-- SEED MAIN CATEGORIES
-- ==============================================

-- Insert main categories
INSERT INTO public.categories (name, icon, order_index) VALUES
  ('Music & Entertainment', '🎵', 1),
  ('Food & Nightlife', '🍽️', 2),
  ('Arts & Culture', '🎨', 3),
  ('Health & Wellness', '🧘‍♀️', 4),
  ('Business & Networking', '💼', 5)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Music & Entertainment
INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Concerts', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 1),
  ('DJ Nights / Club Events', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 2),
  ('Music Festivals', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 3),
  ('Live Band Performances', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 4),
  ('Listening Parties', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 5),
  ('Karaoke Nights', (SELECT id FROM public.categories WHERE name = 'Music & Entertainment' AND parent_id IS NULL), 6)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Food & Nightlife
INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Food Festivals', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 1),
  ('Wine / Whiskey Tastings', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 2),
  ('Brunches & Pop-ups', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 3),
  ('Restaurant Events', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 4),
  ('Pub Crawls', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 5),
  ('Mixology / Cocktail Nights', (SELECT id FROM public.categories WHERE name = 'Food & Nightlife' AND parent_id IS NULL), 6)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Arts & Culture
INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Art Exhibitions', (SELECT id FROM public.categories WHERE name = 'Arts & Culture' AND parent_id IS NULL), 1),
  ('Poetry / Spoken Word', (SELECT id FROM public.categories WHERE name = 'Arts & Culture' AND parent_id IS NULL), 2),
  ('Theatre & Plays', (SELECT id FROM public.categories WHERE name = 'Arts & Culture' AND parent_id IS NULL), 3),
  ('Cultural Festivals', (SELECT id FROM public.categories WHERE name = 'Arts & Culture' AND parent_id IS NULL), 4),
  ('Film Screenings / Movie Nights', (SELECT id FROM public.categories WHERE name = 'Arts & Culture' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Health & Wellness
INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Yoga Sessions', (SELECT id FROM public.categories WHERE name = 'Health & Wellness' AND parent_id IS NULL), 1),
  ('Dance Classes', (SELECT id FROM public.categories WHERE name = 'Health & Wellness' AND parent_id IS NULL), 2),
  ('Outdoor Fitness Bootcamps', (SELECT id FROM public.categories WHERE name = 'Health & Wellness' AND parent_id IS NULL), 3),
  ('Mental Health Meetups', (SELECT id FROM public.categories WHERE name = 'Health & Wellness' AND parent_id IS NULL), 4),
  ('Nature Walks / Hikes', (SELECT id FROM public.categories WHERE name = 'Health & Wellness' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Business & Networking
INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Conferences & Summits', (SELECT id FROM public.categories WHERE name = 'Business & Networking' AND parent_id IS NULL), 1),
  ('Workshops / Masterclasses', (SELECT id FROM public.categories WHERE name = 'Business & Networking' AND parent_id IS NULL), 2),
  ('Panel Talks', (SELECT id FROM public.categories WHERE name = 'Business & Networking' AND parent_id IS NULL), 3)
ON CONFLICT DO NOTHING;

-- ==============================================
-- MIGRATE EXISTING CATEGORY DATA (Optional)
-- ==============================================

-- Function to migrate existing category TEXT to category_id
-- This can be run manually or as part of a data migration script
CREATE OR REPLACE FUNCTION migrate_event_categories()
RETURNS void AS $$
DECLARE
  event_record RECORD;
  category_record RECORD;
  parent_category_id INTEGER;
  subcategory_id INTEGER;
BEGIN
  -- Loop through events with category TEXT but no category_id
  FOR event_record IN 
    SELECT id, category FROM public.events 
    WHERE category IS NOT NULL AND category_id IS NULL
  LOOP
    -- Try to find matching category (case-insensitive)
    -- First try to find as subcategory
    SELECT id, parent_id INTO category_record
    FROM public.categories
    WHERE LOWER(name) = LOWER(event_record.category)
    LIMIT 1;
    
    IF category_record IS NOT NULL THEN
      -- Found subcategory, use it
      UPDATE public.events 
      SET category_id = category_record.id
      WHERE id = event_record.id;
    ELSE
      -- Try to find as parent category
      SELECT id INTO parent_category_id
      FROM public.categories
      WHERE LOWER(name) = LOWER(event_record.category) AND parent_id IS NULL
      LIMIT 1;
      
      IF parent_category_id IS NOT NULL THEN
        -- Found parent category, use it
        UPDATE public.events 
        SET category_id = parent_category_id
        WHERE id = event_record.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can insert/update/delete categories
CREATE POLICY "Only admins can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'admin'
    )
  );

-- ==============================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
