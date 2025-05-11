
import { supabase } from '../supabase';
import { toast } from 'sonner';
import type { Story, CreateStoryDto, UpdateStoryDto } from './types';
import { SAMPLE_STORIES } from './mock-data';

export const storyService = {
  getAllStories: async (): Promise<Story[]> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, return sample data
      return SAMPLE_STORIES;
    } catch (error) {
      console.warn('Error fetching stories, using sample data:', error);
      return SAMPLE_STORIES;
    }
  },

  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, filter sample data
      return SAMPLE_STORIES.filter(story => story.event_id === eventId);
    } catch (error) {
      console.error('Error filtering stories by event:', error);
      return [];
    }
  },

  getStoryById: async (id: number): Promise<Story> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, find in sample data
      const story = SAMPLE_STORIES.find(s => s.id === id);
      if (story) {
        return story;
      }
      throw new Error(`Story with ID ${id} not found`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, create in sample data
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const newId = SAMPLE_STORIES.length + 1;
      const newStory: Story = {
        id: newId,
        user_id: parseInt(user.id),
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
      toast.success('Story created successfully');
      return newStory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      toast.error(errorMessage);
      throw error;
    }
  },

  updateStory: async (id: number, storyData: UpdateStoryDto): Promise<Story> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, update in sample data
      const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
      if (storyIndex === -1) {
        throw new Error(`Story with ID ${id} not found`);
      }
      
      SAMPLE_STORIES[storyIndex] = {
        ...SAMPLE_STORIES[storyIndex],
        ...storyData,
        updated_at: new Date().toISOString()
      };
      
      toast.success('Story updated successfully');
      return SAMPLE_STORIES[storyIndex];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteStory: async (id: number): Promise<void> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, delete from sample data
      const storyIndex = SAMPLE_STORIES.findIndex(s => s.id === id);
      if (storyIndex === -1) {
        throw new Error(`Story with ID ${id} not found`);
      }
      
      SAMPLE_STORIES.splice(storyIndex, 1);
      toast.success('Story deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  likeStory: async (id: number): Promise<void> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, update in sample data
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
      toast.error('Failed to like story');
    }
  },
  
  unlikeStory: async (id: number): Promise<void> => {
    try {
      // We'll implement this properly once we have the stories table in Supabase
      // For now, update in sample data
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
      toast.error('Failed to unlike story');
    }
  }
};

export type { Story, CreateStoryDto, UpdateStoryDto };
