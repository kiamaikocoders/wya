
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

    const created = await followOperations.followUser(followingId);

    if (created) {
      await followNotifications.sendFollowNotification(followingId, currentUser.user.id);
    }

    return true;
  },

  unfollowUser: followOperations.unfollowUser,
  acceptFollow: followOperations.acceptFollow,
  declineFollow: followOperations.declineFollow,
  getFollowers: followQueries.getFollowers,
  getFollowing: followQueries.getFollowing,
  isFollowing: followQueries.isFollowing,
  getFollowRelation: followQueries.getFollowRelation,
  getOutgoingPendingIds: followQueries.getOutgoingPendingIds,
  getIncomingRequests: followQueries.getIncomingRequests,
  countIncomingRequests: followQueries.countIncomingRequests,
  canMessage: messagingPermissions.canMessage
};

export type { Follow, FollowRelation, FollowRequestProfile } from './types';
