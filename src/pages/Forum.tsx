
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { forumService, ForumPost } from "@/lib/forum-service";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MessageCircle, Calendar, ThumbsUp, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import PostCard from "@/components/forum/PostCard";
import NewPostForm from "@/components/forum/NewPostForm";

const Forum: React.FC = () => {
  const { user } = useAuth();
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["forumPosts"],
    queryFn: forumService.getAllPosts,
  });

  const handleNewPostSuccess = () => {
    refetch();
    setShowNewPostForm(false);
    toast.success("Post created successfully!");
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">Loading forum posts...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-2">Error loading forum</h2>
              <p>Could not load forum posts. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Forum</h1>
        <Button 
          onClick={() => setShowNewPostForm(!showNewPostForm)}
          className="flex items-center gap-2"
        >
          {showNewPostForm ? "Cancel" : <>
            <PlusCircle className="h-4 w-4" />
            New Post
          </>}
        </Button>
      </div>

      {showNewPostForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>Share your thoughts with the community</CardDescription>
          </CardHeader>
          <CardContent>
            <NewPostForm onSuccess={handleNewPostSuccess} onCancel={() => setShowNewPostForm(false)} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          {user && <TabsTrigger value="my">My Posts</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">Be the first to create a post!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4">
          {posts && posts.filter(post => (post.likes_count || 0) > 0)
            .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
            .map(post => (
              <PostCard key={post.id} post={post} />
            ))
          }
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          {posts && posts
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(post => (
              <PostCard key={post.id} post={post} />
            ))
          }
        </TabsContent>
        
        {user && (
          <TabsContent value="my" className="space-y-4">
            {posts && posts
              .filter(post => post.user_id === user.id)
              .map(post => (
                <PostCard key={post.id} post={post} />
              ))
            }
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Forum;
