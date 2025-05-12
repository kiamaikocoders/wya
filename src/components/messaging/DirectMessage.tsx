
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Image, Paperclip, Smile, Loader2, Video, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string; // Changed from number to string
  receiver_id: string; // Changed from number to string
  content: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file' | 'location' | 'event';
  created_at: string;
  is_read: boolean;
  event_data?: {
    event_id: number;
    title: string;
    date: string;
    location: string;
  };
}

interface User {
  id: string; // Changed from number to string
  name: string;
  profile_picture?: string;
  last_seen?: string;
  is_online?: boolean;
}

interface DirectMessageProps {
  recipientId: string; // Changed from number to string
  recipientName: string;
  recipientAvatar?: string;
  onClose?: () => void;
  initialMessages?: Message[];
}

const DirectMessage: React.FC<DirectMessageProps> = ({ 
  recipientId, 
  recipientName, 
  recipientAvatar, 
  onClose,
  initialMessages = []
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipient, setRecipient] = useState<User>({
    id: recipientId,
    name: recipientName,
    profile_picture: recipientAvatar,
    is_online: Math.random() > 0.5 // Randomly set online status for demo
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        sender_id: recipientId,
        receiver_id: user?.id || '',
        content: `Hi there! I'm ${recipientName}. How can I help you?`,
        created_at: new Date().toISOString(),
        is_read: true
      };
      
      setMessages([welcomeMessage]);
    }
  }, [messages.length, recipientId, recipientName, user?.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    
    const message: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      receiver_id: recipientId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    setTimeout(() => {
      setIsLoading(false);
      
      if (Math.random() > 0.3) {
        const responseMessages = [
          "Thanks for reaching out! How can I assist you with this event?",
          "I'll check and get back to you on this shortly.",
          "Great to hear from you! Do you have any specific questions?",
          "I appreciate your interest! Would you like more details?",
          "Thanks for your message. Can you provide more information?",
          "I'll be happy to help you with that request."
        ];
        
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender_id: recipientId,
          receiver_id: user?.id || '',
          content: responseMessages[Math.floor(Math.random() * responseMessages.length)],
          created_at: new Date(Date.now() + 1000).toISOString(),
          is_read: true
        };
        
        setTimeout(() => {
          setMessages(prevMessages => [...prevMessages, responseMessage]);
        }, 1500);
      }
    }, 1000);
  };

  const handleAttachImage = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && imageUrl.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender_id: user?.id || '',
        receiver_id: recipientId,
        content: '',
        attachment_url: imageUrl.trim(),
        attachment_type: 'image',
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      setMessages([...messages, message]);
    }
  };

  const handleAttachLocation = () => {
    const location = prompt('Enter location:');
    if (location && location.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender_id: user?.id || '',
        receiver_id: recipientId,
        content: `📍 I'm at ${location.trim()}`,
        attachment_type: 'location',
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      setMessages([...messages, message]);
    }
  };

  const handleShareEvent = () => {
    const eventData = {
      event_id: 123,
      title: 'Nairobi International Jazz Festival',
      date: '2024-06-15T18:00:00Z',
      location: 'Carnivore Grounds, Nairobi'
    };
    
    const message: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      receiver_id: recipientId,
      content: 'Check out this event!',
      attachment_type: 'event',
      created_at: new Date().toISOString(),
      is_read: false,
      event_data: eventData
    };
    
    setMessages([...messages, message]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, 'h:mm a');
    } else if (diffDays === 1) {
      return 'Yesterday ' + format(date, 'h:mm a');
    } else if (diffDays < 7) {
      return format(date, 'EEEE h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    return (
      <div 
        key={message.id} 
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={recipient.profile_picture} />
            <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={`max-w-[80%] ${
            isOwnMessage 
              ? 'bg-kenya-orange/90 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
              : 'bg-kenya-brown-dark/80 text-white rounded-tl-lg rounded-tr-lg rounded-br-lg'
          } p-3 shadow`}
        >
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          
          {message.attachment_type === 'image' && message.attachment_url && (
            <div className="mt-2">
              <img 
                src={message.attachment_url} 
                alt="Attachment" 
                className="max-w-full rounded-md max-h-60 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/400x300?text=Invalid+Image';
                }} 
              />
            </div>
          )}
          
          {message.attachment_type === 'event' && message.event_data && (
            <div className="mt-2 p-3 bg-black/20 rounded-md">
              <h4 className="font-medium">{message.event_data.title}</h4>
              <div className="flex items-center mt-1 text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{format(new Date(message.event_data.date), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="flex items-center mt-1 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{message.event_data.location}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full bg-white/10 hover:bg-white/20"
              >
                View Event
              </Button>
            </div>
          )}
          
          <div className={`text-xs mt-1 opacity-70 ${isOwnMessage ? 'text-right' : ''}`}>
            {formatMessageTime(message.created_at)}
            {isOwnMessage && message.is_read && (
              <span className="ml-2">✓</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden bg-kenya-brown/10">
      <CardHeader className="py-3 px-4 border-b border-kenya-brown-dark flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={recipient.profile_picture} />
              <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{recipient.name}</CardTitle>
              <div className="flex items-center">
                {recipient.is_online ? (
                  <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                    Online
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Last seen {recipient.last_seen || 'recently'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 border-t border-kenya-brown-dark flex-shrink-0">
        <div className="flex items-end w-full gap-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleAttachImage}
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleAttachLocation}
            >
              <MapPin className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleShareEvent}
            >
              <Calendar className="h-5 w-5" />
            </Button>
          </div>
          <Button
            type="button"
            size="icon"
            className="h-[60px]"
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DirectMessage;
