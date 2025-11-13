import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { storyService } from '@/lib/story/story-service';
import { followService } from '@/lib/follow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Grid, Video, UserCheck } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostsGrid from '@/components/profile/PostsGrid';
import CreatePostModal from '@/components/profile/CreatePostModal';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'tagged'>('posts');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });
  
  // Fetch user's posts (stories)
  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const stories = await storyService.getAllStories();
      return stories.filter(s => s.user_id === user.id);
    },
    enabled: !!user?.id,
  });
  
  // Fetch followers and following counts
  const { data: followers = [] } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => followService.getFollowers(user?.id || ''),
    enabled: !!user?.id,
  });
  
  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => followService.getFollowing(user?.id || ''),
    enabled: !!user?.id,
  });

  const followMutation = useMutation({
    mutationFn: followService.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: followService.unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  const handlePostSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
  };
  
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }
  
  if (!user || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="mb-4 text-xl font-bold text-white">Not Logged In</h1>
        <p className="mb-6 text-kenya-brown-light">Please log in to view your profile.</p>
      </div>
    );
  }

  const stats = {
    posts: userPosts.length,
    followers: followers.length,
    following: following.length,
  };
  
  return (
    <div className="min-h-screen bg-kenya-dark pb-24">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={{
            id: profile.id,
            full_name: profile.full_name,
            username: profile.username,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            location: profile.location,
          }}
          stats={stats}
          isCurrentUser={true}
          onEdit={() => {
            // TODO: Open edit profile modal
            toast.info('Edit profile coming soon');
          }}
        />
                  
        {/* Create Post Button - TikTok style */}
        <div className="my-6 flex justify-center">
                      <Button
            onClick={() => setIsCreatePostOpen(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange p-0 shadow-lg hover:scale-105 transition-transform"
                      >
            <Plus className="h-6 w-6 text-black" />
                      </Button>
                    </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-white/10 rounded-none">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-kenya-orange data-[state=active]:text-white text-white/60"
                >
              <Grid className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="reels"
              className="data-[state=active]:border-b-2 data-[state=active]:border-kenya-orange data-[state=active]:text-white text-white/60"
            >
              <Video className="mr-2 h-4 w-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="data-[state=active]:border-b-2 data-[state=active]:border-kenya-orange data-[state=active]:text-white text-white/60"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Tagged
                </TabsTrigger>
              </TabsList>
              
          <TabsContent value="posts" className="mt-6">
            <PostsGrid
              posts={userPosts.map(p => ({
                id: p.id,
                media_url: p.media_url,
                media_type: p.media_type,
                content: p.content,
                created_at: p.created_at,
              }))}
              activeTab="posts"
            />
              </TabsContent>
              
          <TabsContent value="reels" className="mt-6">
            <PostsGrid
              posts={userPosts.map(p => ({
                id: p.id,
                media_url: p.media_url,
                media_type: p.media_type,
                content: p.content,
                created_at: p.created_at,
              }))}
              activeTab="reels"
            />
              </TabsContent>
              
          <TabsContent value="tagged" className="mt-6">
            <PostsGrid
              posts={[]} // TODO: Fetch tagged posts
              activeTab="tagged"
            />
              </TabsContent>
            </Tabs>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSuccess={handlePostSuccess}
      />
    </div>
  );
};

export default Profile;
