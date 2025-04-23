
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { conversationsService } from '@/lib/chat';
import { useQuery } from '@tanstack/react-query';

interface ChatButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ 
  variant = 'ghost', 
  showLabel = false 
}) => {
  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['unreadChatCount'],
    queryFn: conversationsService.getUnreadCount,
    refetchInterval: 60000, // Refetch every minute
  });
  
  return (
    <Link to="/chat">
      <Button variant={variant} className="relative">
        <MessageCircle size={24} />
        {showLabel && <span className="ml-2">Messages</span>}
        
        {!isLoading && unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-kenya-orange text-white border-0"
            variant="default"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};

export default ChatButton;
