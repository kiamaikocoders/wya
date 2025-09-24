
import { supabase } from "@/lib/supabase";

export const followQueries = {
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
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user && !userId) return [];
      
      const userIdToUse = userId || currentUser?.user?.id;
      
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userIdToUse);

      if (error) throw error;
      return data.map(follow => follow.following_id);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },

  isFollowing: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return false;
      
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .match({ 
          follower_id: currentUser.user.id,
          following_id: followingId 
        })
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
};
