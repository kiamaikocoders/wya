
import { apiClient } from './api-client';
import { FAVORITES_ENDPOINTS } from './api-endpoints';
import type { Event } from '@/types/event.types';

export const favoritesService = {
  // Add event to favorites
  addFavorite: async (eventId: number): Promise<void> => {
    try {
      await apiClient.post(FAVORITES_ENDPOINTS.ADD(eventId), {});
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },
  
  // Remove event from favorites
  removeFavorite: async (eventId: number): Promise<void> => {
    try {
      await apiClient.delete(FAVORITES_ENDPOINTS.REMOVE(eventId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },
  
  // Check if event is favorited by user
  isEventFavorited: async (eventId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get<boolean>(FAVORITES_ENDPOINTS.IS_FAVORITED(eventId));
      return response;
    } catch (error) {
      console.error('Error checking if event is favorited:', error);
      return false;
    }
  },
  
  // Get user's favorite events
  getUserFavorites: async (): Promise<{ event_id: number }[]> => {
    try {
      const response = await apiClient.get<{ event_id: number }[]>(FAVORITES_ENDPOINTS.GET_ALL);
      return response;
    } catch (error) {
      console.error("Error fetching user's favorite events:", error);
      throw error;
    }
  }
};
