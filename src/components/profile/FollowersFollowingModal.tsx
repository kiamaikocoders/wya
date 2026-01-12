import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { followService } from '@/lib/follow';
import { userService } from '@/lib/user-service';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FollowersFollowingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: 'followers' | 'following' | 'mutuals';
}

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

const FollowersFollowingModal: React.FC<FollowersFollowingModalProps> = ({
  open,
  onOpenChange,
  userId,
  type,
}) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const [activeType, setActiveType] = useState<FollowersFollowingModalProps['type']>(type);

  useEffect(() => {
    setActiveType(type);
  }, [type]);

  // Fetch followers + following so we can compute mutuals.
  const { data: followerIds = [], isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => followService.getFollowers(userId),
    enabled: open && !!userId,
  });

  const { data: followingIds = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => followService.getFollowing(userId),
    enabled: open && !!userId,
  });

  const userIds = useMemo(() => {
    if (activeType === 'followers') return followerIds;
    if (activeType === 'following') return followingIds;
    const followerSet = new Set(followerIds);
    return followingIds.filter((id) => followerSet.has(id));
  }, [activeType, followerIds, followingIds]);

  // Fetch full user profiles
  const { data: users = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['userProfiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .in('id', userIds);

      if (error) throw error;
      return (data || []) as UserProfile[];
    },
    enabled: open && userIds.length > 0,
  });

  // Check follow status for each user
  const { data: followingMap = {} } = useQuery({
    queryKey: ['followingStatus', currentUser?.id, users.map(u => u.id)],
    queryFn: async () => {
      if (!currentUser?.id || users.length === 0) return {};
      
      const statusMap: Record<string, boolean> = {};
      await Promise.all(
        users.map(async (user) => {
          if (user.id === currentUser.id) return;
          const isFollowing = await followService.isFollowing(user.id);
          statusMap[user.id] = isFollowing;
        })
      );
      return statusMap;
    },
    enabled: open && !!currentUser && users.length > 0,
  });

  const followMutation = useMutation({
    mutationFn: (targetUserId: string) => followService.followUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followingStatus', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (targetUserId: string) => followService.unfollowUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followingStatus', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
    },
  });

  const handleFollow = (targetUserId: string) => {
    if (followingMap[targetUserId]) {
      unfollowMutation.mutate(targetUserId);
    } else {
      followMutation.mutate(targetUserId);
    }
  };

  const handleUserClick = (targetUserId: string) => {
    onOpenChange(false);
    // Navigate after a small delay to allow modal to close smoothly
    setTimeout(() => {
      if (targetUserId === currentUser?.id) {
        navigate('/profile');
      } else {
        // Find the user in the list to get their username
        const targetUser = users.find(u => u.id === targetUserId);
        const identifier = targetUser?.username || targetUserId;
        // Navigate to user profile page (using username if available, otherwise userId)
        navigate(`/users/${identifier}`, { state: { returnTo } });
      }
    }, 100);
  };

  const isLoading = isLoadingFollowers || isLoadingFollowing || isLoadingProfiles;
  const title = activeType === 'mutuals' ? 'Friends' : activeType === 'followers' ? 'Followers' : 'Following';
  const emptyTitle =
    activeType === 'mutuals'
      ? "No friends yet"
      : activeType === 'followers'
        ? 'No followers yet'
        : 'Not following anyone yet';
  const emptyDescription =
    activeType === 'mutuals'
      ? 'Mutuals are people you follow who follow you back.'
      : activeType === 'followers'
        ? 'Start sharing content to get followers'
        : 'Discover and follow interesting users';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-promo border-white/10 text-white max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white capitalize">
            {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as FollowersFollowingModalProps['type'])}>
          <TabsList className="mt-1 grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <TabsTrigger value="mutuals" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
              Friends
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
              Followers
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70">
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gradient-orange-accent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-white/70 text-lg">{emptyTitle}</p>
              <p className="text-white/50 text-sm mt-2">{emptyDescription}</p>
              <Button
                className="mt-5 bg-gradient-to-r bg-gradient-accent text-black"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => navigate('/users', { state: { returnTo } }), 100);
                }}
              >
                Find Friends
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const isFollowing = followingMap[user.id] || false;
                const displayName = user.full_name || user.username || 'User';
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-kenya-orange to-kenya-brown text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {displayName}
                        </p>
                        {user.username && (
                          <p className="text-sm text-white/60 truncate">
                            @{user.username}
                          </p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-white/50 truncate mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {!isCurrentUser && (
                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'default'}
                        className={cn(
                          'ml-2 shrink-0',
                          isFollowing
                            ? 'border-white/20 text-white hover:bg-white/10'
                            : 'bg-gradient-to-r bg-gradient-accent text-black'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(user.id);
                        }}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-1 h-3 w-3" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersFollowingModal;

