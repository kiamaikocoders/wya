
import { supabase } from './supabase';
import { toast } from 'sonner';
import { eventServiceExtensions } from './event-service-extensions';

// Define event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  location: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  organizer_id?: string;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  location: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
}

export interface UpdateEventPayload {
  id: number;
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
}

// Event service
export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
      return [];
    }
  },
  
  // Get event by ID
  getEventById: async (id: number): Promise<Event> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      toast.error('Failed to fetch event');
      throw error;
    }
  },
  
  // Create event
  createEvent: async (eventData: CreateEventPayload): Promise<Event> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create an event');
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Event created successfully');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update event
  updateEvent: async (eventData: UpdateEventPayload): Promise<Event> => {
    try {
      const { id, ...updates } = eventData;
      
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Event updated successfully');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete event
  deleteEvent: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      throw error;
    }
  },
  
  // Get events by user ID (created by the user)
  getUserEvents: eventServiceExtensions.getUserEvents,
  
  // Get saved events by user
  getSavedEvents: eventServiceExtensions.getSavedEvents
};
