import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/profile-service';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BackButton from '@/components/navigation/BackButton';
import FollowersFollowingModal from '@/components/profile/FollowersFollowingModal';
import { storyService } from '@/lib/story/story-service';
import { ticketService } from '@/lib/ticket-service';
import { eventService } from '@/lib/event-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostsGrid from '@/components/profile/PostsGrid';
import PostPreviewModal, { ProfilePostPreview } from '@/components/profile/PostPreviewModal';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts');
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [friendsModalType, setFriendsModalType] = useState<'followers' | 'following' | 'mutuals'>('mutuals');
  const [isPostPreviewOpen, setIsPostPreviewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ProfilePostPreview | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => profileService.getProfileByIdentifier(userId!),
    enabled: !!userId,
  });

  const profileId = profile?.id;

  const { data: followerIds = [] } = useQuery({
    queryKey: ['followers', profileId],
    queryFn: () => followService.getFollowers(profileId || ''),
    enabled: !!profileId,
  });

  const { data: followingIds = [] } = useQuery({
    queryKey: ['following', profileId],
    queryFn: () => followService.getFollowing(profileId || ''),
    enabled: !!profileId,
  });

  const { data: followRelation = 'none' } = useQuery({
    queryKey: ['followRelation', authUser?.id, profileId],
    queryFn: () => followService.getFollowRelation(profileId || ''),
    enabled: !!authUser?.id && !!profileId && authUser.id !== profileId,
  });

  // Fetch user's posts (stories)
  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const stories = await storyService.getAllStories();
      return stories.filter(s => s.user_id === profileId);
    },
    enabled: !!profileId,
  });

  // Fetch user tickets for events
  const { data: tickets = [] } = useQuery({
    queryKey: ['userTickets', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      // If viewing own profile, use ticketService
      if (authUser?.id === profileId) {
        return await ticketService.getUserTickets();
      }
      // For other users, query directly (admin can see, regular users see 0)
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', profileId)
        .order('purchase_date', { ascending: false });
      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profileId,
  });

  // Get events from tickets
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
      includePast: true,
    }).then(result => result.events),
    staleTime: 1000 * 60 * 5,
  });

  // Calculate events attended count
  const eventsAttendedCount = useMemo(() => {
    if (!tickets.length || !allEvents.length) return 0;
    const now = new Date();
    const ticketEventIds = new Set(tickets.map((t) => t.event_id));
    const userEvents = allEvents.filter(e => ticketEventIds.has(e.id));
    return userEvents.filter((e) => new Date(e.date) < now).length;
  }, [tickets, allEvents]);

  const mutualFriendsCount = useMemo(() => {
    const followerSet = new Set(followerIds);
    return followingIds.filter((id) => followerSet.has(id)).length;
  }, [followerIds, followingIds]);

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
    mutationFn: async () => {
      if (!profileId) return false;
      return followService.followUser(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', profileId] });
      queryClient.invalidateQueries({ queryKey: ['following', profileId] });
      queryClient.invalidateQueries({ queryKey: ['followRelation', authUser?.id, profileId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) return false;
      return followService.unfollowUser(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', profileId] });
      queryClient.invalidateQueries({ queryKey: ['following', profileId] });
      queryClient.invalidateQueries({ queryKey: ['followRelation', authUser?.id, profileId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-white">Error loading profile.</div>;
  }

  if (!profile) {
    return <div className="text-center text-white">User not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center gap-3">
          <BackButton fallbackHref="/users" className="h-10 w-10" />
        </div>

        <ProfileHeader
          profile={{
            id: profile.id,
            full_name: profile.full_name || undefined,
            username: profile.username || undefined,
            bio: profile.bio || undefined,
            avatar_url: profile.avatar_url || undefined,
            location: profile.location || undefined,
          }}
          stats={{
            posts: userPosts.length,
            friends: mutualFriendsCount,
            eventsAttended: eventsAttendedCount,
          }}
          isCurrentUser={authUser?.id === profile.id}
          isFollowing={followRelation === 'accepted'}
          isPending={followRelation === 'pending'}
          onFollow={() => followMutation.mutate()}
          onUnfollow={() => unfollowMutation.mutate()}
          onMessage={() => {
            if (!profileId) return;
            window.location.href = `/chat/${profileId}`;
          }}
          onPostsClick={() => setActiveTab('posts')}
          onFriendsClick={() => {
            setFriendsModalType('mutuals');
            setFriendsModalOpen(true);
          }}
          onEventsClick={() => setActiveTab('events')}
        />

        {/* Tabs for Posts and Events */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            {userPosts.length > 0 ? (
              <PostsGrid 
                posts={userPosts.map(post => ({
                  id: post.id,
                  content: post.content || '',
                  media_url: post.media_url || undefined,
                  media_type: post.media_type || undefined,
                  created_at: post.created_at,
                  event_id: post.event_id || undefined,
                }))} 
                activeTab="posts"
                onPostClick={(post) => {
                  // Find the index of the clicked post
                  const postIndex = userPosts.findIndex(p => p.id === post.id);
                  setSelectedPost({
                    id: post.id,
                    user_id: profileId,
                    media_url: post.media_url,
                    media_type: post.media_type,
                    content: post.content,
                    created_at: post.created_at,
                    event_id: post.event_id,
                  });
                  setSelectedPostIndex(postIndex >= 0 ? postIndex : 0);
                  setIsPostPreviewOpen(true);
                }}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            {eventsAttendedCount > 0 ? (
              <div className="space-y-4">
                {allEvents
                  .filter(e => {
                    const ticketEventIds = new Set(tickets.map((t) => t.event_id));
                    return ticketEventIds.has(e.id) && new Date(e.date) < new Date();
                  })
                  .slice(0, 20)
                  .map(event => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No events attended yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Friends Modal */}
        {profileId && (
          <FollowersFollowingModal
            open={friendsModalOpen}
            onOpenChange={setFriendsModalOpen}
            userId={profileId}
            type={friendsModalType}
          />
        )}

        {/* Post Preview Modal */}
        <PostPreviewModal
          open={isPostPreviewOpen}
          onOpenChange={setIsPostPreviewOpen}
          post={selectedPost}
          posts={userPosts.map(post => ({
            id: post.id,
            user_id: profileId,
            media_url: post.media_url,
            media_type: post.media_type,
            content: post.content,
            created_at: post.created_at,
            event_id: post.event_id,
          }))}
          currentIndex={selectedPostIndex}
          eventTitleMap={eventTitleMap}
          onPostChange={(index) => {
            setSelectedPostIndex(index);
            const post = userPosts[index];
            if (post) {
              setSelectedPost({
                id: post.id,
                user_id: profileId,
                media_url: post.media_url,
                media_type: post.media_type,
                content: post.content,
                created_at: post.created_at,
                event_id: post.event_id,
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default UserProfile;
