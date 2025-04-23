
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";

export const realtimeService = {
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
        async (payload) => {
          // Fetch the complete message data with sender and receiver info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
              receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const message: ChatMessage = {
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
            onNewMessage(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
