
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { notificationService } from "@/lib/notification";

export const followNotifications = {
  sendFollowNotification: async (followingId: string, currentUserId: string): Promise<void> => {
    try {
      // Ensure IDs are properly formatted as UUID strings
      const followingUuid = followingId.toString();
      const currentUserUuid = currentUserId.toString();

      // Get follower's profile info for notification
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', currentUserUuid)
        .single();

      const followerName = followerProfile?.full_name || followerProfile?.username || 'Someone';

      // Send notification to the followed user
      const notificationData = {
        user_id: followingUuid,
        type: 'follow' as const,
        title: 'New Follower',
        message: `${followerName} started following you`,
        resource_type: 'user',
        resource_id: parseInt(currentUserUuid.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to int for resource_id
        data: {
          follower_id: currentUserUuid,
          follower_name: followerName
        }
      };

      const success = await notificationService.createNotification(notificationData);
      if (success) {
        console.log('Follow notification sent successfully');
        toast.success(`You are now following ${followerName}`);
      } else {
        console.error('Failed to send follow notification');
        toast.success(`You are now following ${followerName}`);
      }
    } catch (notifError) {
      console.error('Error sending follow notification:', notifError);
      // Don't fail the follow action if notification fails
      toast.success('Follow successful');
    }
  }
};
