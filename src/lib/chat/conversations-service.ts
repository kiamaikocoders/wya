
import { supabase } from "@/integrations/supabase/client";
import { ChatConversation } from "./types";

export const conversationsService = {
  getConversations: async (): Promise<ChatConversation[]> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUser.user.id},receiver_id.eq.${currentUser.user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations: { [key: string]: ChatConversation } = {};
      
      messages.forEach(message => {
        const isUserSender = message.sender_id === currentUser.user.id;
        const otherUser = isUserSender ? message.receiver : message.sender;
        const otherUserId = isUserSender ? message.receiver_id : message.sender_id;
        
        if (!conversations[otherUserId]) {
          conversations[otherUserId] = {
            id: parseInt(message.id),
            participants: [{
              id: otherUserId,
              name: otherUser.full_name,
              avatar_url: otherUser.avatar_url
            }],
            last_message: {
              content: message.content,
              sender_id: message.sender_id,
              created_at: message.created_at
            },
            unread_count: !isUserSender && !message.is_read ? 1 : 0,
            updated_at: message.created_at
          };
        }
      });

      return Object.values(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
};
