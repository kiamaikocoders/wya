
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface AINameSuggestionsProps {
  category?: string;
  description?: string;
  onSelect: (name: string) => void;
}

const AINameSuggestions: React.FC<AINameSuggestionsProps> = ({ 
  category = '', 
  description = '', 
  onSelect 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  
  const generateSuggestions = async () => {
    if (!category && !description && !keyword) {
      toast.error('Please provide a category, description, or keyword');
      return;
    }
    
    setIsLoading(true);
    try {
      const prompt = `Suggest 5 catchy and creative event names ${category ? `for a ${category} event` : ''} 
        ${description ? `with this description: ${description}` : ''} 
        ${keyword ? `including the keyword: ${keyword}` : ''}. 
        Respond with only the event names, separated by commas.`;
      
      const result = await aiService.generateStoryContent(prompt);
      const names = result.split(',').map(name => name.trim());
      
      if (names.length > 0) {
        setSuggestions(names);
        toast.success('Generated name suggestions!');
      } else {
        toast.error('Failed to generate names. Please try again.');
      }
    } catch (error) {
      console.error('Error generating name suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border border-dashed border-kenya-orange/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Event Name Suggestions
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate creative name ideas for your event
        </p>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter a keyword (optional)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={generateSuggestions}
            disabled={isLoading}
            className="bg-kenya-orange hover:bg-kenya-orange/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="font-medium">Suggested names:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((name, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-2 border-kenya-orange/30 hover:bg-kenya-orange/10"
                  onClick={() => onSelect(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        Click on any suggestion to select it
      </CardFooter>
    </Card>
  );
};

export default AINameSuggestions;
