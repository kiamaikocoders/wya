-- Multi-Language Support System
-- This migration adds comprehensive internationalization features

-- ==============================================
-- MULTI-LANGUAGE TABLES
-- ==============================================

-- Supported languages
CREATE TABLE IF NOT EXISTS public.supported_languages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE, -- en, sw, fr, etc.
  name TEXT NOT NULL, -- English, Kiswahili, Français
  native_name TEXT NOT NULL, -- English, Kiswahili, Français
  flag_emoji VARCHAR(10), -- 🇺🇸, 🇰🇪, 🇫🇷
  is_rtl BOOLEAN DEFAULT FALSE, -- Right-to-left languages
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User language preferences
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_language VARCHAR(5) REFERENCES public.supported_languages(code),
  secondary_language VARCHAR(5) REFERENCES public.supported_languages(code),
  interface_language VARCHAR(5) REFERENCES public.supported_languages(code),
  content_language VARCHAR(5) REFERENCES public.supported_languages(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translations for events
CREATE TABLE IF NOT EXISTS public.event_translations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  language_code VARCHAR(5) REFERENCES public.supported_languages(code),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, language_code)
);

-- Translations for forum posts
CREATE TABLE IF NOT EXISTS public.forum_post_translations (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  language_code VARCHAR(5) REFERENCES public.supported_languages(code),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, language_code)
);

-- Translations for stories
CREATE TABLE IF NOT EXISTS public.story_translations (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES public.stories(id) ON DELETE CASCADE,
  language_code VARCHAR(5) REFERENCES public.supported_languages(code),
  caption TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, language_code)
);

-- System translations (UI text)
CREATE TABLE IF NOT EXISTS public.system_translations (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL, -- ui.button.save, ui.message.success, etc.
  language_code VARCHAR(5) REFERENCES public.supported_languages(code),
  value TEXT NOT NULL,
  context TEXT, -- Additional context for translators
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language_code)
);

-- Translation requests (for community translations)
CREATE TABLE IF NOT EXISTS public.translation_requests (
  id SERIAL PRIMARY KEY,
  content_type TEXT NOT NULL, -- event, forum_post, story, system
  content_id INTEGER,
  source_language VARCHAR(5) REFERENCES public.supported_languages(code),
  target_language VARCHAR(5) REFERENCES public.supported_languages(code),
  original_text TEXT NOT NULL,
  translated_text TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
  translator_id UUID REFERENCES auth.users(id),
  requested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- RLS POLICIES FOR MULTI-LANGUAGE TABLES
-- ==============================================

-- Supported languages RLS
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Languages are viewable by everyone" ON public.supported_languages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage languages" ON public.supported_languages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- User language preferences RLS
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own language preferences" ON public.user_language_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Event translations RLS
ALTER TABLE public.event_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event translations are viewable by everyone" ON public.event_translations
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage event translations" ON public.event_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

-- Forum post translations RLS
ALTER TABLE public.forum_post_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum post translations are viewable by everyone" ON public.forum_post_translations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own post translations" ON public.forum_post_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts fp 
      WHERE fp.id = post_id AND fp.user_id = auth.uid()::text
    )
  );

-- Story translations RLS
ALTER TABLE public.story_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story translations are viewable by everyone" ON public.story_translations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own story translations" ON public.story_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s 
      WHERE s.id = story_id AND s.user_id = auth.uid()::text
    )
  );

-- System translations RLS
ALTER TABLE public.system_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System translations are viewable by everyone" ON public.system_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage system translations" ON public.system_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Translation requests RLS
ALTER TABLE public.translation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translation requests" ON public.translation_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can create translation requests" ON public.translation_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their own translation requests" ON public.translation_requests
  FOR UPDATE USING (auth.uid() = translator_id OR auth.uid() = requested_by);

-- ==============================================
-- MULTI-LANGUAGE FUNCTIONS
-- ==============================================

-- Function to get user's preferred language
CREATE OR REPLACE FUNCTION public.get_user_language(p_user_id UUID DEFAULT NULL)
RETURNS VARCHAR(5)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_lang VARCHAR(5);
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN 'en'; -- Default to English
  END IF;

  -- Get user's interface language preference
  SELECT interface_language INTO user_lang
  FROM public.user_language_preferences
  WHERE user_id = target_user_id;

  -- Return user's language or default to English
  RETURN COALESCE(user_lang, 'en');
END;
$$;

