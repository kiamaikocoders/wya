
import { supabase } from "@/lib/supabase";

export const messagingPermissions = {
  // Check if users follow each other (for messaging permissions)
  canMessage: async (userId: string): Promise<boolean> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return false;
      
      // Ensure userId is a valid UUID string
      const targetUserId = userId.toString();
      
      // Check if current user follows the target user
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('id')
        .match({ 
          follower_id: currentUser.user.id,
          following_id: targetUserId 
        })
        .maybeSingle();

      if (followingError) return false;
      
      // Check if target user follows current user back
      const { data: follower, error: followerError } = await supabase
        .from('follows')
        .select('id')
        .match({ 
          follower_id: targetUserId,
          following_id: currentUser.user.id 
        })
        .maybeSingle();

      if (followerError) return false;

      // Users can message if they follow each other
      return !!(following && follower);
    } catch (error) {
      console.error('Error checking messaging permissions:', error);
      return false;
    }
  }
};
