
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const followOperations = {
  followUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in to follow users');
      }

      // Ensure followingId is a valid UUID string
      const followingUuid = followingId.toString();

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .match({ 
          follower_id: currentUser.user.id,
          following_id: followingUuid 
        })
        .maybeSingle();

      if (existingFollow) {
        toast.info('You already sent a request or follow this person');
        return true;
      }

      // Insert follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.user.id,
          following_id: followingUuid,
          status: 'pending',
        });

      if (error && /status/i.test(error.message)) {
        const retry = await supabase.from('follows').insert({
          follower_id: currentUser.user.id,
          following_id: followingUuid,
        });
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }
      toast.success('Friend request sent');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      throw error;
    }
  },

  unfollowUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in to unfollow users');
      }

      // Ensure followingId is a valid UUID string
      const followingUuid = followingId.toString();

      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ 
          follower_id: currentUser.user.id,
          following_id: followingUuid 
        });

      if (error) throw error;
      toast.success('User unfollowed successfully');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      throw error;
    }
  },

  acceptFollow: async (followerId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in');
      }
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .match({ follower_id: followerId, following_id: currentUser.user.id });
      if (error) throw error;
      toast.success('Friend request accepted');
      return true;
    } catch (error) {
      console.error('Error accepting follow:', error);
      toast.error('Failed to accept request');
      throw error;
    }
  },
};
