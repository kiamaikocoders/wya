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
}

export interface EventQueryOptions extends EventFilterState {
  page: number;
  pageSize: number;
  sort: EventSortOption;
  recommendationTags?: string[];
  savedFilterId?: string | null;
  includePast?: boolean;
  curatedCity?: string | null;
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

