
import { apiClient, STORY_ENDPOINTS } from "./api-client";

// Story interfaces
export interface Story {
  id: number;
  user_id: number;
  event_id: number;
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

export interface CreateStoryDto {
  event_id: number;
  content: string;
  media_url?: string;
}

export interface UpdateStoryDto {
  content?: string;
  media_url?: string;
}

// Story service
export const storyService = {
  // Get all stories
  getAllStories: async (): Promise<Story[]> => {
    return apiClient.get<Story[]>(STORY_ENDPOINTS.ALL);
  },

  // Get stories by event ID
  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    const allStories = await apiClient.get<Story[]>(STORY_ENDPOINTS.ALL);
    return allStories.filter(story => story.event_id === eventId);
  },

  // Get story by ID
  getStoryById: async (id: number): Promise<Story> => {
    return apiClient.get<Story>(STORY_ENDPOINTS.SINGLE(id));
  },

  // Create a new story
  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    return apiClient.post<Story>(STORY_ENDPOINTS.ALL, storyData);
  },

  // Update story
  updateStory: async (id: number, storyData: UpdateStoryDto): Promise<Story> => {
    return apiClient.patch<Story>(STORY_ENDPOINTS.SINGLE(id), storyData);
  },

  // Delete story
  deleteStory: async (id: number): Promise<void> => {
    return apiClient.delete<void>(STORY_ENDPOINTS.SINGLE(id));
  },
};
