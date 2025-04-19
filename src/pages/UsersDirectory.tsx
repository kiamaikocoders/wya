
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchBar from '@/components/ui/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserCard from '@/components/users/UserCard';
import { Users, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/lib/profile-service';
import { followService } from '@/lib/follow-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserCardData {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
}

const UsersDirectory = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();
  
  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // This is a simple approach - in a real app you might want to use pagination
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });
          
        if (error) throw error;
        
        // Filter out the current user
        return data.filter(profile => 
          currentUser ? profile.id !== currentUser.id.toString() : true
        );
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
  });
  
  // Fetch users the current user is following
  const { data: following = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', currentUser?.id],
    queryFn: () => followService.getFollowing(''),
    enabled: !!currentUser,
  });
  
  // Map the profiles to the format expected by UserCard
  const mappedUsers: UserCardData[] = users.map(user => ({
    id: user.id,
    name: user.full_name || user.username || 'Unknown User',
    avatar_url: user.avatar_url || undefined,
    bio: user.bio || undefined
  }));
  
  // Filter users based on search query and active tab
  const filteredUsers = mappedUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeTab === 'all' || 
     (activeTab === 'following' && following.includes(user.id)))
  );
  
  // Follow mutation
  const followMutation = useMutation({
    mutationFn: followService.followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', currentUser?.id] });
    }
  });
  
  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: followService.unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', currentUser?.id] });
    }
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
    if (!currentUser) {
      toast.error('You must be logged in to unfollow users');
      return;
    }
    unfollowMutation.mutate(userId);
  };
  
  const handleMessage = (userId: string) => {
    navigate(`/chat/${userId}`);
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users Directory</h1>
      </div>
      
      <div className="space-y-6">
        <SearchBar 
          placeholder="Search users..."
          onSearch={setSearchQuery}
          defaultQuery={searchQuery}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {isLoadingUsers ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <UserCard
                      key={user.id}
                      id={parseInt(user.id)}
                      name={user.name}
                      avatar={user.avatar_url}
                      bio={user.bio}
                      isFollowing={following.includes(user.id)}
                      onFollow={() => handleFollow(user.id)}
                      onUnfollow={() => handleUnfollow(user.id)}
                      onMessage={() => handleMessage(user.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'Seems like there are no other users yet'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="following">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {isLoadingFollowing ? (
                  <div className="text-center py-8">Loading following...</div>
                ) : filteredUsers.filter(user => following.includes(user.id)).length > 0 ? (
                  filteredUsers
                    .filter(user => following.includes(user.id))
                    .map(user => (
                      <UserCard
                        key={user.id}
                        id={parseInt(user.id)}
                        name={user.name}
                        avatar={user.avatar_url}
                        bio={user.bio}
                        isFollowing={true}
                        onFollow={() => handleFollow(user.id)}
                        onUnfollow={() => handleUnfollow(user.id)}
                        onMessage={() => handleMessage(user.id)}
                      />
                    ))
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Not following anyone yet</h3>
                    <p className="text-muted-foreground">
                      Follow other users to see their updates and connect with them
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UsersDirectory;
