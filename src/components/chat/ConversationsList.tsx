
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@lucide-react';
import { ChatConversation } from '@/lib/chat-service';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationsListProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  activeView: string;
  onViewChange: (view: string) => void;
}

const ConversationsList = ({
  conversations,
  activeConversationId,
  activeView,
  onViewChange
}: ConversationsListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredConversations = activeView === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.unread_count > 0);

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button variant="ghost" size="icon">
            <Search size={18} />
          </Button>
        </div>
        
        <Tabs value={activeView} onValueChange={onViewChange} className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
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
                    ${conversation.id.toString() === activeConversationId ? 'bg-accent' : 'hover:bg-muted'}
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
    </div>
  );
};

export default ConversationsList;
