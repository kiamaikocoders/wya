
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const followOperations = {
  followUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        toast.error('You must be logged in to follow users');
        return false;
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .match({ 
          follower_id: currentUser.user.id,
          following_id: followingId 
        })
        .maybeSingle();

      if (existingFollow) {
        toast.info('You are already following this user');
        return true;
      }

      // Insert follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({ 
          follower_id: currentUser.user.id,
          following_id: followingId 
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    }
  },

  unfollowUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        toast.error('You must be logged in to unfollow users');
        return false;
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ 
          follower_id: currentUser.user.id,
          following_id: followingId 
        });

      if (error) throw error;
      toast.success('User unfollowed successfully');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    }
  }
};
