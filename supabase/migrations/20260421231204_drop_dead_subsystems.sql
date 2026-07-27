-- Drop dead subsystems (Apr 2026)
--
-- All tables below are empty (0 rows) and the application code that referenced
-- them has been removed:
--   * Performance / offline-caching subsystem: never wired up, RPCs never existed.
--   * Engagement subsystem: unrouted UI (EngagementHub, CommunityPosts, etc.)
--     removed from src/. No rows were ever written.
--
-- Dependent objects (FKs between these tables, indexes, policies, triggers) are
-- removed implicitly via CASCADE.

-- Performance / offline caching
DROP TABLE IF EXISTS public.offline_actions      CASCADE;
DROP TABLE IF EXISTS public.offline_cache        CASCADE;
DROP TABLE IF EXISTS public.performance_metrics  CASCADE;
DROP TABLE IF EXISTS public.sync_status          CASCADE;

-- Engagement: drop child tables first for clarity, CASCADE would handle it anyway
DROP TABLE IF EXISTS public.community_post_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_likes         CASCADE;
DROP TABLE IF EXISTS public.community_post_comments      CASCADE;
DROP TABLE IF EXISTS public.community_posts              CASCADE;
DROP TABLE IF EXISTS public.throwback_content            CASCADE;
DROP TABLE IF EXISTS public.local_tips                   CASCADE;
DROP TABLE IF EXISTS public.user_engagement              CASCADE;
