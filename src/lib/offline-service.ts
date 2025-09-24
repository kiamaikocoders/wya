import { supabase } from './supabase';
import { toast } from 'sonner';

export interface OfflineCache {
  id: number;
  user_id: string;
  cache_key: string;
  cache_type: string;
  data: any;
  expires_at?: string;
  last_synced_at: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export interface OfflineAction {
  id: number;
  user_id: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  data: any;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

export interface SyncStatus {
  id: number;
  user_id: string;
  table_name: string;
  last_sync_timestamp?: string;
  sync_status: string;
  record_count: number;
  last_updated: string;
}

export interface PerformanceMetric {
  id: number;
  user_id: string;
  metric_type: string;
  metric_value: number;
  metadata?: any;
  recorded_at: string;
}

export const offlineService = {
  // Cache data for offline use
  cacheData: async (
    cacheKey: string,
    cacheType: string,
    data: any,
    expiresInHours: number = 24
  ): Promise<any> => {
    try {
      const { data: result, error } = await supabase.rpc('cache_data_for_offline', {
        p_cache_key: cacheKey,
        p_cache_type: cacheType,
        p_data: data,
        p_expires_in_hours: expiresInHours
      });

      if (error) throw error;

      return result;
    } catch (error) {
      console.error('Error caching data:', error);
      throw error;
    }
  },

  // Get cached data
  getCachedData: async (
    cacheKey: string,
    cacheType?: string
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('get_cached_data', {
        p_cache_key: cacheKey,
        p_cache_type: cacheType
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      throw error;
    }
  },

  // Queue offline action
  queueOfflineAction: async (
    actionType: string,
    tableName: string,
    recordId: string,
    data: any
  ): Promise<any> => {
    try {
      const { data: result, error } = await supabase.rpc('queue_offline_action', {
        p_action_type: actionType,
        p_table_name: tableName,
        p_record_id: recordId,
        p_data: data
      });

      if (error) throw error;

      return result;
    } catch (error) {
      console.error('Error queueing offline action:', error);
      throw error;
    }
  },

  // Process offline actions
  processOfflineActions: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('process_offline_actions');

      if (error) throw error;

      toast.success('Offline actions processed successfully');
      return data;
    } catch (error) {
      console.error('Error processing offline actions:', error);
      toast.error('Failed to process offline actions');
      throw error;
    }
  },

  // Get sync status
  getSyncStatus: async (): Promise<SyncStatus[]> => {
    try {
      const { data, error } = await supabase.rpc('get_sync_status');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  },

  // Update sync status
  updateSyncStatus: async (
    tableName: string,
    syncStatus: string,
    recordCount?: number
  ): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('update_sync_status', {
        p_table_name: tableName,
        p_sync_status: syncStatus,
        p_record_count: recordCount
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  },

  // Record performance metric
  recordPerformanceMetric: async (
    metricType: string,
    metricValue: number,
    metadata?: any
  ): Promise<void> => {
    try {
      await supabase.rpc('record_performance_metric', {
        p_metric_type: metricType,
        p_metric_value: metricValue,
        p_metadata: metadata
      });
    } catch (error) {
      console.error('Error recording performance metric:', error);
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (
    metricType?: string,
    hoursBack: number = 24
  ): Promise<PerformanceMetric[]> => {
    try {
      const { data, error } = await supabase.rpc('get_performance_metrics', {
        p_metric_type: metricType,
        p_hours_back: hoursBack
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  },

  // Clean up expired cache
  cleanupExpiredCache: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      throw error;
    }
  },

  // Get offline actions
  getOfflineActions: async (status?: string): Promise<OfflineAction[]> => {
    try {
      let query = supabase
        .from('offline_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      throw error;
    }
  },

  // Get offline cache
  getOfflineCache: async (cacheType?: string): Promise<OfflineCache[]> => {
    try {
      let query = supabase
        .from('offline_cache')
        .select('*')
        .order('last_synced_at', { ascending: false });

      if (cacheType) {
        query = query.eq('cache_type', cacheType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting offline cache:', error);
      throw error;
    }
  },

  // Check if device is online
  isOnline: (): boolean => {
    return navigator.onLine;
  },

  // Listen for online/offline events
  onOnlineStatusChange: (callback: (isOnline: boolean) => void): (() => void) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  // Sync data when coming back online
  syncWhenOnline: async (): Promise<void> => {
    if (offlineService.isOnline()) {
      try {
        // Process any pending offline actions
        await offlineService.processOfflineActions();
        
        // Update sync status for all tables
        const tables = ['events', 'profiles', 'tickets', 'messages', 'notifications'];
        for (const table of tables) {
          await offlineService.updateSyncStatus(table, 'synced');
        }

        toast.success('Data synchronized successfully');
      } catch (error) {
        console.error('Error syncing data:', error);
        toast.error('Failed to synchronize data');
      }
    }
  }
};
