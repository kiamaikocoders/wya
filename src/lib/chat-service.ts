
import { supabase } from "@/integrations/supabase/client";

export interface ChatConversation {
  id: number;
  participants: {
    id: string;
    name: string;
    avatar_url?: string;
  }[];
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const chatService = {
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

      // Transform messages into conversations
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

  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) return [];
      
      const participantId = conversationId.toString();

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(
          `and(sender_id.eq.${currentUser.user.id},receiver_id.eq.${participantId}),` +
          `and(sender_id.eq.${participantId},receiver_id.eq.${currentUser.user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  sendMessage: async (conversationId: number, { content }: { content: string }): Promise<ChatMessage> => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) throw new Error('User not authenticated');

      const receiverId = conversationId.toString();
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: currentUser.user.id,
          receiver_id: receiverId,
          is_read: false
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as ChatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  subscribeToMessages: (conversationId: number, onNewMessage: (message: ChatMessage) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${conversationId}`
        },
        payload => {
          onNewMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  },

  markAsRead: async (messageId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
};
