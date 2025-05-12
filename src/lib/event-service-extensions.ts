
import { supabase } from './supabase';
import { toast } from 'sonner';
import type { Event } from '@/types/event.types';

// Add missing methods to the event service
export const eventServiceExtensions = {
  // Get events created by a user
  getUserEvents: async (userId: string): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch your events';
      toast.error(errorMessage);
      return [];
    }
  },
  
  // Get events saved by a user
  getSavedEvents: async (userId: string): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const eventIds = data.map(fav => fav.event_id);
      
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true });
      
      if (eventsError) throw eventsError;
      return events || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch saved events';
      toast.error(errorMessage);
      return [];
    }
  }
};
