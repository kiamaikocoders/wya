import { supabase } from './supabase';
import { toast } from 'sonner';
import type { EventFilterState, SavedEventFilter } from '@/pages/events/types';

type SaveFilterPayload = {
  name: string;
  filters: EventFilterState;
  sort: string;
  view: string;
  pageSize: number;
};

const TABLE = 'user_event_filters';

export const eventFilterService = {
  async listSavedFilters(): Promise<SavedEventFilter[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, filters, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (
        data?.map(item => ({
          id: item.id,
          name: item.name,
          filters: {
            search: item.filters?.search ?? '',
            category: item.filters?.category ?? null,
            location: item.filters?.location ?? null,
            tags: item.filters?.tags ?? [],
            featuredOnly: item.filters?.featuredOnly ?? false,
            startDate: item.filters?.startDate ?? null,
            endDate: item.filters?.endDate ?? null,
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
        })) ?? []
      );
    } catch (error) {
      console.error('Failed to fetch saved event filters', error);
      toast.error('Unable to load saved filters');
      return [];
    }
  },

  async saveFilter(payload: SaveFilterPayload): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from(TABLE).upsert(
        {
          user_id: user.id,
          name: payload.name,
          filters: payload.filters,
          sort: payload.sort,
          view: payload.view,
          page_size: payload.pageSize,
        },
        { onConflict: 'user_id,name' }
      );

      if (error) {
        throw error;
      }

      toast.success('Filter saved');
    } catch (error) {
      console.error('Failed to save filter', error);
      const message = error instanceof Error ? error.message : 'Unable to save filter';
      toast.error(message);
      throw error;
    }
  },

  async deleteFilter(filterId: string): Promise<void> {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', filterId);

      if (error) {
        throw error;
      }

      toast.success('Filter removed');
    } catch (error) {
      console.error('Failed to delete filter', error);
      toast.error('Unable to delete filter');
      throw error;
    }
  },
};

