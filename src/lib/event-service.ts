
import { apiClient, EVENT_ENDPOINTS } from './api-client';
import { toast } from 'sonner';

// Event type definitions
export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url: string;
  organizer_id: number;
  created_at: string;
  price?: number;
  is_featured?: boolean;
  tags?: string[];
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  image_url?: string;
  price?: number;
  is_featured?: boolean;
  tags?: string[];
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: number;
}

// Event service methods
export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    try {
      const response = await apiClient.get<Event[]>(EVENT_ENDPOINTS.ALL);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Get event by ID
  getEventById: async (id: number): Promise<Event> => {
    try {
      const response = await apiClient.get<Event>(EVENT_ENDPOINTS.SINGLE(id));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch event #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Create new event
  createEvent: async (eventData: CreateEventPayload): Promise<Event> => {
    try {
      const response = await apiClient.post<Event>(EVENT_ENDPOINTS.ALL, eventData);
      toast.success('Event created successfully!');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update existing event
  updateEvent: async (eventData: UpdateEventPayload): Promise<Event> => {
    try {
      const { id, ...updateData } = eventData;
      const response = await apiClient.patch<Event>(EVENT_ENDPOINTS.SINGLE(id), updateData);
      toast.success('Event updated successfully!');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update event #${eventData.id}`;
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete event
  deleteEvent: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(EVENT_ENDPOINTS.SINGLE(id));
      toast.success('Event deleted successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete event #${id}`;
      toast.error(errorMessage);
      throw error;
    }
  }
};
