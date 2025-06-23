
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
      // Get posts with user profiles joined
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id(id, full_name, avatar_url, username)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching forum posts:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
      
      // Transform the data to match our ForumPost interface
      const formattedPosts = (data || []).map(post => {
        const profiles = post.profiles as any;
        return {
          ...post,
          user: profiles ? {
            id: profiles.id,
            name: profiles.full_name || profiles.username,
            avatar_url: profiles.avatar_url,
            username: profiles.username
          } : undefined,
          user_name: profiles ? (profiles.full_name || profiles.username) : 'Anonymous',
          user_image: profiles ? profiles.avatar_url : undefined
        } as ForumPost;
      });
      
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },
  
  // Get single forum post by ID
  getPostById: async (id: number): Promise<ForumPost | null> => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id(id, full_name, avatar_url, username)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching forum post:', error);
        return null;
      }
      
      // Transform the data to match our ForumPost interface
      const profiles = data.profiles as any;
      const formattedPost = {
        ...data,
        user: profiles ? {
          id: profiles.id,
          name: profiles.full_name || profiles.username,
          avatar_url: profiles.avatar_url,
          username: profiles.username
        } : undefined,
        user_name: profiles ? (profiles.full_name || profiles.username) : 'Anonymous',
        user_image: profiles ? profiles.avatar_url : undefined
      } as ForumPost;
      
      return formattedPost;
    } catch (error) {
      console.error(`Error fetching post #${id}:`, error);
      return null;
    }
  },
  
  // Create new forum post
  createPost: async (postData: CreateForumPostDto): Promise<ForumPost | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a post');
        return null;
      }
      
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
      
      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return null;
      }
      
      return data as ForumPost;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return null;
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
      
      if (post?.user_id !== user.id) {
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
          profiles:user_id(id, full_name, avatar_url, username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      
      // Transform the data to match our ForumComment interface
      const formattedComments = (data || []).map(comment => {
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
      return [];
    }
  },
  
  // For compatibility with existing code
  getComments: async (postId: number): Promise<ForumComment[]> => {
    return forumService.getCommentsByPostId(postId);
  },
  
  // Add a comment to a post
  createComment: async (commentData: CreateCommentDto): Promise<ForumComment | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to comment');
        return null;
      }
      
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
      
      if (error) {
        console.error('Error creating comment:', error);
        toast.error('Failed to create comment');
        return null;
      }
      
      return data as ForumComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      return null;
    }
  }
};
