
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { notificationService } from "@/lib/notification";

export const followNotifications = {
  sendFollowNotification: async (followingId: string, currentUserId: string): Promise<void> => {
    try {
      // Ensure IDs are properly formatted as UUID strings
      const followingUuid = followingId.toString();
      const currentUserUuid = currentUserId.toString();

      // Get follower's profile info for notification (person doing the following)
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', currentUserUuid)
        .single();

      // Get followed user's profile info for toast message (person being followed)
      const { data: followedProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', followingUuid)
        .single();

      const followerName = followerProfile?.full_name || followerProfile?.username || 'Someone';
      const followedName = followedProfile?.full_name || followedProfile?.username || 'this user';
      const followerIdentifier = followerProfile?.username || currentUserUuid;

      // Send notification to the followed user
      const notificationData = {
        user_id: followingUuid,
        type: 'follow' as const,
        title: 'New Follower',
        message: `${followerName} started following you`,
        resource_type: 'user',
        resource_uuid: currentUserUuid,
        link: `/users/${followerIdentifier}`,
        data: {
          follower_id: currentUserUuid,
          follower_name: followerName,
        },
      };

      await notificationService.createNotification(notificationData);
      console.log('Follow notification sent successfully');
      toast.success(`You are now following ${followedName}`);
    } catch (notifError) {
      console.error('Error sending follow notification:', notifError);
      toast.error('Follow saved, but the user was not notified. Check notification setup.');
    }
  }
};
