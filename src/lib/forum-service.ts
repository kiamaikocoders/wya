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
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
    username?: string;
  };
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
      // Get posts with user profiles joined using JOIN syntax
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our ForumPost interface
      const formattedPosts = data.map(post => ({
        ...post,
        user: post.profiles ? {
          id: post.profiles.id,
          name: post.profiles.full_name || post.profiles.username,
          avatar_url: post.profiles.avatar_url,
          username: post.profiles.username
        } : undefined
      }));
      
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw new Error('Failed to fetch forum posts');
    }
  },
  
  // Get single forum post by ID
  getPostById: async (id: number): Promise<ForumPost> => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Transform the data to match our ForumPost interface
      const formattedPost = {
        ...data,
        user: data.profiles ? {
          id: data.profiles.id,
          name: data.profiles.full_name || data.profiles.username,
          avatar_url: data.profiles.avatar_url,
          username: data.profiles.username
        } : undefined
      };
      
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
      
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
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
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match our ForumComment interface
      const formattedComments = data.map(comment => ({
        ...comment,
        user: comment.profiles ? {
          id: comment.profiles.id,
          name: comment.profiles.full_name || comment.profiles.username,
          avatar_url: comment.profiles.avatar_url,
          username: comment.profiles.username
        } : undefined
      }));
      
      return formattedComments;
    } catch (error) {
      console.error(`Error fetching comments for post #${postId}:`, error);
      throw new Error(`Failed to fetch comments for post #${postId}`);
    }
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
      
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }
};
