
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  user_id: string;
  event_id?: number;
  created_at: string;
  updated_at?: string;
  media_url?: string;
  likes_count?: number;
  views_count?: number;
  comments_count?: number;
  category?: string;
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
    username?: string;
  };
  user_name?: string;
  user_image?: string;
}

export interface ForumComment {
  id: number;
  content: string;
  user_id: string;
  post_id: number;
  created_at: string;
  updated_at?: string;
  media_url?: string;
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
    username?: string;
  };
  user_name?: string;
  user_image?: string;
}

export interface CreateForumPostDto {
  title: string;
  content: string;
  event_id?: number;
  media_url?: string;
}

export interface CreateCommentDto {
  content: string;
  post_id: number;
  media_url?: string;
}

export const forumService = {
  // Get all forum posts
  getAllPosts: async (): Promise<ForumPost[]> => {
    try {
      // Get posts first
      const { data: posts, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Get user profiles for all posts
      const userIds = [...new Set(posts.map(post => post.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user profiles
      const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      // Transform the data to match our ForumPost interface
      const formattedPosts = posts.map(post => {
        const profile = profilesMap.get(post.user_id);
        return {
          ...post,
          user: profile ? {
            id: profile.id,
            name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url,
            username: profile.username
          } : undefined,
          user_name: profile ? (profile.full_name || profile.username) : 'Anonymous',
          user_image: profile ? profile.avatar_url : undefined
        } as ForumPost;
      });
      
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw new Error('Failed to fetch forum posts');
    }
  },
  
  // Get single forum post by ID
  getPostById: async (id: number): Promise<ForumPost> => {
    try {
      // Get post first
      const { data: post, error: postError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', post.user_id)
        .single();
      
      if (profileError) {
        console.warn('Profile not found for user:', post.user_id);
      }
      
      // Transform the data to match our ForumPost interface
      const formattedPost = {
        ...post,
        user: profile ? {
          id: profile.id,
          name: profile.full_name || profile.username,
          avatar_url: profile.avatar_url,
          username: profile.username
        } : undefined,
        user_name: profile ? (profile.full_name || profile.username) : 'Anonymous',
        user_image: profile ? profile.avatar_url : undefined
      } as ForumPost;
      
      return formattedPost;
    } catch (error) {
      console.error(`Error fetching post #${id}:`, error);
      throw new Error(`Failed to fetch post #${id}`);
    }
  },
  
  // Create new forum post
  createPost: async (postData: CreateForumPostDto): Promise<ForumPost> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a post');
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          title: postData.title,
          content: postData.content,
          event_id: postData.event_id,
          media_url: postData.media_url,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data as ForumPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  },
  
  // Like a forum post
  likePost: async (postId: number): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to like posts');

      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('forum_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        toast.info('You already liked this post');
        return false;
      }

      // Insert like
      const { error: likeError } = await supabase
        .from('forum_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (likeError) throw likeError;

      // Update likes count by fetching current count and incrementing
      const { data: currentPost, error: fetchError } = await supabase
        .from('forum_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const { error: countError } = await supabase
        .from('forum_posts')
        .update({ likes_count: (currentPost.likes_count || 0) + 1 })
        .eq('id', postId);

      if (countError) throw countError;

      toast.success('Post liked successfully');
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      return false;
    }
  },

  // Unlike a forum post
  unlikePost: async (postId: number): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to unlike posts');

      // Delete like
      const { error: likeError } = await supabase
        .from('forum_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (likeError) throw likeError;

      // Update likes count by fetching current count and decrementing
      const { data: currentPost, error: fetchError } = await supabase
        .from('forum_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const { error: countError } = await supabase
        .from('forum_posts')
        .update({ likes_count: Math.max((currentPost.likes_count || 0) - 1, 0) })
        .eq('id', postId);

      if (countError) throw countError;

      toast.success('Post unliked successfully');
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      toast.error('Failed to unlike post');
      return false;
    }
  },

  // Increment post views
  incrementViews: async (postId: number): Promise<void> => {
    try {
      await supabase.rpc('increment_forum_post_views', {
        p_post_id: postId
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  // Get forum post comments
  getPostComments: async (postId: number): Promise<ForumComment[]> => {
    try {
      // Get comments first
      const { data: comments, error: commentsError } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get user profiles for all comments
      const userIds = [...new Set(comments.map(comment => comment.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of user profiles
      const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      // Transform the data to match our ForumComment interface
      const formattedComments = comments.map(comment => {
        const profile = profilesMap.get(comment.user_id);
        return {
          ...comment,
          user: profile ? {
            id: profile.id,
            name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url,
            username: profile.username
          } : undefined,
          user_name: profile ? (profile.full_name || profile.username) : 'Anonymous',
          user_image: profile ? profile.avatar_url : undefined
        } as ForumComment;
      });

      return formattedComments;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  },

  // Create forum post comment
  createComment: async (postId: number, commentData: CreateCommentDto): Promise<ForumComment> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a comment');

      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          content: commentData.content,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update comments count
      await supabase
        .from('forum_posts')
        .update({ comments_count: supabase.raw('comments_count + 1') })
        .eq('id', postId);

      toast.success('Comment added successfully');
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      throw error;
    }
  },

  // Delete a forum post
  deletePost: async (postId: number): Promise<void> => {
    try {
      // Check if the user is the post owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to delete a post');
      
      const { data: post } = await supabase
        .from('forum_posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (post.user_id !== user.id) {
        throw new Error('You can only delete your own posts');
      }
      
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting post #${postId}:`, error);
      throw error;
    }
  },
  
  // Get comments for a post
  getCommentsByPostId: async (postId: number): Promise<ForumComment[]> => {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match our ForumComment interface
      const formattedComments = data.map(comment => {
        const profiles = comment.profiles as any;
        return {
          ...comment,
          user: profiles ? {
            id: profiles.id,
            name: profiles.full_name || profiles.username,
            avatar_url: profiles.avatar_url,
            username: profiles.username
          } : undefined,
          user_name: profiles ? (profiles.full_name || profiles.username) : 'Anonymous',
          user_image: profiles ? profiles.avatar_url : undefined
        } as ForumComment;
      });
      
      return formattedComments;
    } catch (error) {
      console.error(`Error fetching comments for post #${postId}:`, error);
      throw new Error(`Failed to fetch comments for post #${postId}`);
    }
  },
  
  // For compatibility with existing code
  getComments: async (postId: number): Promise<ForumComment[]> => {
    return forumService.getCommentsByPostId(postId);
  },
  
  // Add a comment to a post
  createComment: async (commentData: CreateCommentDto): Promise<ForumComment> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to comment');
      
      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          content: commentData.content,
          post_id: commentData.post_id,
          media_url: commentData.media_url,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data as ForumComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }
};
