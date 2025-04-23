
export interface ChatParticipant {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
  sender?: ChatParticipant;
  receiver?: ChatParticipant;
  updated_at?: string;
}

export interface ChatConversation {
  id: number;
  participants: ChatParticipant[];
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
}
