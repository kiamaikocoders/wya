import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/profile-service';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BackButton from '@/components/navigation/BackButton';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: isFollowing = false } = useQuery({
    queryKey: ['isFollowing', authUser?.id, profileId],
    queryFn: () => followService.isFollowing(profileId || ''),
    enabled: !!authUser?.id && !!profileId && authUser.id !== profileId,
  });

  const mutualFriendsCount = useMemo(() => {
    const followerSet = new Set(followerIds);
    return followingIds.filter((id) => followerSet.has(id)).length;
  }, [followerIds, followingIds]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) return false;
      return followService.followUser(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', profileId] });
      queryClient.invalidateQueries({ queryKey: ['following', profileId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', authUser?.id, profileId] });
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
      queryClient.invalidateQueries({ queryKey: ['isFollowing', authUser?.id, profileId] });
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
    <div className="min-h-screen bg-black pb-24">
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
            posts: 0,
            friends: mutualFriendsCount,
            eventsAttended: 0,
          }}
          isCurrentUser={authUser?.id === profile.id}
          isFollowing={isFollowing}
          onFollow={() => followMutation.mutate()}
          onUnfollow={() => unfollowMutation.mutate()}
          onMessage={() => {
            if (!profileId) return;
            // Chat is gated by mutuals elsewhere; we just navigate here.
            window.location.href = `/chat/${profileId}`;
          }}
        />
    </div>
    </div>
  );
};

export default UserProfile;
