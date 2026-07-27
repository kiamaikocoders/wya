-- Fix Supabase security advisor findings (Apr 2026)
--
-- Addresses:
--   * rls_disabled_in_public  (public.users, public.community_post_comment_likes)
--   * auth_users_exposed      (public.profiles_with_email)
--   * security_definer_view   (public.profiles_with_email, public.events_with_organizer)
--   * rls_policy_always_true  (public.performance_metrics, public.sync_status)
--   * public_bucket_allows_listing (8 storage buckets)
--   * function_search_path_mutable (~30 public functions)

-- ---------------------------------------------------------------------------
-- 1. Drop legacy / exposing objects
-- ---------------------------------------------------------------------------

-- Legacy empty table overlapping with public.profiles; not referenced in app
DROP TABLE IF EXISTS public.users CASCADE;

-- Views not referenced by application code. profiles_with_email exposed
-- auth.users.email to anon; events_with_organizer was SECURITY DEFINER.
DROP VIEW IF EXISTS public.profiles_with_email;
DROP VIEW IF EXISTS public.events_with_organizer;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS + policies on community_post_comment_likes
-- ---------------------------------------------------------------------------

ALTER TABLE public.community_post_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are readable"         ON public.community_post_comment_likes;
DROP POLICY IF EXISTS "Users can like comments"    ON public.community_post_comment_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON public.community_post_comment_likes;

CREATE POLICY "Likes are readable"
  ON public.community_post_comment_likes
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.community_post_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.community_post_comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Tighten "USING (true)" permissive policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "System can record metrics" ON public.performance_metrics;
CREATE POLICY "Users can record their own metrics"
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage sync status" ON public.sync_status;
CREATE POLICY "Users manage their own sync status"
  ON public.sync_status
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Policies for tables that had RLS enabled but no policy
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Creators manage their share links" ON public.event_media_share_links;
CREATE POLICY "Creators manage their share links"
  ON public.event_media_share_links
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- password_reset_attempts: intentionally no client-facing policy.
-- Only the service_role (used by edge functions / server) may touch it.
COMMENT ON TABLE public.password_reset_attempts IS
  'Rate-limit store for password resets. Accessed exclusively via service_role; no client RLS policies by design.';

-- ---------------------------------------------------------------------------
-- 5. Storage bucket listing: drop broad SELECT policies on public buckets.
--    Public URLs (getPublicUrl / createSignedUrl) do not require these.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read event-images"     ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event media"      ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view forum media"      ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stories uploads"  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stories media"    ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view uploads"          ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user avatars"     ON storage.objects;

-- ---------------------------------------------------------------------------
-- 6. Pin search_path on flagged functions (function_search_path_mutable)
--    Uses (public, pg_temp) to preserve existing unqualified references.
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.anonymize_user_data(uuid)                                                      SET search_path = public, pg_temp;
ALTER FUNCTION public.create_like_notification(uuid, text, text, text, text, integer, uuid, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_translation_request(text, integer, varchar, varchar, text)              SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_user_data(uuid)                                                         SET search_path = public, pg_temp;
ALTER FUNCTION public.events_within_radius(double precision, double precision, double precision, integer, integer, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.events_within_radius_count(double precision, double precision, double precision, text)             SET search_path = public, pg_temp;
ALTER FUNCTION public.export_user_data(uuid)                                                         SET search_path = public, pg_temp;
ALTER FUNCTION public.get_available_languages()                                                      SET search_path = public, pg_temp;
ALTER FUNCTION public.get_category_name(integer)                                                     SET search_path = public, pg_temp;
ALTER FUNCTION public.get_ghost_users_by_persona(integer)                                            SET search_path = public, pg_temp;
ALTER FUNCTION public.get_system_translation(text, varchar)                                          SET search_path = public, pg_temp;
ALTER FUNCTION public.get_translated_content(text, integer, varchar)                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_emails(uuid[])                                                        SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_language(uuid)                                                        SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_forum_post_views(bigint)                                             SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_forum_post_views(integer)                                            SET search_path = public, pg_temp;
ALTER FUNCTION public.like_forum_post(bigint)                                                        SET search_path = public, pg_temp;
ALTER FUNCTION public.like_forum_post(integer)                                                       SET search_path = public, pg_temp;
ALTER FUNCTION public.log_ghost_action(integer, uuid, text, integer, text, boolean, text)            SET search_path = public, pg_temp;
ALTER FUNCTION public.log_ghost_action(integer, uuid, text, text, text, boolean, text)               SET search_path = public, pg_temp;
ALTER FUNCTION public.migrate_event_categories()                                                     SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_stuck_processing_actions()                                               SET search_path = public, pg_temp;
ALTER FUNCTION public.set_category_from_category_id()                                                SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at()                                                               SET search_path = public, pg_temp;
ALTER FUNCTION public.set_user_onboarding_preferences_updated_at()                                   SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_translation(integer, text)                                              SET search_path = public, pg_temp;
ALTER FUNCTION public.unlike_forum_post(bigint)                                                      SET search_path = public, pg_temp;
ALTER FUNCTION public.unlike_forum_post(integer)                                                     SET search_path = public, pg_temp;
ALTER FUNCTION public.update_categories_updated_at()                                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.update_ghost_action_status(integer, text, text)                                SET search_path = public, pg_temp;
ALTER FUNCTION public.update_story_comments_count()                                                  SET search_path = public, pg_temp;
ALTER FUNCTION public.update_story_likes_count()                                                     SET search_path = public, pg_temp;
