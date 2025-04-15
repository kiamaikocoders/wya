
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, User, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AIEventAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your event planning assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await aiService.getEventPlanningAdvice(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      toast.error('Failed to get a response. Please try again.');
      
      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Could you try again in a moment?",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getExampleQuestions = () => [
    'How do I organize a successful music event?',
    'What are the best venues in Nairobi?',
    'How much should I budget for catering?',
    'What permits do I need for an outdoor event?'
  ];
  
  const handleExampleClick = (question: string) => {
    setInput(question);
  };
  
  return (
    <Card className="flex flex-col h-[500px] border-kenya-brown/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          Event Planning Assistant
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-kenya-orange text-white'
                    : 'bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-xs opacity-80">
                    {message.sender === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {messages.length === 1 && (
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground mb-2">Try asking about:</p>
          <div className="flex flex-wrap gap-2">
            {getExampleQuestions().map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleExampleClick(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Ask about event planning..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-kenya-orange hover:bg-kenya-orange/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIEventAssistant;
