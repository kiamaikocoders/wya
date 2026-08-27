import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import UserCard from '@/components/users/UserCard';
import BackButton from '@/components/navigation/BackButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Users, UserPlus, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { followService } from '@/lib/follow';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getPageWindow, useListPagination } from '@/hooks/use-list-pagination';

export type SortOption = 'name_asc' | 'name_desc' | 'recently_active' | 'newest_first';
export type RelationshipFilter = 'all' | 'following' | 'not_following';

interface UserCardData {
  id: string;
  username?: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

const UsersDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCanMessage, setFilterCanMessage] = useState(false);
  const [filterRelationship, setFilterRelationship] = useState<RelationshipFilter>('all');
  const queryClient = useQueryClient();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, created_at, updated_at')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data.filter((profile: { id: string }) =>
        currentUser ? profile.id !== currentUser.id : true
      );
    },
  });

  const { data: following = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', currentUser?.id],
    queryFn: () => followService.getFollowing(currentUser?.id || ''),
    enabled: !!currentUser,
  });

  const { data: pendingOutgoing = [] } = useQuery({
    queryKey: ['outgoing-pending', currentUser?.id],
    queryFn: () => followService.getOutgoingPendingIds(currentUser?.id || ''),
    enabled: !!currentUser,
  });

  const { data: incomingCount = 0 } = useQuery({
    queryKey: ['friend-request-count', currentUser?.id],
    queryFn: () => followService.countIncomingRequests(currentUser?.id || ''),
    enabled: !!currentUser,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', currentUser?.id],
    queryFn: () => followService.getFollowers(currentUser?.id || ''),
    enabled: !!currentUser,
  });

  const canMessageIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const mutual = following.filter((id) => followers.includes(id));
    return new Set(mutual);
  }, [currentUser, following, followers]);

  const distinctLocations = useMemo(() => {
    const locs = [...new Set(users.map((u: { location?: string }) => u.location).filter(Boolean))] as string[];
    return locs.sort((a, b) => a.localeCompare(b));
  }, [users]);

  const mappedUsers: UserCardData[] = useMemo(
    () =>
      users.map((user: { id: string; username?: string; full_name?: string; avatar_url?: string; bio?: string; location?: string; created_at?: string; updated_at?: string }) => ({
        id: user.id,
        username: user.username || undefined,
        name: user.full_name || user.username || 'Unknown User',
        avatar_url: user.avatar_url || undefined,
        bio: user.bio || undefined,
        location: user.location || undefined,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
    [users]
  );

  const displayUsers = useMemo(() => {
    let filtered = mappedUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
    if (activeTab === 'following') {
      filtered = filtered.filter((user) => following.includes(user.id));
    } else {
      if (filterRelationship === 'following') {
        filtered = filtered.filter((user) => following.includes(user.id));
      } else if (filterRelationship === 'not_following') {
        filtered = filtered.filter((user) => !following.includes(user.id));
      }
    }
    if (filterLocation) {
      filtered = filtered.filter((user) => (user.location || '').toLowerCase() === filterLocation.toLowerCase());
    }
    if (filterCanMessage) {
      filtered = filtered.filter((user) => canMessageIds.has(user.id));
    }
    const sorted = [...filtered];
    if (sortBy === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'name_desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'recently_active') {
      sorted.sort((a, b) => {
        const aAt = a.updated_at || a.created_at || '';
        const bAt = b.updated_at || b.created_at || '';
        return new Date(bAt).getTime() - new Date(aAt).getTime();
      });
    } else if (sortBy === 'newest_first') {
      sorted.sort((a, b) => {
        const aAt = a.created_at || '';
        const bAt = b.created_at || '';
        return new Date(bAt).getTime() - new Date(aAt).getTime();
      });
    }
    return sorted;
  }, [mappedUsers, searchQuery, activeTab, following, filterRelationship, filterLocation, filterCanMessage, canMessageIds, sortBy]);

  const {
    page,
    setPage,
    pageItems,
    totalPages,
  } = useListPagination(displayUsers, {
    pageSize: 12,
    resetKey: `${searchQuery}|${activeTab}|${sortBy}|${filterLocation}|${filterCanMessage}|${filterRelationship}`,
  });

  const followMutation = useMutation({
    mutationFn: followService.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-pending', currentUser?.id] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: followService.unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-pending', currentUser?.id] });
    },
  });

  const handleFollow = (userId: string) => {
    if (!currentUser) {
      toast.error('You must be logged in to follow users');
      navigate('/login');
      return;
    }
    followMutation.mutate(userId);
  };

  const handleUnfollow = (userId: string) => {
    if (!currentUser) return;
    unfollowMutation.mutate(userId);
  };

  const handleMessage = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  const isLoading = activeTab === 'all' ? isLoadingUsers : isLoadingFollowing;
  const isEmpty = displayUsers.length === 0;

  return (
    <div className="relative min-h-screen w-full max-w-[430px] mx-auto bg-background overflow-hidden flex flex-col">
      {/* Glow orbs - glassmorphism accent */}
      <div
        className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)',
        }}
        aria-hidden
      />
      <div
        className="absolute bottom-[10%] left-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 70%)',
        }}
        aria-hidden
      />

      <main className="relative z-10 flex-1 px-6 pb-28 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6 pt-2">
          <BackButton fallbackHref={returnTo || '/profile'} className="h-10 w-10 rounded-xl border border-border bg-card shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex-1">People</h1>
          {currentUser ? (
            <Button
              variant="outline"
              className="relative h-10 shrink-0 rounded-xl px-3"
              onClick={() => navigate('/friend-requests')}
            >
              Requests
              {incomingCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {incomingCount > 9 ? '9+' : incomingCount}
                </span>
              ) : null}
            </Button>
          ) : null}
        </div>

        {/* Search bar with filter button */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-14 py-4 h-auto rounded-2xl bg-muted/50 dark:bg-white/5 border-border focus-visible:ring-primary/50"
          />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Sort and filter"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Sort & filter sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Sort & filter</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name A–Z</SelectItem>
                    <SelectItem value="name_desc">Name Z–A</SelectItem>
                    <SelectItem value="recently_active">Recently active</SelectItem>
                    <SelectItem value="newest_first">Newest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {distinctLocations.length > 0 && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={filterLocation || 'any'} onValueChange={(v) => setFilterLocation(v === 'any' ? '' : v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any location</SelectItem>
                      {distinctLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can-message"
                    checked={filterCanMessage}
                    onCheckedChange={(checked) => setFilterCanMessage(checked === true)}
                  />
                  <Label htmlFor="can-message" className="text-sm font-normal cursor-pointer">
                    Can message only
                  </Label>
                </div>
              )}
              {activeTab === 'all' && (
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select value={filterRelationship} onValueChange={(v) => setFilterRelationship(v as RelationshipFilter)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="following">Following</SelectItem>
                      <SelectItem value="not_following">Not following</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <SheetFooter>
              <Button
                className="w-full rounded-xl"
                onClick={() => setSheetOpen(false)}
              >
                Apply
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* All Users / Following tabs */}
        <div className="flex p-1 mb-8 rounded-2xl bg-muted/50 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-colors',
              activeTab === 'all'
                ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-5 w-5" />
            All Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={cn(
              'flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-colors',
              activeTab === 'following'
                ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserPlus className="h-5 w-5" />
            Following
          </button>
        </div>

        {/* User list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {activeTab === 'following' ? 'Not following anyone yet' : 'No users found'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchQuery
                  ? 'Try adjusting your search.'
                  : activeTab === 'following'
                    ? 'Follow people to see them here.'
                    : 'Other users will appear here when they join.'}
              </p>
            </div>
          ) : (
            <>
              {pageItems.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  username={user.username}
                  name={user.name}
                  avatar={user.avatar_url}
                  bio={user.bio}
                  isFollowing={following.includes(user.id)}
                  isPending={pendingOutgoing.includes(user.id)}
                  onFollow={() => handleFollow(user.id)}
                  onUnfollow={() => handleUnfollow(user.id)}
                  onMessage={() => handleMessage(user.id)}
                />
              ))}
              {totalPages > 1 ? (
                <Pagination className="pt-4">
                  <PaginationContent className="flex flex-wrap items-center justify-center gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        aria-label="Previous page"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={cn(
                          'cursor-pointer',
                          page <= 1 && 'pointer-events-none opacity-40'
                        )}
                      />
                    </PaginationItem>
                    {getPageWindow(page, totalPages).map((entry, idx) =>
                      entry === 'ellipsis' ? (
                        <PaginationItem key={`e-${idx}`}>
                          <span className="px-2 text-muted-foreground">…</span>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={entry}>
                          <PaginationLink
                            isActive={entry === page}
                            onClick={() => setPage(entry)}
                            className="cursor-pointer"
                          >
                            {entry}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        aria-label="Next page"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        className={cn(
                          'cursor-pointer',
                          page >= totalPages && 'pointer-events-none opacity-40'
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UsersDirectory;
