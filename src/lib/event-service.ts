import { supabase } from './supabase';
import { toast } from 'sonner';
import { eventServiceExtensions } from './event-service-extensions';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import type { EventQueryOptions, EventQueryResponse } from '@/pages/events/types';
import { notifyEventTicketHolders } from './email/product-email';
import { notificationService } from './notification/notification-service';

// Define event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  end_date?: string | null; // Last day of event (YYYY-MM-DD), null for single-day
  time?: string; // Optional event start time (HH:MM:SS format)
  location: string;
  location_url?: string | null; // Optional maps link (Google/Apple/Mapbox/etc.)
  image_url?: string;
  capacity?: number;
  price?: number;
  category?: string;
  organizer_id?: string;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: string[]; // Add tags property to match with types/event.types.ts
  // Back-compat only: some older code paths still read this. Do NOT select it from `events`
  // unless the column exists in the database.
  is_featured?: boolean;
  latitude?: number;
  longitude?: number;
  performing_artists?: string[]; // Array of performing artist names
  ticket_link?: string | null; // External URL for ticket purchase (admin create event)
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  end_date?: string | null; // Last day of event (YYYY-MM-DD), null for single-day
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
  end_date?: string | null;
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

  // Lightweight home feed (avoids count/stats queries and returns a small payload)
  getHomeFeedEvents: async (limit = 50): Promise<Event[]> => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('events')
      .select(
        'id,title,date,end_date,time,location,location_url,image_url,price,category,featured,tags,latitude,longitude,performing_artists'
      )
      .gte('event_last_day', startOfToday)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching home feed events:', error);
      throw error;
    }

    return data || [];
  },

  queryEvents: async (options: EventQueryOptions): Promise<EventQueryResponse> => {
    try {
      const now = new Date();
      const startOfTodayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

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
        pastOnly,
        radiusKm,
        latitude,
        longitude,
      } = options;

      // Near-me: use spatial RPC when coords + radius are provided
      if (
        latitude != null &&
        longitude != null &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        radiusKm != null &&
        radiusKm > 0
      ) {
        return eventService.queryEventsNearby({
          ...options,
          latitude,
          longitude,
          radiusKm,
          dateFrom: pastOnly ? undefined : startOfTodayIso,
        });
      }

      // Avoid select('*') to reduce payload size; keep fields used across event screens.
      let query = supabase
        .from('events')
        .select(
          'id,title,description,date,end_date,time,location,location_url,image_url,capacity,price,category,organizer_id,featured,created_at,updated_at,tags,latitude,longitude,performing_artists',
          { count: 'exact' }
        );

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
        query = query.ilike('location', `%${location.trim()}%`);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      // includePast: no date window (e.g. Discover / Profile need all events).
      // Otherwise: upcoming + multi-day still running (last calendar day >= today).
      // pastOnly: Events "Past" tab — last calendar day before today.
      if (pastOnly) {
        query = query.lt('event_last_day', startOfTodayIso);
      } else if (!includePast) {
        query = query.gte('event_last_day', startOfTodayIso);
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

      const { count: featuredCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true);

      const startWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endWeek = endOfWeek(now, { weekStartsOn: 1 });

      const weekStartStr = format(startWeek, 'yyyy-MM-dd');
      const weekEndStr = format(endWeek, 'yyyy-MM-dd');

      const [{ count: thisWeekCount }, curatedResult] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .gte('event_last_day', weekStartStr)
          .lte('event_first_day', weekEndStr),
        curatedCity
          ? supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .ilike('location', `%${curatedCity}%`)
              .gte('event_last_day', startOfTodayIso)
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

  /** Spatial nearby events via Postgres Haversine RPC */
  queryEventsNearby: async (
    options: EventQueryOptions & {
      latitude: number;
      longitude: number;
      radiusKm: number;
      dateFrom?: string;
    },
  ): Promise<EventQueryResponse> => {
    try {
      const {
        latitude,
        longitude,
        radiusKm,
        page,
        pageSize,
        search,
        category,
        sort,
        dateFrom,
      } = options;
      const safePage = Math.max(page, 1);
      const offset = (safePage - 1) * pageSize;

      const { data, error } = await supabase.rpc('events_within_radius', {
        p_lat: latitude,
        p_lng: longitude,
        p_radius_km: radiusKm,
        p_limit: Math.min(Math.max(pageSize * 3, 50), 200),
        p_offset: 0,
        p_date_from: dateFrom ?? null,
      });

      if (error) throw error;

      let rows = (data || []) as Event[];

      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        rows = rows.filter(
          (e) =>
            e.title?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            e.category?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q),
        );
      }
      if (category) {
        rows = rows.filter((e) => e.category?.toLowerCase() === category.toLowerCase());
      }

      switch (sort) {
        case 'price-low':
          rows = [...rows].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
          break;
        case 'price-high':
          rows = [...rows].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
          break;
        case 'latest':
          rows = [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date)));
          break;
        case 'soonest':
        default:
          rows = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
          break;
      }

      const totalCount = rows.length;
      const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
      const pageRows = rows.slice(offset, offset + pageSize);

      return {
        events: pageRows,
        totalCount,
        totalPages,
        page: safePage,
        pageSize,
        stats: {
          featuredCount: rows.filter((e) => e.featured).length,
          thisWeekCount: totalCount,
          curatedCount: 0,
          curatedCity: null,
        },
      };
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      toast.error('Failed to fetch nearby events');
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
          curatedCity: null,
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
.select(
        'id,title,description,date,end_date,time,location,location_url,image_url,capacity,price,category,organizer_id,featured,created_at,updated_at,tags,latitude,longitude,performing_artists,ticket_link'
        )
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

  /** Batch fetch events by id (e.g. Discover stories tied to events not in the first events page). */
  getEventsByIds: async (ids: number[]): Promise<Event[]> => {
    if (!ids.length) return [];
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id,title,description,date,end_date,time,location,location_url,image_url,capacity,price,category,organizer_id,featured,created_at,updated_at,tags,latitude,longitude,performing_artists'
        )
        .in('id', ids);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events by ids:', error);
      return [];
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
      
      // Send notifications to all users about new event
      try {
        const { onboardingNotifications } = await import('./onboarding-notifications');
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', user.id); // Don't notify the creator
        
        if (allUsers && allUsers.length > 0) {
          // Notify up to 100 users (to avoid overwhelming the system)
          const usersToNotify = allUsers.slice(0, 100);
          await Promise.all(
            usersToNotify.map(userProfile =>
              onboardingNotifications.sendNewEventNotification(userProfile.id, data.title, data.id)
            )
          );
        }
      } catch (notifError) {
        console.warn('Failed to send event notifications:', notifError);
        // Don't fail event creation if notifications fail
      }
      
      toast.success('Event created successfully! Users will be notified.');
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
        .select();
      
      if (error) throw error;
      
      // Check if any rows were updated
      if (!data || data.length === 0) {
        throw new Error('No rows were updated. You may not have permission to update this event, or the event may not exist.');
      }

      const updated = data[0] as Event;

      try {
        await notifyEventTicketHolders({
          eventId: updated.id,
          eventTitle: updated.title,
          type: 'event_update',
          title: 'Event updated',
          message: `Details for "${updated.title}" have changed. Tap to review.`,
        });
      } catch (e) {
        console.warn('Event update notify failed', e);
      }

      if (updates.organizer_id) {
        try {
          await notificationService.createNotification({
            user_id: updates.organizer_id,
            type: 'organizer_assigned',
            title: "You're the organizer",
            message: `You've been assigned as organizer for "${updated.title}".`,
            resource_id: updated.id,
            resource_type: 'event',
            link: `/events/${updated.id}`,
            data: { eventTitle: updated.title },
          });
        } catch (e) {
          console.warn('Organizer assigned notify failed', e);
        }
      }
      
      toast.success('Event updated successfully');
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update event';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete event
  deleteEvent: async (id: number): Promise<void> => {
    try {
      const { data: existing } = await supabase
        .from('events')
        .select('id, title')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        try {
          await notifyEventTicketHolders({
            eventId: existing.id,
            eventTitle: existing.title,
            type: 'event_cancelled',
            title: 'Event cancelled',
            message: `"${existing.title}" has been cancelled.`,
          });
        } catch (e) {
          console.warn('Event cancel notify failed', e);
        }
      }

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
