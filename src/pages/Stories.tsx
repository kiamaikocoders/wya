
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStories } from '@/hooks/use-stories';
import StoriesGrid from '@/components/stories/StoriesGrid';
import CreateStoryForm from '@/components/stories/CreateStoryForm';
import StoryCarousel from '@/components/stories/StoryCarousel';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const StoriesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const { stories, isLoading, deleteStory } = useStories();
  const { user } = useAuth();

  const handleDelete = (storyId: number) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      deleteStory(storyId);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-kenya-orange">Stories</h1>
        
        {user && (
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={showForm ? "bg-gray-600" : "bg-kenya-orange"}
          >
            {showForm ? <><X size={18} className="mr-2" /> Cancel</> : <><Plus size={18} className="mr-2" /> Add Story</>}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-4 mb-8 bg-gray-900 border border-kenya-brown/20">
          <h2 className="text-xl font-semibold mb-4 text-white">Share Your Experience</h2>
          <CreateStoryForm onSuccess={() => setShowForm(false)} />
        </Card>
      )}
      
      {stories && stories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Featured Stories</h2>
          <StoryCarousel stories={stories.filter(s => s.media_url).slice(0, 6)} />
        </div>
      )}
      
      <Tabs defaultValue="all" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="mine" disabled={!user}>My Stories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-400">Loading stories...</p>
            </div>
          ) : (
            <StoriesGrid stories={stories || []} />
          )}
        </TabsContent>
        
        <TabsContent value="mine">
          {user ? (
            isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Loading your stories...</p>
              </div>
            ) : (
              <StoriesGrid 
                stories={(stories || []).filter(story => story.user_id === user.id)} 
                onDelete={handleDelete}
              />
            )
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400">Please sign in to view your stories.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoriesPage;
