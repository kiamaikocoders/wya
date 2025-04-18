
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageCircle, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  image_url?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  comments_count?: number;
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userEvents: Event[];
  userPosts: Post[];
  userData: {
    name: string;
    bio: string;
    location: string;
    joined: string;
    interests: string[];
  };
  isCurrentUser: boolean;
}

const ProfileTabs = ({
  activeTab,
  onTabChange,
  userEvents,
  userPosts,
  userData,
  isCurrentUser
}: ProfileTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="events" className="flex items-center gap-1">
          <Calendar size={16} />
          Events
        </TabsTrigger>
        <TabsTrigger value="posts" className="flex items-center gap-1">
          <MessageCircle size={16} />
          Posts
        </TabsTrigger>
        <TabsTrigger value="about" className="flex items-center gap-1">
          <User size={16} />
          About
        </TabsTrigger>
      </TabsList>

      <TabsContent value="events">
        <EventsTab 
          events={userEvents} 
          isCurrentUser={isCurrentUser} 
          userName={userData.name} 
        />
      </TabsContent>

      <TabsContent value="posts">
        <PostsTab 
          posts={userPosts} 
          isCurrentUser={isCurrentUser} 
          userName={userData.name} 
        />
      </TabsContent>

      <TabsContent value="about">
        <AboutTab userData={userData} isCurrentUser={isCurrentUser} />
      </TabsContent>
    </Tabs>
  );
};

const EventsTab = ({ events, isCurrentUser, userName }: { 
  events: Event[], 
  isCurrentUser: boolean,
  userName: string 
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium">No events yet</h3>
        <p className="text-muted-foreground">
          {isCurrentUser ? "You haven't organized any events yet." : `${userName} hasn't organized any events yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map(event => (
        <Link key={event.id} to={`/events/${event.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-md bg-muted overflow-hidden">
                  <img 
                    src={event.image_url || "/placeholder.svg"} 
                    alt={event.title}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="flex items-center text-muted-foreground text-sm mt-1">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

const PostsTab = ({ posts, isCurrentUser, userName }: {
  posts: Post[],
  isCurrentUser: boolean,
  userName: string
}) => {
  if (posts.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <MessageCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium">No posts yet</h3>
        <p className="text-muted-foreground">
          {isCurrentUser ? "You haven't created any posts yet." : `${userName} hasn't created any posts yet.`}
        </p>
        {isCurrentUser && (
          <Link to="/forum">
            <Button className="mt-4">Create a Post</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Link key={post.id} to={`/forum/${post.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <h3 className="font-medium">{post.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                {post.content}
              </p>
              <div className="flex items-center text-muted-foreground text-sm mt-2">
                <Calendar size={14} className="mr-1" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <MessageCircle size={14} className="mr-1" />
                <span>{post.comments_count || 0} comments</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

const AboutTab = ({ userData, isCurrentUser }: {
  userData: {
    name: string;
    bio: string;
    location: string;
    joined: string;
    interests: string[];
  },
  isCurrentUser: boolean
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">About {isCurrentUser ? "Me" : userData.name}</h2>
        <p className="mb-4">{userData.bio}</p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">Location</h3>
        <div className="flex items-center text-muted-foreground mb-6">
          <MapPin size={18} className="mr-2" />
          <span>{userData.location}</span>
        </div>
        
        <h3 className="text-lg font-medium mt-6 mb-3">Member Since</h3>
        <div className="flex items-center text-muted-foreground">
          <Calendar size={18} className="mr-2" />
          <span>{userData.joined}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTabs;
