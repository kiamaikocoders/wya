
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/ui/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserCard from '@/components/users/UserCard';
import { Users, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  avatar_url?: string;
  bio?: string;
}

const UsersDirectory = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Mock data - replace with actual data fetching
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => {
      // This is mock data - replace with actual API call
      return Promise.resolve([
        { id: 1, name: 'Alice Smith', bio: 'Event enthusiast' },
        { id: 2, name: 'Bob Johnson', bio: 'Music lover' },
        { id: 3, name: 'Carol Wilson', bio: 'Food and culture explorer' },
      ]);
    },
  });
  
  // Mock data - replace with actual following data
  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: () => Promise.resolve([1]), // Mock user IDs being followed
  });
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeTab === 'all' || 
     (activeTab === 'following' && following.includes(user.id)))
  );
  
  const handleFollow = (userId: number) => {
    // Mock follow action - replace with actual API call
    toast.success('User followed successfully');
  };
  
  const handleUnfollow = (userId: number) => {
    // Mock unfollow action - replace with actual API call
    toast.success('User unfollowed successfully');
  };
  
  const handleMessage = (userId: number) => {
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
                {filteredUsers.map(user => (
                  <UserCard
                    key={user.id}
                    {...user}
                    isFollowing={following.includes(user.id)}
                    onFollow={() => handleFollow(user.id)}
                    onUnfollow={() => handleUnfollow(user.id)}
                    onMessage={() => handleMessage(user.id)}
                  />
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'Start following other users to see them here'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="following">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {filteredUsers
                  .filter(user => following.includes(user.id))
                  .map(user => (
                    <UserCard
                      key={user.id}
                      {...user}
                      isFollowing={true}
                      onFollow={() => handleFollow(user.id)}
                      onUnfollow={() => handleUnfollow(user.id)}
                      onMessage={() => handleMessage(user.id)}
                    />
                  ))
                }
                
                {filteredUsers.filter(user => following.includes(user.id)).length === 0 && (
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
