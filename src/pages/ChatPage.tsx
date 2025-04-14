
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Send, User, Phone, VideoIcon, Info, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, ChatMessage, ChatConversation } from '@/lib/chat-service';
import { toast } from 'sonner';

const ChatPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [activeView, setActiveView] = useState('all');
  
  // Query for fetching all conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatService.getConversations,
  });
  
  // Query for fetching messages in the current conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationId ? chatService.getMessages(parseInt(conversationId)) : Promise.resolve([]),
    enabled: !!conversationId,
  });
  
  // Current conversation
  const currentConversation = conversationId 
    ? conversations.find(c => c.id === parseInt(conversationId)) 
    : null;
  
  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('No conversation selected');
      return chatService.sendMessage(parseInt(conversationId), { content });
    },
    onSuccess: (newMessage) => {
      // Update the messages cache
      queryClient.setQueryData(['messages', conversationId], (oldMessages: ChatMessage[] = []) => [...oldMessages, newMessage]);
      
      // Update the conversations list to show the new last message
      queryClient.setQueryData(['conversations'], (oldConversations: ChatConversation[] = []) => {
        return oldConversations.map(conv => {
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
      toast.error('Failed to send message. Please try again.');
    }
  });
  
  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId) {
      chatService.markAsRead(parseInt(conversationId))
        .then(() => {
          // Update unread count in the conversations list
          queryClient.setQueryData(['conversations'], (oldConversations: ChatConversation[] = []) => {
            return oldConversations.map(conv => {
              if (conv.id.toString() === conversationId) {
                return {
                  ...conv,
                  unread_count: 0
                };
              }
              return conv;
            });
          });
        });
    }
  }, [conversationId, queryClient]);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText.trim());
    setMessageText('');
  };
  
  // Filter conversations based on active view
  const filteredConversations = activeView === 'all' 
    ? conversations 
    : activeView === 'unread' 
      ? conversations.filter(conv => conv.unread_count > 0)
      : conversations;
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Button variant="ghost" size="icon">
                  <Search size={18} />
                </Button>
              </div>
              
              <Tabs value={activeView} onValueChange={setActiveView} className="mt-2">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-2">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map(conversation => {
                    const otherParticipant = conversation.participants[0];
                    return (
                      <div 
                        key={conversation.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg cursor-pointer
                          ${conversation.id.toString() === conversationId ? 'bg-accent' : 'hover:bg-muted'}
                          ${conversation.unread_count > 0 ? 'dark:bg-kenya-brown/50' : ''}
                          transition-colors
                        `}
                        onClick={() => navigate(`/chat/${conversation.id}`)}
                      >
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt={otherParticipant.name} />
                          <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(conversation.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                              {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                              {conversation.last_message.content}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="bg-kenya-orange text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <User size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No conversations yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Start chatting with event organizers or attendees
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2">
          {currentConversation ? (
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden"
                      onClick={() => navigate('/chat')}
                    >
                      <ArrowLeft size={18} />
                    </Button>
                    <Avatar>
                      <AvatarImage 
                        src="/placeholder.svg" 
                        alt={currentConversation.participants[0].name} 
                      />
                      <AvatarFallback>
                        {currentConversation.participants[0].name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-medium">{currentConversation.participants[0].name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {currentConversation.participants[0].user_type === 'organizer' ? 'Event Organizer' : 'Attendee'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <VideoIcon size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Info size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={18} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <div 
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={message.sender?.avatar_url || '/placeholder.svg'} 
                                alt={message.sender?.name || 'User'} 
                              />
                              <AvatarFallback>
                                {message.sender?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div 
                              className={`
                                px-4 py-2 rounded-2xl 
                                ${isCurrentUser 
                                  ? 'bg-kenya-orange text-white rounded-tr-none' 
                                  : 'bg-muted rounded-tl-none'
                                }
                              `}
                            >
                              <p>{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-2">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>
              
              <CardFooter className="p-4 border-t mt-auto">
                <form onSubmit={handleSendMessage} className="flex items-center w-full gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={sendMessageMutation.isPending}>
                    <Send size={18} className="mr-2" />
                    Send
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="bg-muted inline-flex p-6 rounded-full mb-4">
                  <MessageIcon size={48} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium mb-2">Select a conversation</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choose a conversation from the list to start chatting with event organizers and attendees.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom message icon
const MessageIcon = ({ size = 24, className = '' }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default ChatPage;
