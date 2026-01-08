-- Add Missing Event Categories
-- This migration adds 5 new parent categories and 27 new subcategories

-- ==============================================
-- ADD NEW PARENT CATEGORIES
-- ==============================================

INSERT INTO public.categories (name, icon, order_index) VALUES
  ('Education & Skill Building', '🧠', 6),
  ('Gaming & Tech', '🎮', 7),
  ('Community & Social Impact', '👨‍👩‍👧‍👦', 8),
  ('Sports & Outdoor', '⚽', 9),
  ('Fashion & Lifestyle', '💃🏽', 10)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD MISSING SUBCATEGORIES FOR BUSINESS & NETWORKING
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Startup Pitch Events', (SELECT id FROM public.categories WHERE name = 'Business & Networking' AND parent_id IS NULL), 4),
  ('Industry Meetups', (SELECT id FROM public.categories WHERE name = 'Business & Networking' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD SUBCATEGORIES FOR EDUCATION & SKILL BUILDING
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Training Sessions', (SELECT id FROM public.categories WHERE name = 'Education & Skill Building' AND parent_id IS NULL), 1),
  ('Online Webinars', (SELECT id FROM public.categories WHERE name = 'Education & Skill Building' AND parent_id IS NULL), 2),
  ('Creative Workshops (e.g. pottery, photography)', (SELECT id FROM public.categories WHERE name = 'Education & Skill Building' AND parent_id IS NULL), 3),
  ('Tech Bootcamps', (SELECT id FROM public.categories WHERE name = 'Education & Skill Building' AND parent_id IS NULL), 4),
  ('Student Events', (SELECT id FROM public.categories WHERE name = 'Education & Skill Building' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD SUBCATEGORIES FOR GAMING & TECH
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Esports Tournaments', (SELECT id FROM public.categories WHERE name = 'Gaming & Tech' AND parent_id IS NULL), 1),
  ('LAN Parties', (SELECT id FROM public.categories WHERE name = 'Gaming & Tech' AND parent_id IS NULL), 2),
  ('App/Product Launches', (SELECT id FROM public.categories WHERE name = 'Gaming & Tech' AND parent_id IS NULL), 3),
  ('VR/AR Demo Events', (SELECT id FROM public.categories WHERE name = 'Gaming & Tech' AND parent_id IS NULL), 4),
  ('NFT/Token Community Hangouts', (SELECT id FROM public.categories WHERE name = 'Gaming & Tech' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD SUBCATEGORIES FOR COMMUNITY & SOCIAL IMPACT
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Volunteer Drives', (SELECT id FROM public.categories WHERE name = 'Community & Social Impact' AND parent_id IS NULL), 1),
  ('Charity Fundraisers', (SELECT id FROM public.categories WHERE name = 'Community & Social Impact' AND parent_id IS NULL), 2),
  ('Environmental Cleanups', (SELECT id FROM public.categories WHERE name = 'Community & Social Impact' AND parent_id IS NULL), 3),
  ('Awareness Campaigns', (SELECT id FROM public.categories WHERE name = 'Community & Social Impact' AND parent_id IS NULL), 4),
  ('Faith-Based Events', (SELECT id FROM public.categories WHERE name = 'Community & Social Impact' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD SUBCATEGORIES FOR SPORTS & OUTDOOR
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Match Screenings', (SELECT id FROM public.categories WHERE name = 'Sports & Outdoor' AND parent_id IS NULL), 1),
  ('Live Sports Events', (SELECT id FROM public.categories WHERE name = 'Sports & Outdoor' AND parent_id IS NULL), 2),
  ('Group Hikes / Runs / Marathons', (SELECT id FROM public.categories WHERE name = 'Sports & Outdoor' AND parent_id IS NULL), 3),
  ('Adventure & Travel Events', (SELECT id FROM public.categories WHERE name = 'Sports & Outdoor' AND parent_id IS NULL), 4),
  ('Car/Bike Shows or Rallies', (SELECT id FROM public.categories WHERE name = 'Sports & Outdoor' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

-- ==============================================
-- ADD SUBCATEGORIES FOR FASHION & LIFESTYLE
-- ==============================================

INSERT INTO public.categories (name, parent_id, order_index) VALUES
  ('Pop-Up Markets', (SELECT id FROM public.categories WHERE name = 'Fashion & Lifestyle' AND parent_id IS NULL), 1),
  ('Fashion Shows', (SELECT id FROM public.categories WHERE name = 'Fashion & Lifestyle' AND parent_id IS NULL), 2),
  ('Thrift Markets', (SELECT id FROM public.categories WHERE name = 'Fashion & Lifestyle' AND parent_id IS NULL), 3),
  ('Styling Workshops', (SELECT id FROM public.categories WHERE name = 'Fashion & Lifestyle' AND parent_id IS NULL), 4),
  ('Brand Launch Events', (SELECT id FROM public.categories WHERE name = 'Fashion & Lifestyle' AND parent_id IS NULL), 5)
ON CONFLICT DO NOTHING;

