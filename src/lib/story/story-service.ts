
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { Story, CreateStoryDto } from './types';
import { mockStories } from './mock-data';

// Story service methods
export const storyService = {
  // Get stories for an event
  getEventStories: async (eventId: number): Promise<Story[]> => {
    try {
      // For now, use mock data while waiting for a stories table to be created
      return mockStories.filter(story => story.event_id === eventId);
      
      // Once the stories table is created, uncomment the code below
      /*
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.username || 'Anonymous',
        user_image: item.profiles?.avatar_url || ''
      }));
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch stories for event #${eventId}`;
      toast.error(errorMessage);
      return [];
    }
  },
  
  // Get all stories
  getAllStories: async (): Promise<Story[]> => {
    try {
      // For now, use mock data
      return mockStories;
      
      // Once the stories table is created, uncomment the code below
      /*
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.username || 'Anonymous',
        user_image: item.profiles?.avatar_url || ''
      }));
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stories';
      toast.error(errorMessage);
      return [];
    }
  },
  
  // Get story by ID
  getStoryById: async (id: number): Promise<Story> => {
    try {
      // For now, use mock data
      const story = mockStories.find(story => story.id === id);
      if (!story) throw new Error(`Story #${id} not found`);
      return story;
      
      // Once the stories table is created, uncomment the code below
      /*
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        user_name: data.profiles?.username || 'Anonymous',
        user_image: data.profiles?.avatar_url || ''
      };
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Create story
  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      // For now, create a mock story (we'll implement actual creation once the tables are set up)
      const newStory: Story = {
        id: Math.max(...mockStories.map(s => s.id)) + 1,
        user_id: '1', // Replace with actual user ID once authentication is set up
        event_id: storyData.event_id,
        content: storyData.content || '',
        caption: storyData.content || '',
        media_url: storyData.media_url || '',
        media_type: 'image',
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        user_name: 'Current User',
        user_image: 'https://randomuser.me/api/portraits/men/32.jpg'
      };
      
      // Add to mock stories
      mockStories.push(newStory);
      
      toast.success('Story shared successfully!');
      return newStory;
      
      // Once the stories table is created, uncomment the code below
      /*
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to share a story');
      
      const newStory = {
        user_id: user.id,
        event_id: storyData.event_id,
        caption: storyData.content,
        content: storyData.content,
        media_url: storyData.media_url,
        media_type: 'image',
        likes_count: 0,
        comments_count: 0
      };
      
      const { data, error } = await supabase
        .from('stories')
        .insert(newStory)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Story shared successfully!');
      
      return {
        ...data,
        user_name: 'You',
        user_image: '' // We could fetch the user's profile picture here
      };
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share story';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete story
  deleteStory: async (id: number): Promise<void> => {
    try {
      // For now, delete from mock stories
      const index = mockStories.findIndex(story => story.id === id);
      if (index !== -1) {
        mockStories.splice(index, 1);
      } else {
        throw new Error(`Story #${id} not found`);
      }
      
      toast.success('Story deleted successfully');
      
      // Once the stories table is created, uncomment the code below
      /*
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Story deleted successfully');
      */
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete story #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
