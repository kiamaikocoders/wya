import { supabase } from './supabase';
import { toast } from 'sonner';

export interface ThrowbackContent {
  id: number;
  user_id: string;
  event_id: number;
  original_story_id?: number;
  title: string;
  description?: string;
  media_url?: string;
  media_type?: string;
  throwback_date: string;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: number;
  user_id: string;
  title: string;
  content: string;
  media_url?: string;
  media_type?: string;
  category: string;
  location?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CommunityPostComment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  parent_comment_id?: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface TopMoment {
  id: number;
  event_id: number;
  story_id: number;
  title: string;
  description?: string;
  media_url?: string;
  media_type?: string;
  rank_position: number;
  is_featured: boolean;
  created_at: string;
}

export interface EventTeaser {
  id: number;
  event_id: number;
  title: string;
  description?: string;
  media_url?: string;
  media_type?: string;
  teaser_type: string;
  release_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface FeaturedCreator {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  media_url?: string;
  feature_type: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface LocalTip {
  id: number;
  user_id: string;
  title: string;
  content: string;
  media_url?: string;
  media_type?: string;
  tip_type: string;
  location?: string;
  tags: string[];
  likes_count: number;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface TrendingContent {
  content_type: string;
  content_id: number;
  title: string;
  media_url?: string;
  media_type?: string;
  engagement_score: number;
  created_at: string;
  username: string;
  avatar_url?: string;
}

export const engagementService = {
  // ==============================================
  // THROWBACK CONTENT
  // ==============================================

  // Create throwback content
  createThrowbackContent: async (
    eventId: number,
    originalStoryId: number,
    title: string,
    description: string,
    mediaUrl: string,
    mediaType: string,
    throwbackDate: string,
    tags: string[]
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('create_throwback_content', {
        p_event_id: eventId,
        p_original_story_id: originalStoryId,
        p_title: title,
        p_description: description,
        p_media_url: mediaUrl,
        p_media_type: mediaType,
        p_throwback_date: throwbackDate,
        p_tags: tags
      });

      if (error) throw error;

      toast.success('Throwback content created successfully');
      return data;
    } catch (error) {
      console.error('Error creating throwback content:', error);
      toast.error('Failed to create throwback content');
      throw error;
    }
  },

  // Get throwback content
  getThrowbackContent: async (eventId?: number): Promise<ThrowbackContent[]> => {
    try {
      let query = supabase
        .from('throwback_content')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url),
          events:event_id(id, title, date)
        `)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting throwback content:', error);
      throw error;
    }
  },

  // ==============================================
  // COMMUNITY POSTS
  // ==============================================

  // Create community post
  createCommunityPost: async (
    title: string,
    content: string,
    category: string,
    mediaUrl?: string,
    mediaType?: string,
    location?: string,
    tags?: string[]
  ): Promise<CommunityPost> => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title,
          content,
          category,
          media_url: mediaUrl,
          media_type: mediaType,
          location,
          tags: tags || []
        })
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      toast.success('Community post created successfully');
      return data;
    } catch (error) {
      console.error('Error creating community post:', error);
      toast.error('Failed to create community post');
      throw error;
    }
  },

  // Get community posts
  getCommunityPosts: async (
    category?: string,
    limit: number = 20
  ): Promise<CommunityPost[]> => {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting community posts:', error);
      throw error;
    }
  },

  // Like community post
  likeCommunityPost: async (postId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('community_post_likes')
        .insert({ post_id: postId });

      if (error) throw error;

      // Update likes count
      await supabase.rpc('increment_story_likes_count', {
        p_story_id: postId
      });

      return true;
    } catch (error) {
      console.error('Error liking community post:', error);
      return false;
    }
  },

  // Unlike community post
  unlikeCommunityPost: async (postId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;

      // Update likes count
      await supabase.rpc('decrement_story_likes_count', {
        p_story_id: postId
      });

      return true;
    } catch (error) {
      console.error('Error unliking community post:', error);
      return false;
    }
  },

  // ==============================================
  // COMMUNITY POST COMMENTS
  // ==============================================

  // Create community post comment
  createCommunityPostComment: async (
    postId: number,
    content: string,
    parentCommentId?: number
  ): Promise<CommunityPostComment> => {
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .insert({
          post_id: postId,
          content,
          parent_comment_id: parentCommentId
        })
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update comments count
      await supabase
        .from('community_posts')
        .update({ comments_count: supabase.raw('comments_count + 1') })
        .eq('id', postId);

      toast.success('Comment added successfully');
      return data;
    } catch (error) {
      console.error('Error creating community post comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  },

  // Get community post comments
  getCommunityPostComments: async (postId: number): Promise<CommunityPostComment[]> => {
    try {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting community post comments:', error);
      throw error;
    }
  },

  // ==============================================
  // TRENDING CONTENT
  // ==============================================

  // Get trending content
  getTrendingContent: async (
    contentType: string = 'all',
    limit: number = 20
  ): Promise<TrendingContent[]> => {
    try {
      const { data, error } = await supabase.rpc('get_trending_content', {
        p_content_type: contentType,
        p_limit: limit
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting trending content:', error);
      throw error;
    }
  },

  // Get "What Went Down" content
  getWhatWentDownContent: async (hoursBack: number = 24): Promise<any[]> => {
    try {
      const { data, error } = await supabase.rpc('get_what_went_down_content', {
        p_hours_back: hoursBack
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting what went down content:', error);
      throw error;
    }
  },

  // ==============================================
  // EVENT TEASERS
  // ==============================================

  // Get upcoming event teasers
  getUpcomingTeasers: async (daysAhead: number = 30): Promise<EventTeaser[]> => {
    try {
      const { data, error } = await supabase.rpc('get_upcoming_teasers', {
        p_days_ahead: daysAhead
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting upcoming teasers:', error);
      throw error;
    }
  },

  // Create event teaser
  createEventTeaser: async (
    eventId: number,
    title: string,
    description: string,
    mediaUrl: string,
    mediaType: string,
    teaserType: string,
    releaseDate?: string
  ): Promise<EventTeaser> => {
    try {
      const { data, error } = await supabase
        .from('event_teasers')
        .insert({
          event_id: eventId,
          title,
          description,
          media_url: mediaUrl,
          media_type: mediaType,
          teaser_type: teaserType,
          release_date: releaseDate
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Event teaser created successfully');
      return data;
    } catch (error) {
      console.error('Error creating event teaser:', error);
      toast.error('Failed to create event teaser');
      throw error;
    }
  },

  // ==============================================
  // FEATURED CREATORS
  // ==============================================

  // Get featured creators
  getFeaturedCreators: async (): Promise<FeaturedCreator[]> => {
    try {
      const { data, error } = await supabase.rpc('get_featured_creators');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting featured creators:', error);
      throw error;
    }
  },

  // ==============================================
  // LOCAL TIPS
  // ==============================================

  // Create local tip
  createLocalTip: async (
    title: string,
    content: string,
    tipType: string,
    mediaUrl?: string,
    mediaType?: string,
    location?: string,
    tags?: string[]
  ): Promise<LocalTip> => {
    try {
      const { data, error } = await supabase
        .from('local_tips')
        .insert({
          title,
          content,
          tip_type: tipType,
          media_url: mediaUrl,
          media_type: mediaType,
          location,
          tags: tags || []
        })
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      toast.success('Local tip created successfully');
      return data;
    } catch (error) {
      console.error('Error creating local tip:', error);
      toast.error('Failed to create local tip');
      throw error;
    }
  },

  // Get local tips
  getLocalTips: async (
    tipType?: string,
    limit: number = 20
  ): Promise<LocalTip[]> => {
    try {
      let query = supabase
        .from('local_tips')
        .select(`
          *,
          profiles:user_id(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tipType) {
        query = query.eq('tip_type', tipType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting local tips:', error);
      throw error;
    }
  },

  // ==============================================
  // ENGAGEMENT TRACKING
  // ==============================================

  // Track user engagement
  trackEngagement: async (
    contentType: string,
    contentId: number,
    engagementType: string,
    metadata?: any
  ): Promise<void> => {
    try {
      await supabase.rpc('track_engagement', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_engagement_type: engagementType,
        p_metadata: metadata
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  },

  // Get user engagement stats
  getUserEngagementStats: async (userId?: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      throw error;
    }
  }
};

