import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { storyService } from '@/lib/story/story-service';
import { followService } from '@/lib/follow';
import { ticketService } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Grid, Video, UserCheck, Calendar, ChevronLeft } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostsGrid from '@/components/profile/PostsGrid';
import CreatePostModal from '@/components/profile/CreatePostModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FriendActivitiesCarousel from '@/components/profile/FriendActivitiesCarousel';
import EventsTabContent from '@/components/profile/EventsTabContent';
import RecentUpdatesSection from '@/components/profile/RecentUpdatesSection';
import InterestedEventsSection from '@/components/profile/InterestedEventsSection';
import FollowersFollowingModal from '@/components/profile/FollowersFollowingModal';
import PostPreviewModal, { ProfilePostPreview } from '@/components/profile/PostPreviewModal';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const Profile: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const [activeTab, setActiveTab] = useState<'posts' | 'discover' | 'events'>('posts');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isPostPreviewOpen, setIsPostPreviewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ProfilePostPreview | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  
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

  // Create event title map for posts
  const eventTitleMap = useMemo(() => {
    const map = new Map<number, string>();
    allEvents.forEach(event => {
      if (event.id) {
        map.set(event.id, event.title);
      }
    });
    return map;
  }, [allEvents]);

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
        <h1 className="mb-4 text-xl font-bold text-foreground">Not Logged In</h1>
        <p className="mb-6 text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }
  
  // Then check profile (with better error handling)
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const stats = {
    posts: userPosts.length,
    friends: mutualFriendsCount,
    eventsAttended: eventsAttendedCount,
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="pb-24">
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
                  
        {/* Recent Updates Section */}
        <RecentUpdatesSection />
                  
        {/* Tabs - Always visible */}
        <div className="px-4 mt-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'discover' | 'events')} className="mt-6">
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-2 mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent border-none rounded-lg gap-1">
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 data-[state=active]:border data-[state=active]:border-orange-500/30 text-white/60 rounded-lg transition-all"
                >
                  <Grid className="mr-2 h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger
                  value="discover"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 data-[state=active]:border data-[state=active]:border-orange-500/30 text-white/60 rounded-lg transition-all"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 data-[state=active]:border data-[state=active]:border-orange-500/30 text-white/60 rounded-lg transition-all"
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
                  const postIndex = userPosts.findIndex(p => p.id === post.id);
                  setSelectedPost(post);
                  setSelectedPostIndex(postIndex >= 0 ? postIndex : 0);
                  setIsPostPreviewOpen(true);
                }}
                emptyCtaLabel="Create your first post"
                onEmptyCtaClick={() => setIsCreatePostOpen(true)}
              />
            </TabsContent>
              
            <TabsContent value="discover" className="mt-6">
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
                activeTab="discover"
                onPostClick={(post) => {
                  const postIndex = userPosts.findIndex(p => p.id === post.id);
                  setSelectedPost(post);
                  setSelectedPostIndex(postIndex >= 0 ? postIndex : 0);
                  setIsPostPreviewOpen(true);
                }}
                emptyCtaLabel="Create a discover post"
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
      </main>

      {/* Create Post FAB */}
      <Button
        onClick={() => setIsCreatePostOpen(true)}
        aria-label="Create post"
        className="fixed bottom-32 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 p-0 text-white shadow-md shadow-orange-500/20 transition-transform hover:scale-105 md:bottom-10 md:right-10"
      >
        <Plus className="h-6 w-6" />
      </Button>

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
          if (!open) {
            setSelectedPost(null);
            setSelectedPostIndex(0);
          }
        }}
        post={selectedPost}
        posts={userPosts.map(p => ({
          id: p.id,
          user_id: p.user_id,
          media_url: p.media_url,
          media_type: p.media_type,
          content: p.content,
          created_at: p.created_at,
          event_id: p.event_id,
        }))}
        currentIndex={selectedPostIndex}
        eventTitleMap={eventTitleMap}
        returnTo={returnTo}
        onPostChange={(index) => {
          setSelectedPostIndex(index);
          const post = userPosts[index];
          if (post) {
            setSelectedPost({
              id: post.id,
              user_id: post.user_id,
              media_url: post.media_url,
              media_type: post.media_type,
              content: post.content,
              created_at: post.created_at,
              event_id: post.event_id,
            });
          }
        }}
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
