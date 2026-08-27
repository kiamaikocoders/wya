
import { supabase } from "@/lib/supabase";
import type { FollowRelation, FollowRequestProfile } from "./types";

export const followQueries = {
  getFollowers: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;
      return data.map(follow => follow.follower_id);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  getFollowing: async (userId: string): Promise<string[]> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user && !userId) return [];

      const userIdToUse = userId || currentUser?.user?.id;

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userIdToUse)
        .eq('status', 'accepted');

      if (error) throw error;
      return data.map(follow => follow.following_id);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },

  isFollowing: async (followingId: string): Promise<boolean> => {
    const relation = await followQueries.getFollowRelation(followingId);
    return relation === 'accepted';
  },

  getFollowRelation: async (followingId: string): Promise<FollowRelation> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return 'none';

      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .match({
          follower_id: currentUser.user.id,
          following_id: followingId
        })
        .maybeSingle();

      if (error || !data) return 'none';
      return data.status === 'accepted' ? 'accepted' : 'pending';
    } catch (error) {
      console.error('Error checking follow status:', error);
      return 'none';
    }
  },

  getOutgoingPendingIds: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .eq('status', 'pending');
      if (error) throw error;
      return (data || []).map((row) => row.following_id);
    } catch (error) {
      console.error('Error getting outgoing requests:', error);
      return [];
    }
  },

  getIncomingRequests: async (userId: string): Promise<FollowRequestProfile[]> => {
    try {
      const { data: rows, error } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = (rows || []).map((row) => row.follower_id).filter(Boolean);
      if (ids.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);
      if (profileError) throw profileError;

      const byId = new Map((profiles || []).map((p) => [p.id, p]));
      return (rows || []).map((row) => {
        const profile = byId.get(row.follower_id);
        return {
          id: row.follower_id,
          username: profile?.username,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          created_at: row.created_at,
        };
      });
    } catch (error) {
      console.error('Error getting incoming requests:', error);
      return [];
    }
  },

  countIncomingRequests: async (userId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      console.error('Error counting incoming requests:', error);
      return 0;
    }
  },
};
