
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const messageService = {
  sendMessage: async (receiverId: string, content: string): Promise<Message | null> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ receiver_id: receiverId, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  },

  getMessages: async (userId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  markAsRead: async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  },

  subscribeToMessages: (userId: string, onNewMessage: (message: Message) => void) => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
