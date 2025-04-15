
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

interface AIImageGeneratorProps {
  onGenerate: (imageUrl: string) => void;
  initialCategory?: string;
}

const categories = [
  'Music', 'Food', 'Technology', 'Culture', 'Sports', 'Art', 'Business'
];

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({ onGenerate, initialCategory = 'Culture' }) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await aiService.generateEventImage(prompt, category);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setPreviewUrl(result.url);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAccept = () => {
    if (previewUrl) {
      onGenerate(previewUrl);
      toast.success('Image accepted!');
      setPrompt('');
      setPreviewUrl(null);
    }
  };
  
  return (
    <Card className="border border-dashed border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-kenya-orange" />
          AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          
          <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {previewUrl && (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-md overflow-hidden border border-primary/20">
              <img 
                src={previewUrl} 
                alt="Generated event image" 
                className="w-full h-full object-cover"
              />
            </div>
            <Button 
              onClick={handleAccept} 
              className="w-full bg-kenya-orange hover:bg-kenya-orange/90"
            >
              Use This Image
            </Button>
          </div>
        )}
        
        {!previewUrl && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-kenya-orange hover:bg-kenya-orange/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIImageGenerator;
