
import { supabase } from './supabase';
import { toast } from 'sonner';

export interface Story {
  id: number;
  event_id: number;
  user_id: string;
  content: string;
  media_url?: string;
  likes_count: number;
  comments_count?: number; // Add comments_count property
  created_at: string;
  updated_at?: string;
  user_name?: string;
  user_image?: string;
  hashtags?: string[];
  caption?: string; // Add caption for compatibility
}

export interface CreateStoryDto {
  event_id: number;
  content: string;
  media_url?: string;
  hashtags?: string[];
}

export const storyService = {
  getEventStories: async (eventId: number): Promise<Story[]> => {
    try {
      // Temporary mock implementation
      return [
        {
          id: 1,
          event_id: eventId,
          user_id: "1",
          content: "Amazing performance tonight! The music was incredible!",
          media_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80",
          likes_count: 24,
          created_at: new Date().toISOString(),
          user_name: "John Smith",
          user_image: "https://i.pravatar.cc/150?img=68",
          hashtags: ["NairobiJazz", "LiveMusic"]
        },
        {
          id: 2,
          event_id: eventId,
          user_id: "2",
          content: "Such a vibrant atmosphere at the festival today!",
          media_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
          likes_count: 18,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_name: "Mary Johnson",
          user_image: "https://i.pravatar.cc/150?img=48",
          hashtags: ["KenyaEvents", "GoodVibes"]
        }
      ];
    } catch (error) {
      console.error('Error fetching event stories:', error);
      return [];
    }
  },

  getAllStories: async (): Promise<Story[]> => {
    try {
      // Temporary mock implementation
      return [
        {
          id: 1,
          event_id: 1,
          user_id: "1",
          content: "Amazing performance tonight! The music was incredible!",
          media_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80",
          likes_count: 24,
          created_at: new Date().toISOString(),
          user_name: "John Smith",
          user_image: "https://i.pravatar.cc/150?img=68",
          hashtags: ["NairobiJazz", "LiveMusic"]
        },
        {
          id: 2,
          event_id: 2,
          user_id: "2",
          content: "Such a vibrant atmosphere at the festival today!",
          media_url: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
          likes_count: 18,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          user_name: "Mary Johnson",
          user_image: "https://i.pravatar.cc/150?img=48",
          hashtags: ["KenyaEvents", "GoodVibes"]
        },
        {
          id: 3,
          event_id: 3,
          user_id: "3",
          content: "Learning so much at this workshop! Can't wait to apply these skills.",
          media_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
          likes_count: 12,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          user_name: "David Wilson",
          user_image: "https://i.pravatar.cc/150?img=53",
          hashtags: ["Photography", "Learning", "Workshop"]
        }
      ];
    } catch (error) {
      console.error('Error fetching all stories:', error);
      return [];
    }
  },

  getStoryById: async (id: number): Promise<Story> => {
    try {
      // Temporary mock implementation
      return {
        id,
        event_id: 1,
        user_id: "1",
        content: "Amazing performance tonight! The music was incredible!",
        media_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80",
        likes_count: 24,
        created_at: new Date().toISOString(),
        user_name: "John Smith",
        user_image: "https://i.pravatar.cc/150?img=68",
        hashtags: ["NairobiJazz", "LiveMusic"]
      };
    } catch (error) {
      console.error(`Error fetching story with ID ${id}:`, error);
      throw error;
    }
  },

  createStory: async (storyData: CreateStoryDto): Promise<Story> => {
    try {
      // Temporary mock implementation
      toast.success('Story created successfully');
      return {
        id: Math.floor(Math.random() * 1000) + 10,
        ...storyData,
        user_id: "1", // In a real implementation, this would come from authentication
        likes_count: 0,
        created_at: new Date().toISOString(),
        user_name: "John Smith", // This would come from authentication
        user_image: "https://i.pravatar.cc/150?img=68" // This would come from user profile
      };
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
      throw error;
    }
  },

  deleteStory: async (id: number): Promise<void> => {
    try {
      // Temporary mock implementation
      toast.success('Story deleted successfully');
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
      throw error;
    }
  }
};
