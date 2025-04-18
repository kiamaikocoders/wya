
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export const followService = {
  followUser: async (followingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ following_id: followingId });

      if (error) throw error;
      toast.success('User followed successfully');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    }
  },

  unfollowUser: async (followingId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ following_id: followingId });

      if (error) throw error;
      toast.success('User unfollowed successfully');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    }
  },

  getFollowers: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;
      return data.map(follow => follow.follower_id);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  getFollowing: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      return data.map(follow => follow.following_id);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },

  isFollowing: async (followingId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .match({ following_id: followingId })
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
};
