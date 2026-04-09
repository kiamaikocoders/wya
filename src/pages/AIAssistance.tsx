
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Image, MessageSquare, Tag, PenTool } from 'lucide-react';
import AIEventRecommendations from '@/components/events/AIEventRecommendations';
import AIStoryGenerator from '@/components/stories/AIStoryGenerator';
import AIImageGenerator from '@/components/events/AIImageGenerator';
import AIEventCategorizer from '@/components/events/AIEventCategorizer';
import AIEventAssistant from '@/components/events/AIEventAssistant';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { toDisplayParagraphs } from '@/lib/ai-plain-text';

const AIAssistance: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    toast.success(`Category "${category}" selected`);
  };
  
  const handleContentGenerate = (content: string) => {
    setGeneratedContent(content);
    toast.success('Content generated successfully!');
  };
  
  const handleImageGenerate = (imageUrl: string) => {
    setGeneratedImage(imageUrl);
    toast.success('Image generated successfully!');
  };
  
  // Sample data for event categorization demo
  const sampleEventTitle = "Nairobi Cultural Food Festival";
  const sampleEventDescription = "A week-long celebration of Kenya's diverse culinary traditions, featuring cooking demonstrations, food tastings, and cultural performances from different communities. Join us for music, dance, and delicious food from across the country.";
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-8 w-8 text-gradient-orange-accent" />
          <h1 className="text-3xl font-bold text-white">AI Assistance Hub</h1>
        </div>
        <p className="text-text-white/70 text-lg max-w-2xl text-center">
          Enhance your event experience with our suite of AI-powered tools
        </p>
      </div>
      
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="recommendations" className="flex items-center gap-1 justify-center">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden">Rec</span>
            <span className="hidden md:inline">Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1 justify-center">
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden">Content</span>
            <span className="hidden md:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1 justify-center">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden">Images</span>
            <span className="hidden md:inline">Images</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1 justify-center">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden">Tags</span>
            <span className="hidden md:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-1 justify-center">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline md:hidden">Chat</span>
            <span className="hidden md:inline">Assistant</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Personalized Event Recommendations</h2>
          <p className="text-text-white/70">
            Our AI analyzes your interests and preferences to recommend events that match your taste.
          </p>
          
          <div className="mt-4">
            <AIEventRecommendations onSelectCategory={handleCategorySelect} />
          </div>
          
          {selectedCategory && (
            <div className="mt-4 p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                <Badge className="bg-gradient-accent">{selectedCategory}</Badge>
                <span>Events Selected</span>
              </h3>
              <p className="text-text-white/70">
                You've selected {selectedCategory} events. 
                <span 
                  className="text-gradient-orange-accent ml-1 cursor-pointer hover:underline"
                  onClick={() => navigate(`/events?category=${selectedCategory}`)}
                >
                  Browse all {selectedCategory} events
                </span>
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">AI Content Generator</h2>
          <p className="text-text-white/70">
            Let our AI help you generate engaging stories and descriptions for your events.
          </p>
          
          <div className="mt-4">
            <AIStoryGenerator onGenerate={handleContentGenerate} />
          </div>
          
          {generatedContent && (
            <div className="mt-4 p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">Generated Content</h3>
              <div className="space-y-2">
                {toDisplayParagraphs(generatedContent).map((p, i) => (
                  <p key={i} className="text-text-white/70 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="images" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">AI Image Generator</h2>
          <p className="text-text-white/70">
            Create unique images for your events with our AI image generator.
          </p>
          
          <div className="mt-4">
            <AIImageGenerator onGenerate={handleImageGenerate} />
          </div>
          
          {generatedImage && (
            <div className="mt-4 p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/10 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">Generated Image</h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <img src={generatedImage} alt="Generated event image" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Smart Event Categorization</h2>
          <p className="text-text-white/70">
            Our AI can analyze your event description and suggest the most appropriate categories.
          </p>
          
          <div className="mt-4">
            <AIEventCategorizer 
              title={sampleEventTitle}
              description={sampleEventDescription}
              onSelectCategory={handleCategorySelect}
            />
          </div>
          
          <div className="mt-4 p-4 bg-gradient-accent/10 border border-kenya-orange/30 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Demo Content</h3>
            <p className="text-sm font-medium text-white">{sampleEventTitle}</p>
            <p className="text-sm text-text-white/70 mt-2">{sampleEventDescription}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="assistant" className="space-y-6">
          <h2 className="text-xl font-semibold text-white">AI Event Planning Assistant</h2>
          <p className="text-text-white/70">
            Get real-time help with planning and organizing your events.
          </p>
          
          <div className="mt-4">
            <AIEventAssistant />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistance;
