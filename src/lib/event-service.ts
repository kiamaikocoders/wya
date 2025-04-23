
import { apiClient } from './api-client';
import { EVENT_ENDPOINTS } from './api-endpoints';
import { toast } from 'sonner';
import { SAMPLE_EVENTS } from '@/data/mock-events';
import type { Event, CreateEventPayload, UpdateEventPayload } from '@/types/event.types';

export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    try {
      const response = await apiClient.get<Event[]>(EVENT_ENDPOINTS.ALL);
      
      if (response && Array.isArray(response) && response.length > 0) {
        return response;
      } else {
        console.info('Using sample events data for development');
        return SAMPLE_EVENTS;
      }
    } catch (error) {
      console.info('API call failed, using sample events data for development', error);
      return SAMPLE_EVENTS;
    }
  },
  
  // Get event by ID
  getEventById: async (id: number): Promise<Event> => {
    try {
      const response = await apiClient.get<Event>(EVENT_ENDPOINTS.SINGLE(id));
      return response;
    } catch (error) {
      const sampleEvent = SAMPLE_EVENTS.find(event => event.id === id);
      
      if (sampleEvent) {
        console.info(`Using sample event data for id: ${id}`);
        return sampleEvent;
      }
      
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
