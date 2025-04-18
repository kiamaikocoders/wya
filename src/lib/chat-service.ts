
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

export const chatService = {
  getConversations: async (): Promise<ChatConversation[]> => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform messages into conversations
      const conversations: { [key: string]: ChatConversation } = {};
      
      messages.forEach(message => {
        const otherUser = message.sender_id === supabase.auth.user()?.id 
          ? message.receiver 
          : message.sender;

        if (!conversations[otherUser.id]) {
          conversations[otherUser.id] = {
            id: parseInt(message.id),
            participants: [{
              id: otherUser.id,
              name: otherUser.full_name,
              avatar_url: otherUser.avatar_url
            }],
            last_message: {
              content: message.content,
              sender_id: message.sender_id,
              created_at: message.created_at
            },
            unread_count: message.is_read ? 0 : 1,
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

  getMessages: async (conversationId: number): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  sendMessage: async (conversationId: number, { content }: { content: string }) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_id: supabase.auth.user()?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  subscribeToMessages: (conversationId: number, onNewMessage: (message: any) => void) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        payload => {
          onNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
