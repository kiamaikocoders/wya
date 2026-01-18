
import { followOperations } from './follow-operations';
import { followQueries } from './follow-queries';
import { messagingPermissions } from './messaging-permissions';
import { followNotifications } from './follow-notifications';
import { supabase } from "@/lib/supabase";

export const followService = {
  followUser: async (followingId: string): Promise<boolean> => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('You must be logged in to follow users');
    }

    const success = await followOperations.followUser(followingId);
    
    if (success) {
      // Send notification after successful follow
      await followNotifications.sendFollowNotification(followingId, currentUser.user.id);
    }
    
    return success;
  },

  unfollowUser: followOperations.unfollowUser,
  getFollowers: followQueries.getFollowers,
  getFollowing: followQueries.getFollowing,
  isFollowing: followQueries.isFollowing,
  canMessage: messagingPermissions.canMessage
};

// Export types
export type { Follow } from './types';
