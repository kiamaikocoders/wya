import { supabase } from './supabase';
import { toast } from 'sonner';

export interface GhostPersonaGroup {
  id: number;
  name: string;
  description: string | null;
  engagement_rate: number;
  content_creation_rate: number;
  like_probability: number;
  share_probability: number;
  comment_probability: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface GhostActionQueue {
  id: number;
  action_type: 'like_story' | 'create_story' | 'follow_user';
  target_id: number | string | null; // Can be number (event_id) or string (user_id UUID)
  target_type: 'event' | 'user';
  persona_group_id: number | null;
  ghost_user_ids: string[] | null;
  scheduled_at: string;
  executed_at: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata: any;
  created_by: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  persona_group_id: number | null;
  ghost_user_ids: string[] | null;
  scheduled_at: string;
  executed_at: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata: any;
  created_by: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GhostUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  is_ghost: boolean;
  created_at: string;
}

export interface CreateGhostActionParams {
  action_type: GhostActionQueue['action_type'];
  target_id?: number | string | null; // Can be number (event_id) or string (user_id UUID)
  target_type: GhostActionQueue['target_type'];
  persona_group_id?: number;
  ghost_user_ids?: string[];
  scheduled_at?: string;
  metadata?: any;
}

export const ghostService = {
  // ==========================================
  // PERSONA GROUPS
  // ==========================================

  /**
   * Get all persona groups
   */
  getPersonaGroups: async (): Promise<GhostPersonaGroup[]> => {
    try {
      const { data, error } = await supabase
        .from('ghost_persona_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching persona groups:', error);
      toast.error('Failed to fetch persona groups');
      return [];
    }
  },

  /**
   * Get persona group by ID
   */
  getPersonaGroup: async (id: number): Promise<GhostPersonaGroup | null> => {
    try {
      const { data, error } = await supabase
        .from('ghost_persona_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching persona group:', error);
      return null;
    }
  },

  // ==========================================
  // GHOST USERS
  // ==========================================

  /**
   * Get all ghost users
   */
  getGhostUsers: async (personaGroupId?: number): Promise<GhostUser[]> => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, is_ghost, created_at')
        .eq('is_ghost', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ghost users:', error);
      toast.error('Failed to fetch ghost users');
      return [];
    }
  },

  /**
   * Get ghost users by persona group (using RPC function)
   */
  getGhostUsersByPersona: async (personaGroupId?: number): Promise<GhostUser[]> => {
    try {
      const { data, error } = await supabase.rpc('get_ghost_users_by_persona', {
        p_persona_group_id: personaGroupId || null
      });

      if (error) throw error;
      
      // Fetch full profile data for each user
      if (!data || data.length === 0) return [];
      
      const userIds = data.map((u: any) => u.id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, is_ghost, created_at')
        .in('id', userIds);

      if (profileError) throw profileError;
      return profiles || [];
    } catch (error) {
      console.error('Error fetching ghost users by persona:', error);
      return [];
    }
  },

  // ==========================================
  // ACTION QUEUE
  // ==========================================

  /**
   * Create a ghost action in the queue
   */
  createGhostAction: async (params: CreateGhostActionParams): Promise<GhostActionQueue | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return null;
      }

      const { data, error } = await supabase
        .from('ghost_action_queue')
        .insert({
          ...params,
          created_by: user.id,
          scheduled_at: params.scheduled_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ghost action queued successfully');
      return data;
    } catch (error: any) {
      console.error('Error creating ghost action:', error);
      toast.error(error.message || 'Failed to queue ghost action');
      return null;
    }
  },

  /**
   * Get all queued actions
   */
  getQueuedActions: async (status?: GhostActionQueue['status']): Promise<GhostActionQueue[]> => {
    try {
      let query = supabase
        .from('ghost_action_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching queued actions:', error);
      toast.error('Failed to fetch queued actions');
      return [];
    }
  },

  /**
   * Get action by ID
   */
  getAction: async (id: number): Promise<GhostActionQueue | null> => {
    try {
      const { data, error } = await supabase
        .from('ghost_action_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching action:', error);
      return null;
    }
  },

