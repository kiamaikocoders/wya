
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
}

export const storyService = {
  // Get all stories for an event
  getEventStories: async (eventId: number): Promise<Story[]> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Story[];
    } catch (error) {
      console.error('Error fetching event stories:', error);
      throw error;
    }
  },
  
  // Get story by ID
  getStoryById: async (id: number): Promise<Story> => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Story;
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  },
  
  // Create a new story
  createStory: async (storyData: Omit<Story, 'id' | 'created_at' | 'likes_count' | 'comments_count'>): Promise<Story> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a story');
      
      const { data, error } = await supabase
        .from('stories')
        .insert({ ...storyData, user_id: user.id })
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
      
      // First get the story to check ownership
      const { data: story, error: fetchError } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (story.user_id !== user.id) {
        throw new Error('You can only delete your own stories');
      }
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Story deleted successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete story';
      toast.error(errorMessage);
      throw error;
    }
  }
};
