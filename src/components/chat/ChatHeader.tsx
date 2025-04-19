
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, VideoIcon, Info, MoreVertical } from 'lucide-react';
import { User } from '@/lib/auth-service';

interface ChatHeaderProps {
  participant: User | {
    id: string;
    name: string;
    avatar_url?: string;
    email: string;
    user_type: string;
    created_at: string;
  };
  showBackButton?: boolean;
}

const ChatHeader = ({ participant, showBackButton }: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt={participant.name} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{participant.name}</h2>
            <p className="text-xs text-muted-foreground">
              {participant.user_type === 'organizer' ? 'Event Organizer' : 'Attendee'}
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
    </div>
  );
};

export default ChatHeader;