-- Function to get translated content
CREATE OR REPLACE FUNCTION public.get_translated_content(
  p_content_type TEXT,
  p_content_id INTEGER,
  p_language_code VARCHAR(5) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_language VARCHAR(5);
  translated_content JSON;
BEGIN
  -- Use provided language or user's preferred language
  target_language := COALESCE(p_language_code, public.get_user_language());

  -- Get translated content based on content type
  CASE p_content_type
    WHEN 'event' THEN
      SELECT json_build_object(
        'title', et.title,
        'description', et.description,
        'location', et.location,
        'category', et.category,
        'tags', et.tags,
        'language', et.language_code
      ) INTO translated_content
      FROM public.event_translations et
      WHERE et.event_id = p_content_id AND et.language_code = target_language;

    WHEN 'forum_post' THEN
      SELECT json_build_object(
        'title', fpt.title,
        'content', fpt.content,
        'language', fpt.language_code
      ) INTO translated_content
      FROM public.forum_post_translations fpt
      WHERE fpt.post_id = p_content_id AND fpt.language_code = target_language;

    WHEN 'story' THEN
      SELECT json_build_object(
        'caption', st.caption,
        'content', st.content,
        'language', st.language_code
      ) INTO translated_content
      FROM public.story_translations st
      WHERE st.story_id = p_content_id AND st.language_code = target_language;

    ELSE
      RAISE EXCEPTION 'Unsupported content type: %', p_content_type;
  END CASE;

  -- Return translated content or empty object if not found
  RETURN COALESCE(translated_content, json_build_object('language', target_language));
END;
$$;

-- Function to get system translation
CREATE OR REPLACE FUNCTION public.get_system_translation(
  p_key TEXT,
  p_language_code VARCHAR(5) DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_language VARCHAR(5);
  translation TEXT;
BEGIN
  -- Use provided language or user's preferred language
  target_language := COALESCE(p_language_code, public.get_user_language());

  -- Get system translation
  SELECT value INTO translation
  FROM public.system_translations
  WHERE key = p_key AND language_code = target_language;

  -- Return translation or fallback to English, then to key itself
  IF translation IS NOT NULL THEN
    RETURN translation;
  END IF;

  -- Try English fallback
  SELECT value INTO translation
  FROM public.system_translations
  WHERE key = p_key AND language_code = 'en';

  RETURN COALESCE(translation, p_key);
END;
$$;

-- Function to create translation request
CREATE OR REPLACE FUNCTION public.create_translation_request(
  p_content_type TEXT,
  p_content_id INTEGER,
  p_source_language VARCHAR(5),
  p_target_language VARCHAR(5),
  p_original_text TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id INTEGER;
  result JSON;
BEGIN
  -- Create translation request
  INSERT INTO public.translation_requests (
    content_type, content_id, source_language, target_language,
    original_text, requested_by
  ) VALUES (
    p_content_type, p_content_id, p_source_language, p_target_language,
    p_original_text, auth.uid()
  ) RETURNING id INTO request_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'request_id', request_id,
    'status', 'pending',
    'created_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to submit translation
CREATE OR REPLACE FUNCTION public.submit_translation(
  p_request_id INTEGER,
  p_translated_text TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update translation request
  UPDATE public.translation_requests
  SET 
    translated_text = p_translated_text,
    translator_id = auth.uid(),
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_request_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'request_id', p_request_id,
    'status', 'completed',
    'completed_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get available languages
CREATE OR REPLACE FUNCTION public.get_available_languages()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  languages JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'code', sl.code,
      'name', sl.name,
      'native_name', sl.native_name,
      'flag_emoji', sl.flag_emoji,
      'is_rtl', sl.is_rtl,
      'is_active', sl.is_active
    )
  ) INTO languages
  FROM public.supported_languages sl
  WHERE sl.is_active = TRUE
  ORDER BY sl.name;

  RETURN COALESCE(languages, '[]'::json);
END;
$$;

-- ==============================================
-- INITIAL DATA FOR SUPPORTED LANGUAGES
-- ==============================================

-- Insert initial supported languages
INSERT INTO public.supported_languages (code, name, native_name, flag_emoji, is_rtl) VALUES
('en', 'English', 'English', '🇺🇸', FALSE),
('sw', 'Kiswahili', 'Kiswahili', '🇰🇪', FALSE),
('fr', 'French', 'Français', '🇫🇷', FALSE),
('es', 'Spanish', 'Español', '🇪🇸', FALSE),
('ar', 'Arabic', 'العربية', '🇸🇦', TRUE),
('hi', 'Hindi', 'हिन्दी', '🇮🇳', FALSE),
('zh', 'Chinese', '中文', '🇨🇳', FALSE),
('pt', 'Portuguese', 'Português', '🇵🇹', FALSE),
('de', 'German', 'Deutsch', '🇩🇪', FALSE),
('it', 'Italian', 'Italiano', '🇮🇹', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Insert initial system translations for English
INSERT INTO public.system_translations (key, language_code, value, context) VALUES
('ui.button.save', 'en', 'Save', 'Save button text'),
('ui.button.cancel', 'en', 'Cancel', 'Cancel button text'),
('ui.button.submit', 'en', 'Submit', 'Submit button text'),
('ui.button.delete', 'en', 'Delete', 'Delete button text'),
('ui.button.edit', 'en', 'Edit', 'Edit button text'),
('ui.message.success', 'en', 'Operation completed successfully', 'Success message'),
('ui.message.error', 'en', 'An error occurred', 'Error message'),
('ui.message.loading', 'en', 'Loading...', 'Loading message'),
('ui.nav.home', 'en', 'Home', 'Home navigation'),
('ui.nav.events', 'en', 'Events', 'Events navigation'),
('ui.nav.profile', 'en', 'Profile', 'Profile navigation'),
('ui.nav.settings', 'en', 'Settings', 'Settings navigation'),
('ui.form.required', 'en', 'This field is required', 'Required field message'),
('ui.form.email', 'en', 'Email', 'Email field label'),
('ui.form.password', 'en', 'Password', 'Password field label'),
('ui.form.name', 'en', 'Name', 'Name field label'),
('ui.form.phone', 'en', 'Phone', 'Phone field label'),
('ui.form.address', 'en', 'Address', 'Address field label'),
('ui.event.title', 'en', 'Event Title', 'Event title field'),
('ui.event.description', 'en', 'Event Description', 'Event description field'),
('ui.event.date', 'en', 'Event Date', 'Event date field'),
('ui.event.location', 'en', 'Event Location', 'Event location field'),
('ui.event.price', 'en', 'Event Price', 'Event price field'),
('ui.event.capacity', 'en', 'Event Capacity', 'Event capacity field'),
('ui.ticket.purchase', 'en', 'Purchase Ticket', 'Purchase ticket button'),
('ui.ticket.sold_out', 'en', 'Sold Out', 'Sold out message'),
('ui.ticket.available', 'en', 'Tickets Available', 'Tickets available message'),
('ui.profile.edit', 'en', 'Edit Profile', 'Edit profile button'),
('ui.profile.bio', 'en', 'Bio', 'Bio field label'),
('ui.profile.location', 'en', 'Location', 'Location field label'),
('ui.profile.website', 'en', 'Website', 'Website field label'),
('ui.language.select', 'en', 'Select Language', 'Language selection label'),
('ui.language.current', 'en', 'Current Language', 'Current language label'),
('ui.translation.request', 'en', 'Request Translation', 'Request translation button'),
('ui.translation.submit', 'en', 'Submit Translation', 'Submit translation button'),
('ui.translation.pending', 'en', 'Translation Pending', 'Translation pending message'),
('ui.translation.completed', 'en', 'Translation Completed', 'Translation completed message')
ON CONFLICT (key, language_code) DO NOTHING;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User language preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_language_preferences_user_id ON public.user_language_preferences(user_id);

-- Event translations indexes
CREATE INDEX IF NOT EXISTS idx_event_translations_event_id ON public.event_translations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_translations_language_code ON public.event_translations(language_code);

-- Forum post translations indexes
CREATE INDEX IF NOT EXISTS idx_forum_post_translations_post_id ON public.forum_post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_translations_language_code ON public.forum_post_translations(language_code);

-- Story translations indexes
CREATE INDEX IF NOT EXISTS idx_story_translations_story_id ON public.story_translations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_translations_language_code ON public.story_translations(language_code);

-- System translations indexes
CREATE INDEX IF NOT EXISTS idx_system_translations_key ON public.system_translations(key);
CREATE INDEX IF NOT EXISTS idx_system_translations_language_code ON public.system_translations(language_code);

-- Translation requests indexes
CREATE INDEX IF NOT EXISTS idx_translation_requests_content_type ON public.translation_requests(content_type);
CREATE INDEX IF NOT EXISTS idx_translation_requests_status ON public.translation_requests(status);
CREATE INDEX IF NOT EXISTS idx_translation_requests_target_language ON public.translation_requests(target_language);
