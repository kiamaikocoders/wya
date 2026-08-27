
import { supabase } from '@/lib/supabase';
import { isUndefinedColumnError } from '@/lib/supabase-schema-compat';
import { toast } from 'sonner';
import {
  assertUserMayPostUserGeneratedContent,
  LegalReconsentRequiredForPostingError,
  MediaConsentRequiredForPostingError,
} from '@/lib/posting-guard';
import { publicDisplayName } from '@/lib/display-name';
import type { Story, StoryComment, CreateStoryDto, CreateStoryCommentDto } from './types';

const STORY_PUBLIC_COLUMNS = `
          id,
          content,
          user_id,
          event_id,
          media_url,
          media_type,
          caption,
          likes_count,
          comments_count,
          created_at,
          hashtags,
          status,
          is_featured,
          expires_at
        `;

export const storyService = {
  /**
   * Get all stories with optional event filtering
   */
  getAllStories: async (eventId?: number, limit = 50): Promise<Story[]> => {
    try {
      let query = supabase
        .from('stories')
        .select(STORY_PUBLIC_COLUMNS)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      let { data, error } = await query;

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        let q2 = supabase
          .from('stories')
          .select(STORY_PUBLIC_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (eventId) q2 = q2.eq('event_id', eventId);
        ({ data, error } = await q2);
      }

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get profiles for these stories
      const userIds = [...new Set(data.map(story => story.user_id).filter(Boolean))];
      
      // Fetch profiles separately
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        // Continue without profiles - use fallback values
      }
      
      // Create a map of user_id to profile data
      const profileMap = (profiles || []).reduce((map: any, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {} as Record<string, any>);

      // Transform the data to match our Story interface
      const stories: Story[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        event_id: item.event_id,
        content: item.content,
        caption: item.caption || '',
        media_url: item.media_url,
        media_type: item.media_type,
        likes_count: item.likes_count || 0,
        comments_count: item.comments_count || 0,
        created_at: item.created_at,
        user_name: publicDisplayName(profileMap[item.user_id]),
        user_image: profileMap[item.user_id]?.avatar_url || null,
        hashtags: item.hashtags,
        status: item.status,
        is_featured: item.is_featured,
        expires_at: item.expires_at
      }));

      return stories;
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      // Don't show toast for network errors - they're usually temporary
      if (error?.message?.includes('NetworkError')) {
        console.warn('Network error - stories may not be available');
      } else {
        toast.error('Failed to load stories');
      }
      return [];
    }
  },

  /**
   * Get event stories (filtered by event_id)
   */
  getEventStories: async (eventId: number): Promise<Story[]> => {
    return storyService.getAllStories(eventId);
  },

  /**
   * Get stories with no event (for Community Discover ungrouped section)
   */
  getUngroupedStories: async (limit = 50): Promise<Story[]> => {
    try {
      let { data, error } = await supabase
        .from('stories')
        .select(`
          id, content, user_id, event_id, media_url, media_type, caption,
          likes_count, comments_count, created_at, hashtags, status, is_featured, expires_at
        `)
        .is('event_id', null)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select(`
          id, content, user_id, event_id, media_url, media_type, caption,
          likes_count, comments_count, created_at, hashtags, status, is_featured, expires_at
        `)
          .is('event_id', null)
          .order('created_at', { ascending: false })
          .limit(limit));
      }

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map(s => s.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = (profiles || []).reduce((m: Record<string, any>, p: any) => ({ ...m, [p.id]: p }), {});

      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        event_id: item.event_id,
        content: item.content,
        caption: item.caption || '',
        media_url: item.media_url,
        media_type: item.media_type,
        likes_count: item.likes_count || 0,
        comments_count: item.comments_count || 0,
        created_at: item.created_at,
        user_name: publicDisplayName(profileMap[item.user_id]),
        user_image: profileMap[item.user_id]?.avatar_url || null,
        hashtags: item.hashtags,
        status: item.status,
        is_featured: item.is_featured,
        expires_at: item.expires_at
      }));
    } catch {
      return [];
    }
  },

  /**
   * Distinct event_ids from recent verified stories (ordered by story recency).
   * Discover uses this so past events outside the paginated events list still load highlights.
   */
  getEventIdsFromRecentStories: async (storyRowLimit = 1500): Promise<number[]> => {
    try {
      let { data, error } = await supabase
        .from('stories')
        .select('event_id')
        .not('event_id', 'is', null)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(storyRowLimit);

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select('event_id')
          .not('event_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(storyRowLimit));
      }

      if (error || !data?.length) return [];

      const seen = new Set<number>();
      const out: number[] = [];
      for (const row of data) {
        const n = typeof row.event_id === 'number' ? row.event_id : Number(row.event_id);
        if (Number.isFinite(n) && !seen.has(n)) {
          seen.add(n);
          out.push(n);
        }
      }
      return out;
    } catch {
      return [];
    }
  },

  /**
   * Discover feed: latest verified stories that belong to an event.
   * Uses a single time-ordered query (no giant .in(event_id, ...) list), so new posts always
   * surface and PostgREST URL limits cannot drop the request.
   */
  getRecentVerifiedEventStoriesForDiscover: async (limit = 600): Promise<Story[]> => {
    try {
      let { data, error } = await supabase
        .from('stories')
        .select(STORY_PUBLIC_COLUMNS)
        .not('event_id', 'is', null)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select(STORY_PUBLIC_COLUMNS)
          .not('event_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit));
      }

      if (error) {
        console.error('Supabase query error (discover recent event stories):', error);
        throw error;
      }

      if (!data?.length) return [];

      const userIds = [...new Set(data.map(story => story.user_id).filter(Boolean))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      const profileMap = (profiles || []).reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {});

      return data.map((item: any) => {
        const eid = item.event_id;
        const eventId = typeof eid === 'number' ? eid : Number(eid);
        return {
          id: item.id,
          user_id: item.user_id,
          event_id: Number.isFinite(eventId) ? eventId : item.event_id,
          content: item.content,
          caption: item.caption || '',
          media_url: item.media_url,
          media_type: item.media_type,
          likes_count: item.likes_count || 0,
          comments_count: item.comments_count || 0,
          created_at: item.created_at,
          user_name: publicDisplayName(profileMap[item.user_id]),
          user_image: profileMap[item.user_id]?.avatar_url || null,
          hashtags: item.hashtags,
          status: item.status,
          is_featured: item.is_featured,
          expires_at: item.expires_at,
        };
      });
    } catch (error: any) {
      console.error('Error fetching recent event stories for discover:', error);
      return [];
    }
  },

  /**
   * Get stories for multiple events (used by Discover to align with Event Highlights).
   * Fetches all stories for the given event IDs, ensuring parity with event detail pages.
   */
  getStoriesForEvents: async (eventIds: number[], limit = 500): Promise<Story[]> => {
    if (!eventIds || eventIds.length === 0) {
      return [];
    }
    try {
      let { data, error } = await supabase
        .from('stories')
        .select(STORY_PUBLIC_COLUMNS)
        .in('event_id', eventIds)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select(STORY_PUBLIC_COLUMNS)
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
          .limit(limit));
      }

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const userIds = [...new Set(data.map(story => story.user_id).filter(Boolean))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      const profileMap = (profiles || []).reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {});

      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        event_id: item.event_id,
        content: item.content,
        caption: item.caption || '',
        media_url: item.media_url,
        media_type: item.media_type,
        likes_count: item.likes_count || 0,
        comments_count: item.comments_count || 0,
        created_at: item.created_at,
        user_name: publicDisplayName(profileMap[item.user_id]),
        user_image: profileMap[item.user_id]?.avatar_url || null,
        hashtags: item.hashtags,
        status: item.status,
        is_featured: item.is_featured,
        expires_at: item.expires_at
      }));
    } catch (error: any) {
      console.error('Error fetching stories for events:', error);
      return [];
    }
  },

  /**
   * Get featured stories (with is_featured = true)
   */
  getFeaturedStories: async (): Promise<Story[]> => {
    try {
      let { data, error } = await supabase
        .from('stories')
        .select(STORY_PUBLIC_COLUMNS)
        .eq('is_featured', true)
        .eq('moderation_status', 'verified')
        .order('created_at', { ascending: false });

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select(STORY_PUBLIC_COLUMNS)
          .eq('is_featured', true)
          .order('created_at', { ascending: false }));
      }

      if (error) throw error;

      // Get profiles for these stories
      const userIds = data.map(story => story.user_id).filter(Boolean);
      
      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      
      // Create a map of user_id to profile data
      const profileMap = (profiles || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});

      // Transform the data to match our Story interface
      const stories: Story[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        event_id: item.event_id,
        content: item.content,
        caption: item.caption || '',
        media_url: item.media_url,
        media_type: item.media_type,
        likes_count: item.likes_count || 0,
        comments_count: item.comments_count || 0,
        created_at: item.created_at,
        user_name: publicDisplayName(profileMap[item.user_id]),
        user_image: profileMap[item.user_id]?.avatar_url || null,
        hashtags: item.hashtags,
        status: item.status,
        is_featured: item.is_featured,
        expires_at: item.expires_at
      }));

      return stories;
    } catch (error) {
      console.error('Error fetching featured stories:', error);
      toast.error('Failed to load featured stories');
      return [];
    }
  },

  /**
   * Get a story by ID
   */
  getStoryById: async (storyId: number): Promise<Story | null> => {
    try {
      let { data, error } = await supabase
        .from('stories')
        .select(STORY_PUBLIC_COLUMNS)
        .eq('id', storyId)
        .eq('moderation_status', 'verified')
        .single();

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        ({ data, error } = await supabase
          .from('stories')
          .select(STORY_PUBLIC_COLUMNS)
          .eq('id', storyId)
          .single());
      }

      if (error) throw error;

      if (!data) return null;
      
      // Fetch the author's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', data.user_id)
        .single();

      return {
        id: data.id,
        user_id: data.user_id,
        event_id: data.event_id,
        content: data.content,
        caption: data.caption || '',
        media_url: data.media_url,
        media_type: data.media_type,
        likes_count: data.likes_count || 0,
        comments_count: data.comments_count || 0,
        created_at: data.created_at,
        user_name: publicDisplayName(profile),
        user_image: profile?.avatar_url || null,
        hashtags: data.hashtags,
        status: data.status,
        is_featured: data.is_featured,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error(`Error fetching story with ID ${storyId}:`, error);
      toast.error('Failed to load story');
      return null;
    }
  },

  /**
   * Create a new story
   */
  createStory: async (storyData: CreateStoryDto): Promise<Story | null> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a story');
        return null;
      }

      await assertUserMayPostUserGeneratedContent(user.id);

      // Extract hashtags from content if present
      const hashtagRegex = /#(\w+)/g;
      const matches = storyData.content.match(hashtagRegex) || [];
      const hashtags = matches.map(tag => tag.substring(1));

      // Create the insert data matching table schema
      const insertData = {
        user_id: user.id,
        event_id: storyData.event_id,
        content: storyData.content,
        caption: storyData.caption || storyData.content,
        media_url: storyData.media_url,
        media_type: storyData.media_url ? (storyData.media_type || 'image') : null,
        hashtags: hashtags.length > 0 ? hashtags : [],
        moderation_status: 'pending' as const,
      };

      let { data, error } = await supabase
        .from('stories')
        .insert(insertData)
        .select()
        .single();

      if (error && isUndefinedColumnError(error, 'moderation_status')) {
        const { moderation_status: _m, ...insertWithoutMod } = insertData;
        ({ data, error } = await supabase
          .from('stories')
          .insert(insertWithoutMod)
          .select()
          .single());
      }

      if (error) throw error;

      // Fetch the user's profile to include in the response
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      toast.success('Story created successfully');
      
      return {
        ...data,
        user_name: publicDisplayName(profile),
        user_image: profile?.avatar_url || null
      };
    } catch (error) {
      if (
        error instanceof MediaConsentRequiredForPostingError ||
        error instanceof LegalReconsentRequiredForPostingError
      ) {
        throw error;
      }
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
      return null;
    }
  },

  /**
   * Update a story
   */
  updateStory: async (storyId: number, storyData: Partial<Story>): Promise<Story | null> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to update a story');
        return null;
      }

      // Check if the story belongs to the current user
      const { data: storyCheck } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (!storyCheck || storyCheck.user_id !== user.id) {
        toast.error('You can only update your own stories');
        return null;
      }

      // Only include fields that are in the database schema
      const updateData: any = {};
      
      if (storyData.content !== undefined) updateData.content = storyData.content;
      if (storyData.caption !== undefined) updateData.caption = storyData.caption;
      if (storyData.media_url !== undefined) updateData.media_url = storyData.media_url;
      if (storyData.media_type !== undefined) updateData.media_type = storyData.media_type;
      if (storyData.hashtags !== undefined) updateData.hashtags = storyData.hashtags;
      if (storyData.is_featured !== undefined) updateData.is_featured = storyData.is_featured;
      if (storyData.status !== undefined) updateData.status = storyData.status;

      const { data, error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;

      // Fetch the user's profile to include in the response
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', data.user_id)
        .single();

      toast.success('Story updated successfully');
      
      return {
        ...data,
        user_name: publicDisplayName(profile),
        user_image: profile?.avatar_url || null
      };
    } catch (error) {
      console.error(`Error updating story with ID ${storyId}:`, error);
      toast.error('Failed to update story');
      throw error;
    }
  },

  /**
   * Delete a story
   */
  deleteStory: async (storyId: number): Promise<boolean> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to delete a story');
      }

      // Check if the story belongs to the current user
      const { data: storyCheck } = await supabase
        .from('stories')
        .select('user_id, media_url')
        .eq('id', storyId)
        .single();

      if (!storyCheck || storyCheck.user_id !== user.id) {
        throw new Error('You can only delete your own stories');
      }

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      const mediaUrl =
        typeof storyCheck.media_url === 'string' ? storyCheck.media_url.trim() : '';
      if (mediaUrl) {
        const { storageService } = await import('@/lib/storage-service');
        await storageService.deleteByPublicUrl(mediaUrl);
      }

      toast.success('Story deleted successfully');
      return true;
    } catch (error) {
      console.error(`Error deleting story with ID ${storyId}:`, error);
      toast.error('Failed to delete story');
      throw error;
    }
  },

  /**
   * Get comments for a story
   */
  getStoryComments: async (storyId: number): Promise<StoryComment[]> => {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .select(`
          id,
          user_id,
          story_id,
          content,
          created_at
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for comment authors
      const userIds = data.map(comment => comment.user_id).filter(Boolean);
      
      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      
      // Create a map of user_id to profile data
      const profileMap = (profiles || []).reduce((map, profile) => {
        map[profile.id] = profile;
        return map;
      }, {});

      // Transform the data to match our StoryComment interface
      return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        story_id: item.story_id!,
        content: item.content,
        created_at: item.created_at,
        user_name: publicDisplayName(profileMap[item.user_id]),
        user_image: profileMap[item.user_id]?.avatar_url || null
      }));
    } catch (error) {
      console.error(`Error fetching comments for story ID ${storyId}:`, error);
      toast.error('Failed to load comments');
      return [];
    }
  },

  /**
   * Create a comment on a story
   */
  createStoryComment: async (commentData: CreateStoryCommentDto): Promise<StoryComment | null> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to comment');
      }

      await assertUserMayPostUserGeneratedContent(user.id);

      const { data: comment, error: commentError } = await supabase
        .from('story_comments')
        .insert({
          user_id: user.id,
          story_id: commentData.story_id,
          content: commentData.content
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Update the comments count on the story manually
      try {
        const { data: story } = await supabase
          .from('stories')
          .select('comments_count')
          .eq('id', commentData.story_id)
          .single();

        if (story) {
          const { error: updateError } = await supabase
            .from('stories')
            .update({ comments_count: (story.comments_count || 0) + 1 })
            .eq('id', commentData.story_id);

          if (updateError) {
            console.error('Error updating comments count:', updateError);
          }
        }
      } catch (error) {
        console.error('Error updating comments count:', error);
      }

      // Fetch the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      toast.success('Comment added');
      
      return {
        ...comment,
        user_name: publicDisplayName(profile),
        user_image: profile?.avatar_url || null
      };
    } catch (error) {
      if (
        error instanceof MediaConsentRequiredForPostingError ||
        error instanceof LegalReconsentRequiredForPostingError
      ) {
        throw error;
      }
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  },

  /**
   * Like a story
   */
  likeStory: async (storyId: number): Promise<boolean> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to like stories');
      }

      // Check if the user has already liked this story (.maybeSingle() avoids 406 when no row)
      const { data: existingLike } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // User already liked this story, so unlike it
        const { error: unlikeError } = await supabase
          .from('story_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;

        // Decrement the likes count manually
        try {
          const { data: story } = await supabase
            .from('stories')
            .select('likes_count')
            .eq('id', storyId)
            .single();

          if (story) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({ likes_count: Math.max((story.likes_count || 0) - 1, 0) })
              .eq('id', storyId);

            if (updateError) console.error('Error updating likes count:', updateError);
          }
        } catch (error) {
          console.error('Error updating likes count:', error);
        }

        toast.success('Story unliked');
        return false;
      } else {
        // Like the story
        const { error: likeError } = await supabase
          .from('story_likes')
          .insert({
            user_id: user.id,
            story_id: storyId
          });

        if (likeError) {
          // 409 = duplicate key (race: like already exists), treat as success
          if (likeError.code === '23505') {
            return true;
          }
          throw likeError;
        }

        // Increment the likes count manually
        try {
          const { data: story } = await supabase
            .from('stories')
            .select('likes_count')
            .eq('id', storyId)
            .single();

          if (story) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({ likes_count: (story.likes_count || 0) + 1 })
              .eq('id', storyId);

            if (updateError) console.error('Error updating likes count:', updateError);
          }
        } catch (error) {
          console.error('Error updating likes count:', error);
        }

        toast.success('Story liked');
        return true;
      }
    } catch (error) {
      console.error(`Error liking/unliking story ID ${storyId}:`, error);
      toast.error('Failed to update like status');
      throw error;
    }
  },

  /**
   * Check if the current user has liked a story
   */
  hasUserLikedStory: async (storyId: number): Promise<boolean> => {
    try {
      // First check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();

      return data != null;
    } catch (error) {
      console.error(`Error checking like status for story ID ${storyId}:`, error);
      throw error;
    }
  }
};
