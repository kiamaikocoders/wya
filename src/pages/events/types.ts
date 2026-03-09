import type { Event } from '@/types/event.types';

export type EventViewMode = 'grid' | 'list' | 'map';

export type EventsTab = 'discover' | 'for-you' | 'attending' | 'past';

export type EventSortOption = 'soonest' | 'latest' | 'newest' | 'price-low' | 'price-high';

export interface EventFilterState {
  search: string;
  category: string | null;
  location: string | null;
  tags: string[];
  featuredOnly: boolean;
  startDate: string | null;
  endDate: string | null;
  /** Radius in km when filtering by user location */
  radiusKm?: number | null;
  /** User latitude for "near me" / radius filter */
  latitude?: number | null;
  /** User longitude for "near me" / radius filter */
  longitude?: number | null;
}

export interface EventQueryOptions extends EventFilterState {
  page: number;
  pageSize: number;
  sort: EventSortOption;
  recommendationTags?: string[];
  savedFilterId?: string | null;
  includePast?: boolean;
  curatedCity?: string | null;
  /** When set with lat/lng, use spatial query for events within radius */
  radiusKm?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EventQueryResponse {
  events: Event[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  stats: {
    featuredCount: number;
    thisWeekCount: number;
    curatedCount: number;
    curatedCity: string | null;
  };
}

export interface SavedEventFilter {
  id: string;
  name: string;
  filters: EventFilterState;
  created_at: string;
  updated_at: string;
}

export interface EventsMetrics {
  total: number;
  thisWeek: number;
  curatedCity: string | null;
  curatedCount: number;
  featured: number;
}

