
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

// Sample events data for development
const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Nairobi International Trade Fair',
    description: 'The largest trade exhibition in East Africa, showcasing agricultural, commercial, and industrial products and services from across the region and beyond.',
    category: 'Business',
    date: '2023-10-02',
    location: 'Nairobi',
    image_url: 'https://placehold.co/800x600/FF8000/FFFFFF?text=Trade+Fair',
    organizer_id: 1,
    created_at: '2023-09-01T08:00:00Z',
    price: 500,
    tags: ['trade', 'business', 'agriculture', 'exhibition']
  },
  {
    id: 2,
    title: 'Lamu Cultural Festival',
    description: 'An annual celebration of the unique Swahili culture, featuring traditional dances, dhow races, donkey races, and various competitions.',
    category: 'Culture',
    date: '2023-11-15',
    location: 'Lamu',
    image_url: 'https://placehold.co/800x600/3A3027/FFFFFF?text=Cultural+Festival',
    organizer_id: 2,
    created_at: '2023-10-12T09:30:00Z',
    price: 0,
    is_featured: true,
    tags: ['culture', 'heritage', 'traditional', 'festival']
  },
  {
    id: 3,
    title: 'Magical Kenya Open',
    description: 'A prestigious golf tournament that attracts professional players from across the globe, part of the European Tour.',
    category: 'Sports',
    date: '2024-03-10',
    location: 'Nairobi',
    image_url: 'https://placehold.co/800x600/3A3027/FFFFFF?text=Kenya+Open',
    organizer_id: 3,
    created_at: '2024-01-20T11:15:00Z',
    price: 2000,
    tags: ['golf', 'sports', 'tournament', 'European Tour']
  },
  {
    id: 4,
    title: 'Nairobi Restaurant Week',
    description: 'A culinary celebration where top restaurants offer special menus at discounted prices, showcasing the diverse cuisine available in Nairobi.',
    category: 'Food & Drink',
    date: '2024-02-01',
    location: 'Nairobi',
    image_url: 'https://placehold.co/800x600/FF8000/FFFFFF?text=Restaurant+Week',
    organizer_id: 4,
    created_at: '2024-01-05T10:00:00Z',
    price: 0,
    tags: ['food', 'dining', 'culinary', 'restaurants']
  },
  {
    id: 5,
    title: 'Kilifi New Year Festival',
    description: 'A 3-day electronic music festival featuring local and international DJs, workshops, and art installations.',
    category: 'Music',
    date: '2023-12-31',
    location: 'Kilifi',
    image_url: 'https://placehold.co/800x600/3A3027/FFFFFF?text=Music+Festival',
    organizer_id: 5,
    created_at: '2023-11-10T14:30:00Z',
    price: 4500,
    is_featured: true,
    tags: ['music', 'party', 'new year', 'festival']
  },
  {
    id: 6,
    title: 'Lake Turkana Cultural Festival',
    description: 'A celebration of the cultural diversity of communities living around Lake Turkana, featuring traditional dances, music, and crafts.',
    category: 'Culture',
    date: '2024-06-15',
    location: 'Turkana',
    image_url: 'https://placehold.co/800x600/FF8000/FFFFFF?text=Cultural+Festival',
    organizer_id: 6,
    created_at: '2024-04-22T09:00:00Z',
    price: 500,
    tags: ['culture', 'heritage', 'traditional', 'festival']
  },
  {
    id: 7,
    title: 'Nairobi Tech Week',
    description: 'Kenya\'s largest tech event, bringing together developers, startups, and tech enthusiasts for workshops, panel discussions, and networking.',
    category: 'Technology',
    date: '2024-05-20',
    location: 'Nairobi',
    image_url: 'https://placehold.co/800x600/3A3027/FFFFFF?text=Tech+Week',
    organizer_id: 7,
    created_at: '2024-03-15T11:00:00Z',
    price: 1000,
    tags: ['technology', 'innovation', 'developers', 'startups']
  },
  {
    id: 8,
    title: 'Art and Design Fair',
    description: 'An exhibition of contemporary Kenyan art, design, and fashion with opportunities to purchase artworks directly from creators.',
    category: 'Art',
    date: '2024-04-10',
    location: 'Nairobi',
    image_url: 'https://placehold.co/800x600/FF8000/FFFFFF?text=Art+Fair',
    organizer_id: 8,
    created_at: '2024-02-28T13:45:00Z',
    price: 300,
    tags: ['art', 'design', 'exhibition', 'fashion']
  }
];

// Event service methods
export const eventService = {
  // Get all events
  getAllEvents: async (): Promise<Event[]> => {
    try {
      // First attempt to get events from the API
      const response = await apiClient.get<Event[]>(EVENT_ENDPOINTS.ALL);
      
      // If API returns empty array or fails, use sample data for development
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
      // First attempt to get event from the API
      const response = await apiClient.get<Event>(EVENT_ENDPOINTS.SINGLE(id));
      return response;
    } catch (error) {
      // If API fails, check if the event exists in sample data
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
