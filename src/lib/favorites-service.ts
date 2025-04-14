
import { apiClient } from './api-client';
import { toast } from 'sonner';
import { Event } from './event-service';

// Favorites endpoint
const FAVORITES_ENDPOINT = `${apiClient.XANO_EVENT_API_URL}/favorites`;

// Favorites type definitions
export interface Favorite {
  id: number;
  user_id: number;
  event_id: number;
  created_at: string;
  event?: Event;
}

// For development when API is not available
let LOCAL_FAVORITES: Favorite[] = [];

// Favorites service methods
export const favoritesService = {
  // Get user favorites
  getUserFavorites: async (): Promise<Favorite[]> => {
    try {
      const response = await apiClient.get<Favorite[]>(`${FAVORITES_ENDPOINT}/user`);
      return response;
    } catch (error) {
      console.error('Error fetching favorites, using local data:', error);
      return LOCAL_FAVORITES;
    }
  },
  
  // Add event to favorites
  addFavorite: async (eventId: number): Promise<Favorite> => {
    try {
      const response = await apiClient.post<Favorite>(FAVORITES_ENDPOINT, { event_id: eventId });
      toast.success('Event added to favorites');
      return response;
    } catch (error) {
      // For development, add to local favorites
      const newFavorite: Favorite = {
        id: Math.floor(Math.random() * 10000),
        user_id: 1, // Mock user ID
        event_id: eventId,
        created_at: new Date().toISOString()
      };
      LOCAL_FAVORITES.push(newFavorite);
      toast.success('Event added to favorites');
      return newFavorite;
    }
  },
  
  // Remove event from favorites
  removeFavorite: async (eventId: number): Promise<void> => {
    try {
      await apiClient.delete(`${FAVORITES_ENDPOINT}/${eventId}`);
      toast.success('Event removed from favorites');
    } catch (error) {
      // For development, remove from local favorites
      LOCAL_FAVORITES = LOCAL_FAVORITES.filter(fav => fav.event_id !== eventId);
      toast.success('Event removed from favorites');
    }
  },
  
  // Check if event is in favorites
  isEventFavorited: async (eventId: number): Promise<boolean> => {
    try {
      const favorites = await favoritesService.getUserFavorites();
      return favorites.some(fav => fav.event_id === eventId);
    } catch (error) {
      return false;
    }
  }
};
