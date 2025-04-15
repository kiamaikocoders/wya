
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIStoryGeneratorProps {
  onGenerate: (text: string) => void;
}

const AIStoryGenerator: React.FC<AIStoryGeneratorProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setIsGenerating(true);
    try {
      // Use the aiService to get a story recommendation
      const promptText = `Write a short, engaging story or caption about this event experience (60-100 words): ${prompt}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY || 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: promptText
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      onGenerate(generatedText);
      setPrompt('');
      toast.success('Story generated successfully!');
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card className="border border-dashed border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Story Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Describe your event experience or what you'd like to share..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
          disabled={isGenerating}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="bg-kenya-orange hover:bg-kenya-orange/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Story
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIStoryGenerator;
