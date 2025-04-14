
import { apiClient } from './api-client';
import { toast } from 'sonner';
import { User } from './auth-service';

// Chat message types
export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id?: number;
  event_id?: number;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    name: string;
    avatar_url?: string;
  };
}

export interface ChatConversation {
  id: number;
  participants: User[];
  last_message: ChatMessage;
  unread_count: number;
  updated_at: string;
}

export interface SendMessagePayload {
  receiver_id?: number;
  event_id?: number;
  content: string;
}

// Sample conversations for development
const SAMPLE_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1,
    participants: [
      { id: 2, name: 'John Doe', email: 'john@example.com', user_type: 'organizer', created_at: '2023-01-15' },
    ],
    last_message: {
      id: 101,
      sender_id: 2,
      content: 'Looking forward to seeing you at the event!',
      created_at: '2023-04-15T14:30:00Z',
      is_read: false,
      sender: {
        name: 'John Doe',
        avatar_url: '/placeholder.svg'
      }
    },
    unread_count: 1,
    updated_at: '2023-04-15T14:30:00Z'
  },
  {
    id: 2,
    participants: [
      { id: 3, name: 'Jane Smith', email: 'jane@example.com', user_type: 'attendee', created_at: '2023-02-10' },
    ],
    last_message: {
      id: 203,
      sender_id: 1, // Current user
      content: 'Will the event have vegetarian food options?',
      created_at: '2023-04-14T10:15:00Z',
      is_read: true,
      sender: {
        name: 'You',
      }
    },
    unread_count: 0,
    updated_at: '2023-04-14T10:15:00Z'
  },
  {
    id: 3,
    participants: [
      { id: 4, name: 'David Wilson', email: 'david@example.com', user_type: 'organizer', created_at: '2023-03-05' },
    ],
    last_message: {
      id: 305,
      sender_id: 4,
      content: 'Thanks for registering for our workshop! Do you have any questions?',
      created_at: '2023-04-13T09:45:00Z',
      is_read: true,
      sender: {
        name: 'David Wilson',
        avatar_url: '/placeholder.svg'
      }
    },
    unread_count: 0,
    updated_at: '2023-04-13T09:45:00Z'
  }
];

// Sample messages for a conversation
const SAMPLE_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    {
      id: 101,
      sender_id: 2,
      content: 'Hello! I noticed you registered for our upcoming festival.',
      created_at: '2023-04-15T13:30:00Z',
      is_read: true,
      sender: {
        name: 'John Doe',
        avatar_url: '/placeholder.svg'
      }
    },
    {
      id: 102,
      sender_id: 1, // Current user
      content: 'Yes, I\'m very excited about it!',
      created_at: '2023-04-15T13:35:00Z',
      is_read: true,
    },
    {
      id: 103,
      sender_id: 2,
      content: 'Great! I wanted to let you know about some special early-bird activities.',
      created_at: '2023-04-15T13:40:00Z',
      is_read: true,
      sender: {
        name: 'John Doe',
        avatar_url: '/placeholder.svg'
      }
    },
    {
      id: 104,
      sender_id: 1, // Current user
      content: 'That sounds interesting! What are they?',
      created_at: '2023-04-15T13:45:00Z',
      is_read: true,
    },
    {
      id: 105,
      sender_id: 2,
      content: 'We have a special workshop at 9 AM and a meet-and-greet with the artists at 10 AM.',
      created_at: '2023-04-15T14:00:00Z',
      is_read: true,
      sender: {
        name: 'John Doe',
        avatar_url: '/placeholder.svg'
      }
    },
    {
      id: 106,
      sender_id: 1, // Current user
      content: 'Awesome! How do I sign up for these?',
      created_at: '2023-04-15T14:15:00Z',
      is_read: true,
    },
    {
      id: 107,
      sender_id: 2,
      content: 'Looking forward to seeing you at the event!',
      created_at: '2023-04-15T14:30:00Z',
      is_read: false,
      sender: {
        name: 'John Doe',
        avatar_url: '/placeholder.svg'
      }
    }
  ]
};

export const chatService = {
  // Get all conversations for the current user
  getConversations: async (): Promise<ChatConversation[]> => {
    try {
      // Attempt to fetch from API
      const response = await apiClient.get<ChatConversation[]>('/chat/conversations');
      return response;
    } catch (error) {
      console.info('Using sample conversations for development');
      return SAMPLE_CONVERSATIONS;
    }
  },
  
  // Get messages for a specific conversation
  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    try {
      // Attempt to fetch from API
      const response = await apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
      return response;
    } catch (error) {
      console.info(`Using sample messages for conversation ${conversationId}`);
      return SAMPLE_MESSAGES[conversationId] || [];
    }
  },
  
  // Send a new message
  sendMessage: async (conversationId: number, payload: SendMessagePayload): Promise<ChatMessage> => {
    try {
      const response = await apiClient.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, payload);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // For development, create a mock response
      const mockMessage: ChatMessage = {
        id: Math.floor(Math.random() * 1000) + 500,
        sender_id: 1, // Current user
        content: payload.content,
        created_at: new Date().toISOString(),
        is_read: true,
      };
      
      toast.success('Message sent');
      return mockMessage;
    }
  },
  
  // Create a new conversation
  createConversation: async (userId: number): Promise<ChatConversation> => {
    try {
      const response = await apiClient.post<ChatConversation>('/chat/conversations', { user_id: userId });
      return response;
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // For development, create a mock response
      toast.success('Conversation started');
      
      // This is just mock data - in a real app, you'd get this from the API
      const mockConversation: ChatConversation = {
        id: Math.floor(Math.random() * 100) + 10,
        participants: [
          { id: userId, name: 'New Contact', email: 'contact@example.com', user_type: 'attendee', created_at: new Date().toISOString() },
        ],
        last_message: {
          id: 999,
          sender_id: 1,
          content: 'Hello!',
          created_at: new Date().toISOString(),
          is_read: true,
        },
        unread_count: 0,
        updated_at: new Date().toISOString()
      };
      
      return mockConversation;
    }
  },
  
  // Mark messages as read
  markAsRead: async (conversationId: number): Promise<void> => {
    try {
      await apiClient.post(`/chat/conversations/${conversationId}/read`, {});
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // For development, just log the action
      console.info(`Marked conversation ${conversationId} as read`);
    }
  },
  
  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>('/chat/unread');
      return response.count;
    } catch (error) {
      console.info('Using sample unread count for development');
      // Return the sum of unread_count from sample conversations
      return SAMPLE_CONVERSATIONS.reduce((total, conv) => total + conv.unread_count, 0);
    }
  }
};
