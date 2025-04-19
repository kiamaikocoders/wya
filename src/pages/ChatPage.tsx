
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/lib/chat-service';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { toast } from 'sonner';

const ChatPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('all');
  
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatService.getConversations,
  });
  
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationId ? chatService.getMessages(parseInt(conversationId)) : Promise.resolve([]),
    enabled: !!conversationId,
  });
  
  const currentConversation = conversationId 
    ? conversations.find(c => c.id === parseInt(conversationId)) 
    : null;
  
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('No conversation selected');
      return chatService.sendMessage(parseInt(conversationId), { content });
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['messages', conversationId], (oldMessages: any = []) => [...oldMessages, newMessage]);
      queryClient.setQueryData(['conversations'], (oldConversations: any = []) => {
        return oldConversations.map((conv: any) => {
          if (conv.id.toString() === conversationId) {
            return {
              ...conv,
              last_message: newMessage,
              updated_at: newMessage.created_at
            };
          }
          return conv;
        });
      });
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <ConversationsList
              conversations={conversations}
              activeConversationId={conversationId}
              activeView={activeView}
              onViewChange={setActiveView}
            />
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {currentConversation ? (
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <ChatHeader 
                participant={{
                  ...currentConversation.participants[0],
                  email: "",
                  user_type: "attendee",
                  created_at: new Date().toISOString()
                }}
                showBackButton
              />
              
              <MessageList messages={messages} />
              
              <MessageInput 
                onSendMessage={(content) => sendMessageMutation.mutate(content)}
                isLoading={sendMessageMutation.isPending}
              />
            </Card>
          ) : (
            <Card className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
              <div className="text-center p-8">
                <div className="bg-muted inline-flex p-6 rounded-full mb-4">
                  <MessageCircle size={48} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium mb-2">Select a conversation</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choose a conversation from the list to start chatting with event organizers and attendees.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
