
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { Story, CreateStoryDto, UpdateStoryDto } from './types';
import { mockStories } from './mock-data';

export const storyService = {
  // Get all stories
  getAllStories: async (): Promise<Story[]> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data.map(item => ({
          ...item,
          user_name: item.profiles?.username || '',
          user_image: item.profiles?.avatar_url || ''
        }));
      }
      
      // Return mock data if no real data exists
      return mockStories;
    } catch (error) {
      console.error('Error fetching all stories:', error);
      // Return mock data on error for development
      return mockStories;
    }
  },
  
  // Get all stories for an event
  getEventStories: async (eventId: number): Promise<Story[]> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data.map(item => ({
          ...item,
          user_name: item.profiles?.username || '',
          user_image: item.profiles?.avatar_url || ''
        }));
      }
      
      // Return filtered mock data if no real data exists
      return mockStories.filter(story => story.event_id === eventId);
    } catch (error) {
      console.error('Error fetching event stories:', error);
      // Return filtered mock data on error
      return mockStories.filter(story => story.event_id === eventId);
    }
  },
  
  // Get stories by event ID (alias for getEventStories for compatibility)
  getStoriesByEventId: async (eventId: number): Promise<Story[]> => {
    return storyService.getEventStories(eventId);
  },
  
  // Get story by ID
  getStoryById: async (id: number): Promise<Story> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        user_name: data.profiles?.username || '',
        user_image: data.profiles?.avatar_url || ''
      };
    } catch (error) {
      console.error('Error fetching story:', error);
      // Return mock story on error
      const mockStory = mockStories.find(story => story.id === id);
      if (!mockStory) throw new Error(`Story with ID ${id} not found`);
      return mockStory;
    }
  },
  
  // Create a new story
  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a story');
      
      const { event_id, content, media_url } = storyData;
      
      // Prepare story data for database
      const newStory = {
        user_id: user.id,
        event_id,
        caption: content,
        content,
        media_url: media_url || null,
        media_type: 'image' as const // Default to image
      };
      
      const { data, error } = await supabase
        .from('stories')
        .insert(newStory)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Story created successfully!');
      return data as Story;
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
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Story deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete story';
      toast.error(errorMessage);
      throw error;
    }
  }
};
