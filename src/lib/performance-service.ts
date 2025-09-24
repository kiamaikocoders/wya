import { supabase } from './supabase';
import { toast } from 'sonner';

export interface DatabaseHealth {
  database_size_mb: number;
  active_connections: number;
  total_connections: number;
  cache_hit_ratio: number;
  slow_queries_count: number;
  index_usage: any[];
  checked_at: string;
}

export interface QueryPerformance {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  max_time: number;
}

export interface ConnectionPoolStatus {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  long_running_queries: number;
  database_locks: number;
  checked_at: string;
}

export interface RateLimitStatus {
  action: string;
  request_count: number;
  window_start: string;
  window_end: string;
  limit_remaining: number;
  is_limited: boolean;
}

export const performanceService = {
  // Analyze query performance
  analyzeQueryPerformance: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('analyze_query_performance');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      throw error;
    }
  },

  // Get slow queries
  getSlowQueries: async (): Promise<QueryPerformance[]> => {
    try {
      const { data, error } = await supabase.rpc('get_slow_queries');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting slow queries:', error);
      throw error;
    }
  },

  // Optimize database
  optimizeDatabase: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('optimize_database');

      if (error) throw error;

      toast.success('Database optimized successfully');
      return data;
    } catch (error) {
      console.error('Error optimizing database:', error);
      toast.error('Failed to optimize database');
      throw error;
    }
  },

  // Get database health
  getDatabaseHealth: async (): Promise<DatabaseHealth> => {
    try {
      const { data, error } = await supabase.rpc('get_database_health');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting database health:', error);
      throw error;
    }
  },

  // Get connection pool status
  getConnectionPoolStatus: async (): Promise<ConnectionPoolStatus> => {
    try {
      const { data, error } = await supabase.rpc('get_connection_pool_status');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting connection pool status:', error);
      throw error;
    }
  },

  // Check rate limit
  checkRateLimit: async (
    action: string,
    limitCount: number = 100,
    windowMinutes: number = 60
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_action: action,
        p_limit_count: limitCount,
        p_window_minutes: windowMinutes
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  },

  // Get rate limit status
  getRateLimitStatus: async (action: string): Promise<RateLimitStatus> => {
    try {
      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_action: action
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      throw error;
    }
  },

  // Clean up old data
  cleanupOldData: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_data');

      if (error) throw error;

      toast.success('Old data cleaned up successfully');
      return data;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      toast.error('Failed to clean up old data');
      throw error;
    }
  },

  // Monitor API response times
  monitorAPIResponse: async (
    endpoint: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> => {
    try {
      await supabase.rpc('record_performance_metric', {
        p_metric_type: 'api_response_time',
        p_metric_value: responseTime,
        p_metadata: {
          endpoint,
          status_code: statusCode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error monitoring API response:', error);
    }
  },

  // Monitor cache hit rate
  monitorCacheHitRate: async (
    cacheType: string,
    hitRate: number
  ): Promise<void> => {
    try {
      await supabase.rpc('record_performance_metric', {
        p_metric_type: 'cache_hit_rate',
        p_metric_value: hitRate,
        p_metadata: {
          cache_type: cacheType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error monitoring cache hit rate:', error);
    }
  },

  // Monitor database query performance
  monitorQueryPerformance: async (
    query: string,
    executionTime: number,
    rowsAffected: number
  ): Promise<void> => {
    try {
      await supabase.rpc('record_performance_metric', {
        p_metric_type: 'query_performance',
        p_metric_value: executionTime,
        p_metadata: {
          query: query.substring(0, 100), // Truncate long queries
          rows_affected: rowsAffected,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error monitoring query performance:', error);
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (
    metricType?: string,
    hoursBack: number = 24
  ): Promise<any[]> => {
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

  // Performance monitoring wrapper
  withPerformanceMonitoring: async <T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: any
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record successful operation
      await performanceService.monitorAPIResponse(
        operationName,
        duration,
        200
      );

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record failed operation
      await performanceService.monitorAPIResponse(
        operationName,
        duration,
        500
      );

      throw error;
    }
  },

  // Database health check
  healthCheck: async (): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: DatabaseHealth;
    issues: string[];
  }> => {
    try {
      const health = await performanceService.getDatabaseHealth();
      const issues: string[] = [];

      // Check database size
      if (health.database_size_mb > 1000) {
        issues.push('Database size is large (>1GB)');
      }

      // Check cache hit ratio
      if (health.cache_hit_ratio < 90) {
        issues.push('Low cache hit ratio (<90%)');
      }

      // Check active connections
      if (health.active_connections > 50) {
        issues.push('High number of active connections (>50)');
      }

      // Check slow queries
      if (health.slow_queries_count > 10) {
        issues.push('Multiple slow queries detected');
      }

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 2 ? 'unhealthy' : 'degraded';
      }

      return {
        status,
        metrics: health,
        issues
      };
    } catch (error) {
      console.error('Error performing health check:', error);
      return {
        status: 'unhealthy',
        metrics: {} as DatabaseHealth,
        issues: ['Health check failed']
      };
    }
  }
};
