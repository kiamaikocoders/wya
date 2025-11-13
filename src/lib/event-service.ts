import { supabase } from './supabase';
import { toast } from 'sonner';
import { eventServiceExtensions } from './event-service-extensions';
import { startOfWeek, endOfWeek } from 'date-fns';
import type { EventQueryOptions, EventQueryResponse } from '@/pages/events/types';

// Define event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string; // Optional event start time (HH:MM:SS format)
  location: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  organizer_id?: string;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: string[]; // Add tags property to match with types/event.types.ts
  is_featured?: boolean; // Also add is_featured for compatibility
  latitude?: number;
  longitude?: number;
  performing_artists?: string[]; // Array of performing artist names
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  time?: string; // Optional event start time
  location: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  performing_artists?: string[]; // Array of performing artist names
}

export interface UpdateEventPayload {
  id: number;
  title?: string;
  description?: string;
  date?: string;
  time?: string; // Optional event start time
  location?: string;
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  performing_artists?: string[]; // Array of performing artist names
}

// Event service
export const eventService = {
  // Get all events (legacy)
  getAllEvents: async (): Promise<Event[]> => {
    const result = await eventService.queryEvents({
      search: '',
      category: null,
      location: null,
      tags: [],
      featuredOnly: false,
      startDate: null,
      endDate: null,
      page: 1,
      pageSize: 200,
      sort: 'soonest',
    });

    return result.events;
  },

  queryEvents: async (options: EventQueryOptions): Promise<EventQueryResponse> => {
    try {
      const {
        search,
        category,
        location,
        tags,
        featuredOnly,
        startDate,
        endDate,
        sort,
        page,
        pageSize,
        recommendationTags,
        curatedCity,
        includePast,
      } = options;

      let query = supabase.from('events').select('*', { count: 'exact' });

      if (search) {
        const term = search.trim();
        const ilikeTerm = `%${term}%`;
        query = query.or(
          [
            `title.ilike.${ilikeTerm}`,
            `description.ilike.${ilikeTerm}`,
            `location.ilike.${ilikeTerm}`,
            `category.ilike.${ilikeTerm}`,
          ].join(',')
        );
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (location) {
        query = query.eq('location', location);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      const nowIso = new Date().toISOString();

      if (!includePast) {
        query = query.gte('date', nowIso);
      } else if (!endDate) {
        query = query.lte('date', nowIso);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      if (featuredOnly) {
        query = query.eq('featured', true);
      }

      if (recommendationTags && recommendationTags.length) {
        query = query.contains('tags', recommendationTags);
      }

      switch (sort) {
        case 'latest':
          query = query.order('date', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true, nullsFirst: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false, nullsLast: true });
          break;
        case 'soonest':
        default:
          query = query.order('date', { ascending: true });
          break;
      }

      const safePage = Math.max(page, 1);
      const from = (safePage - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const now = new Date();
      const { count: featuredCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true);

      const startWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endWeek = endOfWeek(now, { weekStartsOn: 1 });

      const [{ count: thisWeekCount }, curatedResult] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .gte('date', startWeek.toISOString())
          .lte('date', endWeek.toISOString()),
        curatedCity
          ? supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('location', curatedCity)
              .gte('date', new Date().toISOString())
          : Promise.resolve({ count: 0 }),
      ]);

      const totalCount = count ?? 0;
      const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

      return {
        events: data || [],
        totalCount,
        totalPages,
        page: safePage,
        pageSize,
        stats: {
          featuredCount: featuredCount ?? 0,
          thisWeekCount: thisWeekCount ?? 0,
          curatedCount: curatedResult?.count ?? 0,
          curatedCity: curatedCity ?? null,
        },
      };
    } catch (error) {
      console.error('Error fetching events with filters:', error);
      toast.error('Failed to fetch events');
      return {
        events: [],
        totalCount: 0,
        totalPages: 1,
        page: options.page,
        pageSize: options.pageSize,
        stats: {
          featuredCount: 0,
          thisWeekCount: 0,
          curatedCount: 0,
          curatedCity: options.curatedCity ?? null,
        },
      };
    }
  },
  
  getFilterFacets: async () => {
    try {
      const [{ data: categoriesData }, { data: locationsData }, { data: tagsData }] =
        await Promise.all([
          supabase.from('events').select('category').not('category', 'is', null),
          supabase.from('events').select('location').not('location', 'is', null),
          supabase.from('events').select('tags').not('tags', 'is', null),
        ]);

      const categories = Array.from(
        new Set((categoriesData ?? []).map(item => item.category).filter(Boolean))
      );

      const locations = Array.from(
        new Set((locationsData ?? []).map(item => item.location).filter(Boolean))
      );

      const tags = Array.from(
        new Set(
          (tagsData ?? []).flatMap(item => (Array.isArray(item.tags) ? item.tags : [])).filter(Boolean)
        )
      );

      return {
        categories,
        locations,
        tags,
      };
    } catch (error) {
      console.error('Failed to load event filter facets', error);
      return {
        categories: [],
        locations: [],
        tags: [],
      };
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
