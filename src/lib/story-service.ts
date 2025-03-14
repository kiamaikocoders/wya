
import { apiClient, STORY_ENDPOINTS } from "./api-client";
import { toast } from 'sonner';

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

// Helper function to check if endpoint exists
const checkEndpointAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error(`Endpoint ${url} check failed:`, error);
    return false;
  }
};

// Sample stories for development
const SAMPLE_STORIES: Story[] = [
  {
    id: 1,
    user_id: 1,
    event_id: 1,
    content: "Having an amazing time at the Trade Fair!",
    media_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_name: "John Doe",
    user_image: "https://randomuser.me/api/portraits/men/1.jpg",
    likes_count: 24,
    comments_count: 5,
    has_liked: false
  },
  {
    id: 2,
    user_id: 2,
    event_id: 2,
    content: "Cultural festival was absolutely mind-blowing!",
    media_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2074",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_name: "Mary Smith",
    user_image: "https://randomuser.me/api/portraits/women/2.jpg",
    likes_count: 42,
    comments_count: 7,
    has_liked: true
  },
  {
    id: 3,
    user_id: 3,
    event_id: 5,
    content: "Best New Year's ever at Kilifi Festival!",
    media_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    user_name: "Alex Johnson",
    user_image: "https://randomuser.me/api/portraits/men/3.jpg",
    likes_count: 67,
    comments_count: 12,
    has_liked: false
  }
];

// Story service
export const storyService = {
  // Get all stories
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

  // Get stories by event ID
  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    try {
      const allStories = await storyService.getAllStories();
      return allStories.filter(story => story.event_id === eventId);
    } catch (error) {
      console.error('Error filtering stories by event:', error);
      return [];
    }
  },

  // Get story by ID
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

  // Create a new story
  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      const endpointExists = await checkEndpointAvailability(STORY_ENDPOINTS.ALL);
      if (!endpointExists) {
        console.log('Story creation API not available, using mock response');
        const newId = SAMPLE_STORIES.length + 1;
        const newStory: Story = {
          id: newId,
          user_id: 1, // Current user
          event_id: storyData.event_id,
          content: storyData.content,
          media_url: storyData.media_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: "Current User",
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

  // Update story
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

  // Delete story
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
  
  // Like a story (mock implementation)
  likeStory: async (id: number): Promise<void> => {
    try {
      const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
      if (storyIndex !== -1) {
        if (!SAMPLE_STORIES[storyIndex].has_liked) {
          SAMPLE_STORIES[storyIndex].likes_count = (SAMPLE_STORIES[storyIndex].likes_count || 0) + 1;
          SAMPLE_STORIES[storyIndex].has_liked = true;
        }
      }
      
      // If API were available, would make a real request
      toast.success('Story liked!');
    } catch (error) {
      console.error('Error liking story:', error);
    }
  },
  
  // Unlike a story (mock implementation)
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
