
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIEventCategorizerProps {
  title: string;
  description: string;
  onSelectCategory: (category: string) => void;
}

interface CategorySuggestion {
  name: string;
  confidence: number;
}

const AIEventCategorizer: React.FC<AIEventCategorizerProps> = ({ 
  title, 
  description, 
  onSelectCategory 
}) => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const analyzeCategories = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await aiService.suggestEventCategories(description, title);
      setSuggestions(result);
    } catch (error) {
      console.error('Error analyzing categories:', error);
      toast.error('Could not analyze categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [description, title]);

  useEffect(() => {
    if (title && description) {
      void analyzeCategories();
    }
  }, [analyzeCategories, title, description]);
  
  if (!title || !description) {
    return null;
  }
  
  return (
    <Card className="border border-dashed border-primary/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Category Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 text-kenya-orange animate-spin" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on your event details, we suggest these categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.name}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-kenya-brown/10 hover:bg-kenya-brown/20"
                  onClick={() => onSelectCategory(suggestion.name)}
                >
                  {suggestion.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Enter your event details to get AI-powered category suggestions.
            </p>
            <Button
              className="mt-3 w-full"
              size="sm"
              onClick={analyzeCategories}
              variant="outline"
            >
              Analyze Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIEventCategorizer;
