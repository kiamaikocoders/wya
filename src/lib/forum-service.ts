
import { apiClient } from "./api-client";

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
}

// Forum service
export const forumService = {
  // Get all forum posts
  getAllPosts: async (): Promise<ForumPost[]> => {
    return apiClient.get<ForumPost[]>(FORUM_ENDPOINTS.ALL);
  },

  // Get posts by event ID
  getPostsByEventId: async (eventId: number): Promise<ForumPost[]> => {
    const allPosts = await apiClient.get<ForumPost[]>(FORUM_ENDPOINTS.ALL);
    return allPosts.filter(post => post.event_id === eventId);
  },

  // Get post by ID
  getPostById: async (id: number): Promise<ForumPost> => {
    return apiClient.get<ForumPost>(FORUM_ENDPOINTS.SINGLE(id));
  },

  // Create a new post
  createPost: async (postData: CreateForumPostDto): Promise<ForumPost> => {
    return apiClient.post<ForumPost>(FORUM_ENDPOINTS.ALL, postData);
  },

  // Update post
  updatePost: async (id: number, postData: UpdateForumPostDto): Promise<ForumPost> => {
    return apiClient.patch<ForumPost>(FORUM_ENDPOINTS.SINGLE(id), postData);
  },

  // Delete post
  deletePost: async (id: number): Promise<void> => {
    return apiClient.delete<void>(FORUM_ENDPOINTS.SINGLE(id));
  },

  // Get comments for a post
  getComments: async (postId: number): Promise<ForumComment[]> => {
    return apiClient.get<ForumComment[]>(FORUM_ENDPOINTS.COMMENTS(postId));
  },

  // Create a comment
  createComment: async (commentData: CreateCommentDto): Promise<ForumComment> => {
    return apiClient.post<ForumComment>(FORUM_ENDPOINTS.COMMENTS(commentData.post_id), commentData);
  },

  // Delete a comment
  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    return apiClient.delete<void>(`${FORUM_ENDPOINTS.COMMENTS(postId)}/${commentId}`);
  },
};
