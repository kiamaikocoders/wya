
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

const MessageInput = ({ onSendMessage, isLoading }: MessageInputProps) => {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full gap-2 p-4 border-t">
      <Input
        type="text"
        placeholder="Type a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" disabled={isLoading}>
        <Send size={18} className="mr-2" />
        Send
      </Button>
    </form>
  );
};

export default MessageInput;
