import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { storyService } from '@/lib/story/story-service';
import { followService } from '@/lib/follow';
import { ticketService } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Grid, Video, UserCheck, Calendar } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostsGrid from '@/components/profile/PostsGrid';
import CreatePostModal from '@/components/profile/CreatePostModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FriendActivitiesCarousel from '@/components/profile/FriendActivitiesCarousel';
import EventsTabContent from '@/components/profile/EventsTabContent';
import FollowersFollowingModal from '@/components/profile/FollowersFollowingModal';
import PostPreviewModal, { ProfilePostPreview } from '@/components/profile/PostPreviewModal';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const Profile: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const [activeTab, setActiveTab] = useState<'posts' | 'spotlight' | 'events'>('posts');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isPostPreviewOpen, setIsPostPreviewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ProfilePostPreview | null>(null);
  
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

  // Fetch user tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['userTickets', user?.id],
    queryFn: () => ticketService.getUserTickets(),
    enabled: !!user?.id,
  });

  // Get events from tickets (including past events for event title lookup)
  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEvents', 'including-past'],
    queryFn: () => eventService.queryEvents({
      search: '',
      category: null,
      location: null,
      tags: [],
      featuredOnly: false,
      startDate: null,
      endDate: null,
      page: 1,
      pageSize: 500,
      sort: 'latest',
      includePast: true, // Include past events to resolve event titles for posts
    }).then(result => result.events),
    staleTime: 1000 * 60 * 5,
  });

  // Process events: upcoming feed + attended (from tickets)
  const { upcomingEvents, attendedEvents, eventsAttendedCount } = useMemo(() => {
    const now = new Date();
    const ticketEventIds = new Set(tickets.map((t) => t.event_id));
    
    // Get events that user has tickets for
    const userEventIds = Array.from(ticketEventIds);
    const userEvents = allEvents.filter(e => userEventIds.includes(e.id));
    
    // Upcoming events should reflect the main Events feed (not just ticketed events)
    const upcoming = [...allEvents]
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Attended events are derived from user tickets (past events)
    const attended = userEvents
      .filter((e) => new Date(e.date) < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      upcomingEvents: upcoming.slice(0, 10), // show more like the reference carousel
      attendedEvents: attended.slice(0, 10), // Limit to 10 most recent
      eventsAttendedCount: attended.length,
    };
  }, [tickets, allEvents]);

  const selectedPostEventTitle = useMemo(() => {
    if (!selectedPost?.event_id) return undefined;
    return allEvents.find((e) => e.id === selectedPost.event_id)?.title;
  }, [allEvents, selectedPost?.event_id]);

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

  // IMPORTANT: keep all hooks above any early returns to avoid hook order mismatches.
  const mutualFriendsCount = useMemo(() => {
    const followerSet = new Set(followers);
    return following.filter((id) => followerSet.has(id)).length;
  }, [followers, following]);

  const handlePostSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
  };
  
  // Show loading while auth is loading
  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }
  
  // Check authentication first
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="mb-4 text-xl font-bold text-white">Not Logged In</h1>
        <p className="mb-6 text-kenya-brown-light">Please log in to view your profile.</p>
      </div>
    );
  }
  
  // Then check profile (with better error handling)
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
        <p className="mt-4 text-kenya-brown-light">Loading profile...</p>
      </div>
    );
  }

  const stats = {
    posts: userPosts.length,
    friends: mutualFriendsCount,
    eventsAttended: eventsAttendedCount,
  };
  
  return (
    <div className="min-h-screen bg-black pb-24">
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
          onEdit={() => setIsEditProfileOpen(true)}
          onPostsClick={() => setActiveTab('posts')}
          onEventsClick={() => setActiveTab('events')}
          onFriendsClick={() => setIsFriendsOpen(true)}
        />
                  
        {/* Friend Activities Carousel */}
        <FriendActivitiesCarousel />
                  
        {/* Create Post FAB (clear intent, non-ambiguous placement) */}
                      <Button
            onClick={() => setIsCreatePostOpen(true)}
          aria-label="Create post"
          className="fixed bottom-32 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange p-0 text-black shadow-[0_0_26px_rgba(255,128,0,0.35)] transition-transform hover:scale-105 hover:shadow-[0_0_36px_rgba(255,128,0,0.55)] md:bottom-10 md:right-10"
                      >
          <Plus className="h-6 w-6" />
                      </Button>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="rounded-xl border border-white/8 bg-[#1A1A1A] p-2 mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-none rounded-lg gap-1">
            <TabsTrigger
              value="posts"
                className="data-[state=active]:bg-kenya-orange/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-kenya-orange/30 text-white/60 rounded-lg transition-all"
                >
              <Grid className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="spotlight"
                className="data-[state=active]:bg-kenya-orange/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-kenya-orange/30 text-white/60 rounded-lg transition-all"
            >
              <Video className="mr-2 h-4 w-4" />
              Spotlight
            </TabsTrigger>
            <TabsTrigger
                value="events"
                className="data-[state=active]:bg-kenya-orange/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-kenya-orange/30 text-white/60 rounded-lg transition-all"
            >
                <Calendar className="mr-2 h-4 w-4" />
                Events
                </TabsTrigger>
              </TabsList>
          </div>
              
          <TabsContent value="posts" className="mt-6">
            <PostsGrid
              posts={userPosts.map(p => ({
                id: p.id,
                user_id: p.user_id,
                media_url: p.media_url,
                media_type: p.media_type,
                content: p.content,
                event_id: p.event_id,
                created_at: p.created_at,
              }))}
              activeTab="posts"
              onPostClick={(post) => {
                setSelectedPost(post);
                setIsPostPreviewOpen(true);
              }}
              emptyCtaLabel="Create your first post"
              onEmptyCtaClick={() => setIsCreatePostOpen(true)}
            />
              </TabsContent>
              
          <TabsContent value="spotlight" className="mt-6">
            <PostsGrid
              posts={userPosts.map(p => ({
                id: p.id,
                user_id: p.user_id,
                media_url: p.media_url,
                media_type: p.media_type,
                content: p.content,
                event_id: p.event_id,
                created_at: p.created_at,
              }))}
              activeTab="spotlight"
              onPostClick={(post) => {
                setSelectedPost(post);
                setIsPostPreviewOpen(true);
              }}
              emptyCtaLabel="Create a spotlight post"
              onEmptyCtaClick={() => setIsCreatePostOpen(true)}
            />
              </TabsContent>
              
          <TabsContent value="events" className="mt-6">
            <EventsTabContent
              upcomingEvents={upcomingEvents}
              attendedEvents={attendedEvents}
              allEvents={allEvents}
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

      {/* Friends (Followers) Modal */}
      {user?.id && (
        <FollowersFollowingModal
          open={isFriendsOpen}
          onOpenChange={setIsFriendsOpen}
          userId={user.id}
          type="mutuals"
        />
      )}

      {/* Post Preview Modal */}
      <PostPreviewModal
        open={isPostPreviewOpen}
        onOpenChange={(open) => {
          setIsPostPreviewOpen(open);
          if (!open) setSelectedPost(null);
        }}
        post={selectedPost}
        eventTitle={selectedPostEventTitle}
        returnTo={returnTo}
        onChanged={() => queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] })}
      />
      
      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          open={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profile={profile}
        />
      )}
    </div>
  );
};

export default Profile;