  /**
   * Cancel a queued action
   */
  cancelAction: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ghost_action_queue')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending'); // Only cancel pending actions

      if (error) throw error;

      toast.success('Action cancelled');
      return true;
    } catch (error: any) {
      console.error('Error cancelling action:', error);
      toast.error(error.message || 'Failed to cancel action');
      return false;
    }
  },

  /**
   * Delete a queued action
   */
  deleteAction: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ghost_action_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Action deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting action:', error);
      toast.error(error.message || 'Failed to delete action');
      return false;
    }
  },

  // ==========================================
  // ACTION LOG
  // ==========================================

  /**
   * Get action log for a queue item
   */
  getActionLog: async (queueId: number): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('ghost_action_log')
        .select('*')
        .eq('queue_id', queueId)
        .order('executed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching action log:', error);
      return [];
    }
  },

  /**
   * Get recent action logs
   */
  getRecentActionLogs: async (limit: number = 100): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('ghost_action_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent action logs:', error);
      return [];
    }
  },

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * Get ghost system statistics
   * Uses the same query method as getGhostUsers to ensure counts match
   */
  getStatistics: async (): Promise<{
    total_ghost_users: number;
    total_queued_actions: number;
    pending_actions: number;
    completed_actions: number;
    failed_actions: number;
  }> => {
    try {
      // Get ghost users using the same method as getGhostUsers to ensure counts match
      const { data: ghostUsers, error: ghostError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_ghost', true);

      if (ghostError) {
        console.error('Error fetching ghost users for statistics:', ghostError);
        // Fallback to count query
        const { count: ghostCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_ghost', true);
        
        return {
          total_ghost_users: ghostCount || 0,
          total_queued_actions: 0,
          pending_actions: 0,
          completed_actions: 0,
          failed_actions: 0
        };
      }

      // Get action queue stats
      const { data: actions, error: actionsError } = await supabase
        .from('ghost_action_queue')
        .select('status');

      if (actionsError) {
        console.error('Error fetching action queue for statistics:', actionsError);
      }

      const stats = {
        total_ghost_users: ghostUsers?.length || 0,
        total_queued_actions: actions?.length || 0,
        pending_actions: actions?.filter(a => a.status === 'pending').length || 0,
        completed_actions: actions?.filter(a => a.status === 'completed').length || 0,
        failed_actions: actions?.filter(a => a.status === 'failed').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        total_ghost_users: 0,
        total_queued_actions: 0,
        pending_actions: 0,
        completed_actions: 0,
        failed_actions: 0
      };
    }
  },

  // ==========================================
  // PROCESS ACTIONS
  // ==========================================

  /**
   * Trigger Edge Function to process pending actions
   */
  processActions: async (): Promise<{ processed: number; message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('process-ghost-actions', {
        body: {}
      });

      if (error) throw error;

      const result = data as { processed?: number; message?: string };
      toast.success(`Processed ${result.processed || 0} actions`);
      return {
        processed: result.processed || 0,
        message: result.message || 'Actions processed successfully'
      };
    } catch (error: any) {
      console.error('Error processing actions:', error);
      toast.error(error.message || 'Failed to process actions');
      throw error;
    }
  },

  /**
   * Reset actions stuck in processing state (due to timeouts)
   */
  resetStuckActions: async (): Promise<{ reset_count: number; action_ids: number[] }> => {
    try {
      const { data, error } = await supabase.rpc('reset_stuck_processing_actions');
      
      if (error) throw error;
      
      const result = data as { reset_count: number; action_ids: number[] } | null;
      if (result && result.reset_count > 0) {
        toast.success(`Reset ${result.reset_count} stuck action(s)`);
      } else {
        toast.info('No stuck actions found');
      }
      
      return result || { reset_count: 0, action_ids: [] };
    } catch (error: any) {
      console.error('Error resetting stuck actions:', error);
      toast.error(error.message || 'Failed to reset stuck actions');
      throw error;
    }
  }
};
