
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIEventRecommendationsProps {
  onSelectCategory: (category: string) => void;
}

// Updated type definition to be compatible with the User type from AuthContext
interface EnhancedUser {
  id: number | string; // Allow both number and string types for id
  name?: string;
  email?: string;
  role?: string;
  preferences?: {
    interests?: string[];
    [key: string]: any;
  };
}

const AIEventRecommendations: React.FC<AIEventRecommendationsProps> = ({ onSelectCategory }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample interests based on user profile or default ones
  const getUserInterests = useCallback(() => {
    // Cast user to EnhancedUser type since we've made the types compatible
    const enhancedUser = user as unknown as EnhancedUser;
    if (enhancedUser?.preferences?.interests) {
      return enhancedUser.preferences.interests;
    }
    // Default interests if user has none
    return ['music', 'food', 'sports', 'technology', 'culture'];
  }, [user]);
  
  const getRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const interests = getUserInterests();
      const result = await aiService.getEventRecommendations(interests);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setRecommendations(result.text);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Could not get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getUserInterests]);
  
  useEffect(() => {
    // Get recommendations when component mounts
    void getRecommendations();
  }, [getRecommendations]);
  
  // Parse recommendations text into clickable categories
  const renderRecommendations = () => {
    if (!recommendations) return null;
    
    // Extract likely categories from the recommendations text
    const categories = ['Music', 'Food', 'Culture', 'Technology', 'Sports', 'Art']
      .filter(category => recommendations.toLowerCase().includes(category.toLowerCase()));
    
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{recommendations}</p>
        
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => (
              <Button 
                key={category} 
                variant="outline" 
                size="sm"
                onClick={() => onSelectCategory(category)}
                className="bg-kenya-brown/10 hover:bg-kenya-brown/20"
              >
                {category} Events
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="bg-kenya-dark border-kenya-brown/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Event Recommendations
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => void getRecommendations()}
          disabled={isLoading}
          className="text-white hover:text-kenya-orange hover:bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 text-kenya-orange animate-spin" />
          </div>
        ) : (
          renderRecommendations()
        )}
      </CardContent>
    </Card>
  );
};

export default AIEventRecommendations;
