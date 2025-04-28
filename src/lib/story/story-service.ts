
import { apiClient } from '../api-client';
import { toast } from 'sonner';
import type { Story, CreateStoryDto, UpdateStoryDto } from './types';
import { SAMPLE_STORIES } from './mock-data';
import { checkEndpointAvailability } from './endpoint-checker';

// Define story endpoints
const STORY_ENDPOINTS = {
  ALL: '/stories',
  SINGLE: (id: number) => `/stories/${id}`
};

export const storyService = {
  getAllStories: async (): Promise<Story[]> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.ALL);
      if (!endpointExists) {
        console.log('Stories API not available, using sample data');
        return SAMPLE_STORIES;
      }
      
      return await apiClient.get<Story[]>(STORY_ENDPOINTS.ALL);
    } catch (error) {
      console.warn('Error fetching stories, using sample data:', error);
      return SAMPLE_STORIES;
    }
  },

  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    try {
      const allStories = await storyService.getAllStories();
      return allStories.filter(story => story.event_id === eventId);
    } catch (error) {
      console.error('Error filtering stories by event:', error);
      return [];
    }
  },

  getStoryById: async (id: number): Promise<Story> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.SINGLE(id));
      if (!endpointExists) {
        const story = SAMPLE_STORIES.find(s => s.id === id);
        if (story) {
          return story;
        }
        throw new Error(`Story with ID ${id} not found`);
      }
      
      return await apiClient.get<Story>(STORY_ENDPOINTS.SINGLE(id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.ALL);
      if (!endpointExists) {
        const newId = SAMPLE_STORIES.length + 1;
        const newStory: Story = {
          id: newId,
          user_id: 1,
          event_id: storyData.event_id,
          content: storyData.content,
          media_url: storyData.media_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: "Current User",
          user_image: undefined,
          likes_count: 0,
          comments_count: 0,
          has_liked: false
        };
        
        SAMPLE_STORIES.push(newStory);
        return newStory;
      }
      
      return await apiClient.post<Story>(STORY_ENDPOINTS.ALL, storyData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      toast.error(errorMessage);
      throw error;
    }
  },

  updateStory: async (id: number, storyData: UpdateStoryDto): Promise<Story> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.SINGLE(id));
      if (!endpointExists) {
        const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
        if (storyIndex === -1) {
          throw new Error(`Story with ID ${id} not found`);
        }
        
        SAMPLE_STORIES[storyIndex] = {
          ...SAMPLE_STORIES[storyIndex],
          ...storyData,
          updated_at: new Date().toISOString()
        };
        
        return SAMPLE_STORIES[storyIndex];
      }
      
      return await apiClient.patch<Story>(STORY_ENDPOINTS.SINGLE(id), storyData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteStory: async (id: number): Promise<void> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.SINGLE(id));
      if (!endpointExists) {
        const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
        if (storyIndex === -1) {
          throw new Error(`Story with ID ${id} not found`);
        }
        
        SAMPLE_STORIES.splice(storyIndex, 1);
        return;
      }
      
      return await apiClient.delete<void>(STORY_ENDPOINTS.SINGLE(id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  likeStory: async (id: number): Promise<void> => {
    try {
      const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
      if (storyIndex !== -1) {
        if (!SAMPLE_STORIES[storyIndex].has_liked) {
          SAMPLE_STORIES[storyIndex].likes_count = (SAMPLE_STORIES[storyIndex].likes_count || 0) + 1;
          SAMPLE_STORIES[storyIndex].has_liked = true;
        }
      }
      
      toast.success('Story liked!');
    } catch (error) {
      console.error('Error liking story:', error);
    }
  },
  
  unlikeStory: async (id: number): Promise<void> => {
    try {
      const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
      if (storyIndex !== -1) {
        if (SAMPLE_STORIES[storyIndex].has_liked) {
          SAMPLE_STORIES[storyIndex].likes_count = Math.max(0, (SAMPLE_STORIES[storyIndex].likes_count || 1) - 1);
          SAMPLE_STORIES[storyIndex].has_liked = false;
        }
      }
      
      toast.success('Story unliked');
    } catch (error) {
      console.error('Error unliking story:', error);
    }
  }
};

export type { Story, CreateStoryDto, UpdateStoryDto };
