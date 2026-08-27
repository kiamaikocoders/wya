
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const followOperations = {
  followUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in to follow users');
      }

      const followingUuid = followingId.toString();

      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id, status')
        .match({
          follower_id: currentUser.user.id,
          following_id: followingUuid
        })
        .maybeSingle();

      if (existingFollow) {
        toast.info('You already sent a request or follow this person');
        return false;
      }

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.user.id,
          following_id: followingUuid,
          status: 'pending',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to send friend request');
      throw error;
    }
  },

  unfollowUser: async (followingId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in to unfollow users');
      }

      const followingUuid = followingId.toString();

      const { error } = await supabase
        .from('follows')
        .delete()
        .match({
          follower_id: currentUser.user.id,
          following_id: followingUuid
        });

      if (error) throw error;
      toast.success('Removed');
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
      const { data, error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .match({
          follower_id: followerId,
          following_id: currentUser.user.id,
          status: 'pending',
        })
        .select('id');
      if (error) throw error;
      if (!data?.length) {
        throw new Error('No pending request to accept');
      }
      toast.success('Friend request accepted');
      return true;
    } catch (error) {
      console.error('Error accepting follow:', error);
      toast.error('Failed to accept request');
      throw error;
    }
  },

  declineFollow: async (followerId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) {
        throw new Error('You must be logged in');
      }
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({
          follower_id: followerId,
          following_id: currentUser.user.id,
          status: 'pending',
        });
      if (error) throw error;
      toast.success('Request declined');
      return true;
    } catch (error) {
      console.error('Error declining follow:', error);
      toast.error('Failed to decline request');
      throw error;
    }
  },
};
