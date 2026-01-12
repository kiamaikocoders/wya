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
  action_type: 'like_story' | 'like_post' | 'like_community_post' | 'comment_story' | 'comment_post' | 'comment_community_post' | 'create_story' | 'create_post' | 'create_community_post' | 'follow_user';
  target_id: number | null;
  target_type: 'story' | 'forum_post' | 'community_post' | 'event' | 'user';
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
  target_id?: number;
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
   */
  getStatistics: async (): Promise<{
    total_ghost_users: number;
    total_queued_actions: number;
    pending_actions: number;
    completed_actions: number;
    failed_actions: number;
  }> => {
    try {
      // Get ghost user count
      const { count: ghostCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_ghost', true);

      // Get action queue stats
      const { data: actions } = await supabase
        .from('ghost_action_queue')
        .select('status');

      const stats = {
        total_ghost_users: ghostCount || 0,
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
  }
};
