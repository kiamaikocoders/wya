
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AIPostEnhancerProps {
  initialContent: string;
  onEnhance: (enhancedContent: string) => void;
}

const AIPostEnhancer: React.FC<AIPostEnhancerProps> = ({ initialContent, onEnhance }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const handleEnhance = async () => {
    if (!initialContent) {
      toast.error('Please write some content first');
      return;
    }
    
    setIsEnhancing(true);
    try {
      const result = await aiService.enhanceDescription(initialContent);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      onEnhance(result.text);
      toast.success('Content enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing content:', error);
      toast.error('Failed to enhance content. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  const generateTags = async () => {
    if (!initialContent) {
      toast.error('Please write some content first');
      return;
    }
    
    setIsEnhancing(true);
    try {
      const tags = await aiService.generateTags(initialContent);
      
      if (tags.length === 0) {
        toast.error('Could not generate tags. Please try again.');
        return;
      }
      
      // Format the tags as a string to append to the post
      const tagsText = `\n\nTags: ${tags.join(', ')}`;
      onEnhance(initialContent + tagsText);
      toast.success('Tags added successfully!');
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error('Failed to generate tags. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  return (
    <Card className="bg-kenya-brown/5 border-dashed border-kenya-orange/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-kenya-orange" />
          AI Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-3">
          Enhance your post with AI assistance
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnhance}
          disabled={isEnhancing || !initialContent}
          className="text-kenya-orange border-kenya-orange/50 hover:bg-kenya-orange/10"
        >
          {isEnhancing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-4 w-4" />
              Enhance Text
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={generateTags}
          disabled={isEnhancing || !initialContent}
          className="text-kenya-orange border-kenya-orange/50 hover:bg-kenya-orange/10"
        >
          {isEnhancing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-4 w-4" />
              Generate Tags
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIPostEnhancer;
