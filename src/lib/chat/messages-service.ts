
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";

export const messagesService = {
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
      
      return data.map(message => ({
        ...message,
        sender: message.sender ? {
          id: message.sender.id,
          name: message.sender.full_name,
          avatar_url: message.sender.avatar_url
        } : undefined,
        receiver: message.receiver ? {
          id: message.receiver.id,
          name: message.receiver.full_name,
          avatar_url: message.receiver.avatar_url
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  sendMessage: async (conversationId: number, content: string): Promise<ChatMessage> => {
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
      
      return {
        ...data,
        sender: data.sender ? {
          id: data.sender.id,
          name: data.sender.full_name,
          avatar_url: data.sender.avatar_url
        } : undefined,
        receiver: data.receiver ? {
          id: data.receiver.id,
          name: data.receiver.full_name,
          avatar_url: data.receiver.avatar_url
        } : undefined
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
