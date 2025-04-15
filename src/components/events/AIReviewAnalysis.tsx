
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIReviewAnalysisProps {
  initialReview?: string;
  onAnalysisComplete?: (analysis: string) => void;
}

const AIReviewAnalysis: React.FC<AIReviewAnalysisProps> = ({ 
  initialReview = '',
  onAnalysisComplete
}) => {
  const [review, setReview] = useState(initialReview);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  
  const handleAnalyze = async () => {
    if (!review.trim()) {
      toast.error('Please enter a review to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeSentiment(review);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setAnalysis(result.text);
      
      // Determine sentiment based on keywords in the analysis
      if (result.text.toLowerCase().includes('positive')) {
        setSentiment('positive');
      } else if (result.text.toLowerCase().includes('negative')) {
        setSentiment('negative');
      } else {
        setSentiment('neutral');
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.text);
      }
      
      toast.success('Review analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing review:', error);
      toast.error('Failed to analyze review. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <Card className="border border-dashed border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Review Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter event review to analyze sentiment and extract key points..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="resize-none"
          disabled={isAnalyzing}
        />
        
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !review.trim()}
          className="w-full bg-kenya-orange hover:bg-kenya-orange/90"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Review
            </>
          )}
        </Button>
        
        {analysis && (
          <div className="mt-4 p-4 bg-kenya-brown/10 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-medium text-white">Analysis Result</h3>
              {sentiment && (
                <div className={`ml-auto rounded-full p-1 ${
                  sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                  sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {sentiment === 'positive' ? (
                    <ThumbsUp className="h-4 w-4" />
                  ) : sentiment === 'negative' ? (
                    <ThumbsDown className="h-4 w-4" />
                  ) : (
                    <span className="text-xs px-2">Neutral</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-kenya-brown-light">{analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIReviewAnalysis;
