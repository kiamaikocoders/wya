
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { notificationService } from "@/lib/notification";

export const followNotifications = {
  sendFollowNotification: async (followingId: string, currentUserId: string): Promise<void> => {
    try {
      // Get follower's profile info for notification
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', currentUserId)
        .single();

      const followerName = followerProfile?.full_name || followerProfile?.username || 'Someone';

      // Send notification to the followed user
      const notificationData = {
        user_id: followingId,
        type: 'follow' as const,
        title: 'New Follower',
        message: `${followerName} started following you`,
        resource_type: 'user',
        resource_id: parseInt(currentUserId),
        data: {
          follower_id: currentUserId,
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
    }
  }
};
