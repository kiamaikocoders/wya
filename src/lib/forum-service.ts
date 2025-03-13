
import { apiClient } from "./api-client";
import { toast } from 'sonner';

// Define the API endpoint for forum
const FORUM_ENDPOINTS = {
  ALL: `${apiClient.XANO_EVENT_API_URL}/forum`,
  SINGLE: (id: number) => `${apiClient.XANO_EVENT_API_URL}/forum/${id}`,
  COMMENTS: (postId: number) => `${apiClient.XANO_EVENT_API_URL}/forum/${postId}/comments`,
};

// Forum post interfaces
export interface ForumPost {
  id: number;
  user_id: number;
  event_id: number;
  title: string;
  content: string;
  media_url?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_image?: string;
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
}

export interface ForumComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  media_url?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_image?: string;
}

export interface CreateForumPostDto {
  event_id: number;
  title: string;
  content: string;
  media_url?: string;
}

export interface UpdateForumPostDto {
  title?: string;
  content?: string;
  media_url?: string;
}

export interface CreateCommentDto {
  post_id: number;
  content: string;
  media_url?: string;
}

// Forum service
export const forumService = {
  // Get all forum posts
  getAllPosts: async (): Promise<ForumPost[]> => {
    try {
      return await apiClient.get<ForumPost[]>(FORUM_ENDPOINTS.ALL);
    } catch (error) {
      // Check if the error is a 404 (endpoint not found)
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Forum API endpoint not available. Returning empty array.');
        return [];
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch forum posts';
      toast.error(errorMessage);
      console.error('Error fetching forum posts:', error);
      return [];
    }
  },

  // Get posts by event ID
  getPostsByEventId: async (eventId: number): Promise<ForumPost[]> => {
    try {
      const allPosts = await forumService.getAllPosts();
      return allPosts.filter(post => post.event_id === eventId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch posts for event #${eventId}`;
      toast.error(errorMessage);
      return [];
    }
  },

  // Get post by ID
  getPostById: async (id: number): Promise<ForumPost> => {
    try {
      return await apiClient.get<ForumPost>(FORUM_ENDPOINTS.SINGLE(id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch post #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData: CreateForumPostDto): Promise<ForumPost> => {
    try {
      console.log('Creating post with data:', postData);
      // Validate post data
      if (!postData.event_id) {
        throw new Error('Event ID is required');
      }
      if (!postData.title || !postData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!postData.content || !postData.content.trim()) {
        throw new Error('Content is required');
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('You must be logged in to create a post');
      }
      
      // Check if the endpoint exists before trying to create a post
      try {
        // Try to fetch posts first to check if endpoint exists
        await apiClient.get<ForumPost[]>(FORUM_ENDPOINTS.ALL);
      } catch (endpointError) {
        if (endpointError instanceof Error && endpointError.message.includes('404')) {
          console.error('Forum endpoint not available', endpointError);
          throw new Error('The forum feature is not available at this time. Please try again later.');
        }
      }
      
      const result = await apiClient.post<ForumPost>(FORUM_ENDPOINTS.ALL, postData);
      console.log('Post created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Update post
  updatePost: async (id: number, postData: UpdateForumPostDto): Promise<ForumPost> => {
    try {
      return await apiClient.patch<ForumPost>(FORUM_ENDPOINTS.SINGLE(id), postData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update post #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    try {
      return await apiClient.delete<void>(FORUM_ENDPOINTS.SINGLE(id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete post #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get comments for a post
  getComments: async (postId: number): Promise<ForumComment[]> => {
    try {
      return await apiClient.get<ForumComment[]>(FORUM_ENDPOINTS.COMMENTS(postId));
    } catch (error) {
      // Check if it's a 404 error (endpoint not found)
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Comments endpoint not available. Returning empty array.');
        return [];
      }
      
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch comments for post #${postId}`;
      toast.error(errorMessage);
      return [];
    }
  },

  // Create a comment
  createComment: async (commentData: CreateCommentDto): Promise<ForumComment> => {
    try {
      // Check if comments endpoint exists before trying to create
      try {
        await apiClient.get<ForumComment[]>(FORUM_ENDPOINTS.COMMENTS(commentData.post_id));
      } catch (endpointError) {
        if (endpointError instanceof Error && endpointError.message.includes('404')) {
          console.error('Comments endpoint not available', endpointError);
          throw new Error('The commenting feature is not available at this time. Please try again later.');
        }
      }
      
      return await apiClient.post<ForumComment>(FORUM_ENDPOINTS.COMMENTS(commentData.post_id), commentData);
    } catch (error) {
      console.error('Error creating comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create comment';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    try {
      return await apiClient.delete<void>(`${FORUM_ENDPOINTS.COMMENTS(postId)}/${commentId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete comment #${commentId}`;
      toast.error(errorMessage);
      throw error;
    }
  },
};
