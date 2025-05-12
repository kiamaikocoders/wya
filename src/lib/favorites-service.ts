
import { supabase } from './supabase';
import { toast } from 'sonner';
import type { Event } from '@/types/event.types';

export const favoritesService = {
  // Add event to favorites
  addFavorite: async (eventId: number): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to add favorites');
      
      const { error } = await supabase
        .from('favorites')
        .insert({ event_id: eventId, user_id: user.id });
        
      if (error) throw error;
      toast.success('Event added to favorites');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
      throw error;
    }
  },
  
  // Remove event from favorites
  removeFavorite: async (eventId: number): Promise<void> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to remove favorites');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      toast.success('Event removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
      throw error;
    }
  },
  
  // Check if event is favorited by user
  isEventFavorited: async (eventId: number): Promise<boolean> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return !!data;
    } catch (error) {
      console.error('Error checking if event is favorited:', error);
      return false;
    }
  },
  
  // Get user's favorite events
  getUserFavorites: async (): Promise<{ event_id: number }[]> => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to view favorites');
      
      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user's favorite events:", error);
      throw error;
    }
  }
};
