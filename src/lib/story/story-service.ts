
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Story, StoryComment, CreateStoryDto, CreateStoryCommentDto } from './types';

export const storyService = {
  /**
   * Get all stories with optional event filtering
   */
  getAllStories: async (eventId?: number): Promise<Story[]> => {
    try {
      let query = supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          events:event_id (title)
        `)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

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
        updated_at: item.updated_at,
        user_name: item.profiles?.username,
        user_image: item.profiles?.avatar_url,
        hashtags: item.hashtags
      }));

      return stories;
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
      return [];
    }
  },

  /**
   * Get featured stories (with is_featured = true)
   */
  getFeaturedStories: async (): Promise<Story[]> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          events:event_id (title)
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
        updated_at: item.updated_at,
        user_name: item.profiles?.username,
        user_image: item.profiles?.avatar_url,
        hashtags: item.hashtags
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
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          events:event_id (title)
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;

      if (!data) return null;

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
        updated_at: data.updated_at,
        user_name: data.profiles?.username,
        user_image: data.profiles?.avatar_url,
        hashtags: data.hashtags
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

      // Extract hashtags from content if present
      const hashtagRegex = /#(\w+)/g;
      const matches = storyData.content.match(hashtagRegex) || [];
      const hashtags = matches.map(tag => tag.substring(1));

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          event_id: storyData.event_id,
          content: storyData.content,
          media_url: storyData.media_url,
          media_type: storyData.media_url ? 'image' : null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Story created successfully');
      return data;
    } catch (error) {
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

      const { data, error } = await supabase
        .from('stories')
        .update({
          ...storyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Story updated successfully');
      return data;
    } catch (error) {
      console.error(`Error updating story with ID ${storyId}:`, error);
      toast.error('Failed to update story');
      return null;
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
        toast.error('You must be logged in to delete a story');
        return false;
      }

      // Check if the story belongs to the current user
      const { data: storyCheck } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (!storyCheck || storyCheck.user_id !== user.id) {
        toast.error('You can only delete your own stories');
        return false;
      }

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast.success('Story deleted successfully');
      return true;
    } catch (error) {
      console.error(`Error deleting story with ID ${storyId}:`, error);
      toast.error('Failed to delete story');
      return false;
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
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our StoryComment interface
      return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        story_id: item.story_id,
        content: item.content,
        created_at: item.created_at,
        user_name: item.profiles?.username,
        user_image: item.profiles?.avatar_url
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
        toast.error('You must be logged in to comment');
        return null;
      }

      const { data: comment, error: commentError } = await supabase
        .from('story_comments')
        .insert({
          user_id: user.id,
          story_id: commentData.story_id,
          content: commentData.content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Update the comments count on the story
      const { error: updateError } = await supabase.rpc('increment_story_comments_count', {
        p_story_id: commentData.story_id
      });

      if (updateError) {
        console.error('Error updating comments count:', updateError);
        // Continue anyway as the comment was added successfully
      }

      toast.success('Comment added');
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return null;
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
        toast.error('You must be logged in to like stories');
        return false;
      }

      // Check if the user has already liked this story
      const { data: existingLike } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // User already liked this story, so unlike it
        const { error: unlikeError } = await supabase
          .from('story_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;

        // Decrement the likes count
        const { error: updateError } = await supabase.rpc('decrement_story_likes_count', {
          p_story_id: storyId
        });

        if (updateError) console.error('Error updating likes count:', updateError);

        toast.success('Story unliked');
        return false;
      } else {
        // Like the story
        const { error: likeError } = await supabase
          .from('story_likes')
          .insert({
            user_id: user.id,
            story_id: storyId,
            created_at: new Date().toISOString()
          });

        if (likeError) throw likeError;

        // Increment the likes count
        const { error: updateError } = await supabase.rpc('increment_story_likes_count', {
          p_story_id: storyId
        });

        if (updateError) console.error('Error updating likes count:', updateError);

        toast.success('Story liked');
        return true;
      }
    } catch (error) {
      console.error(`Error liking/unliking story ID ${storyId}:`, error);
      toast.error('Failed to update like status');
      return false;
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
        .eq('user_id', user.id);

      return data !== null && data.length > 0;
    } catch (error) {
      console.error(`Error checking like status for story ID ${storyId}:`, error);
      return false;
    }
  }
};
