
import { supabase } from '../supabase';
import { toast } from 'sonner';

export interface Story {
  id: number;
  user_id: string;
  event_id: number;
  caption: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_name?: string;
  user_image?: string;
  content?: string;
  has_liked?: boolean;
}

export const storyService = {
  // Get all stories
  getAllStories: async (): Promise<Story[]> => {
    try {
      console.log("Attempting to fetch all stories");
      // We need to create stories table first
      return []; // Return empty array until we create the stories table
    } catch (error) {
      console.error('Error fetching all stories:', error);
      throw error;
    }
  },
  
  // Get all stories for an event
  getEventStories: async (eventId: number): Promise<Story[]> => {
    try {
      // We need to create stories table first
      console.log("Attempting to fetch stories for event:", eventId);
      return []; // Return empty array until we create the stories table
    } catch (error) {
      console.error('Error fetching event stories:', error);
      throw error;
    }
  },
  
  // Get stories by event ID (alias for getEventStories for compatibility)
  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    return storyService.getEventStories(eventId);
  },
  
  // Get story by ID
  getStoryById: async (id: number): Promise<Story> => {
    try {
      // We need to create stories table first
      console.log("Attempting to fetch story by ID:", id);
      throw new Error('Stories feature not implemented yet');
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  },
  
  // Create a new story
  createStory: async (storyData: {
    event_id: number;
    content: string;
    media_url?: string;
  }): Promise<Story> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a story');
      
      const { content, media_url, event_id } = storyData;
      
      // Convert from CreateStoryDto to what the interface expects
      const newStory = {
        user_id: user.id,
        event_id,
        caption: content, // Map content to caption
        content: content, // Keep content for compatibility
        media_url: media_url || '',
        media_type: 'image' as const // Default to image
      };
      
      // We need to create stories table first
      console.log("Attempting to create story:", newStory);
      toast.error('Stories feature not implemented yet');
      throw new Error('Stories feature not implemented yet');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete a story
  deleteStory: async (id: number): Promise<void> => {
    try {
      // Get the current user to verify ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to delete a story');
      
      // We need to create stories table first
      console.log("Attempting to delete story:", id);
      toast.error('Stories feature not implemented yet');
      throw new Error('Stories feature not implemented yet');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete story';
      toast.error(errorMessage);
      throw error;
    }
  }
};
