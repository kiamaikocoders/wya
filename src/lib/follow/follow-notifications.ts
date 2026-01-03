
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

      const success = await notificationService.createNotification(notificationData);
      if (success) {
        console.log('Follow notification sent successfully');
        toast.success(`You are now following ${followedName}`);
      } else {
        console.error('Failed to send follow notification');
        toast.success(`You are now following ${followedName}`);
      }
    } catch (notifError) {
      console.error('Error sending follow notification:', notifError);
      // Don't fail the follow action if notification fails
      toast.success('Follow successful');
    }
  }
};
