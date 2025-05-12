import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/user-service';
import { eventService } from '@/lib/event-service';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Settings, LogOut, User as UserIcon, Heart, Ticket, Bell } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });
  
  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['userEvents', user?.id],
    queryFn: () => eventService.getUserEvents(user?.id || ''),
    enabled: !!user?.id,
  });
  
  const { data: savedEvents, isLoading: savedEventsLoading } = useQuery({
    queryKey: ['savedEvents', user?.id],
    queryFn: () => eventService.getSavedEvents(user?.id || ''),
    enabled: !!user?.id,
  });
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  if (profileLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (!user || !profile) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-white text-xl font-bold mb-4">Not Logged In</h1>
        <p className="text-kenya-brown-light mb-6">Please log in to view your profile.</p>
        <Button asChild>
          <Link to="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3">
            <Card className="bg-kenya-dark border-kenya-brown/20">
              <CardHeader className="pb-2">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-kenya-orange text-white text-xl">
                      {profile.name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-white text-xl">{profile.name || 'User'}</CardTitle>
                  <CardDescription className="text-kenya-brown-light">
                    {profile.bio || 'No bio yet'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-kenya-brown-light">
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <UserIcon size={16} />
                    <span>{user.email}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Joined {formatDistance(new Date(profile.created_at), new Date(), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start mt-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="myEvents">
              <TabsList className="bg-kenya-dark border-kenya-brown/20 mb-6">
                <TabsTrigger value="myEvents" className="data-[state=active]:bg-kenya-orange">
                  My Events
                </TabsTrigger>
                <TabsTrigger value="saved" className="data-[state=active]:bg-kenya-orange">
                  Saved Events
                </TabsTrigger>
                <TabsTrigger value="tickets" className="data-[state=active]:bg-kenya-orange">
                  My Tickets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="myEvents">
                <h2 className="text-white text-xl font-bold mb-4">Events You've Created</h2>
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
                  </div>
                ) : userEvents && userEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userEvents.map(event => (
                      <Card key={event.id} className="bg-kenya-dark border-kenya-brown/20">
                        <div className="h-40 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${event.image_url})` }}></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white">{event.title}</CardTitle>
                          <CardDescription className="text-kenya-brown-light flex items-center gap-1">
                            <Calendar size={14} />
                            {event.date}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button asChild>
                            <Link to={`/events/${event.id}`}>View Event</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-kenya-brown-light mb-4">You haven't created any events yet.</p>
                    <Button asChild>
                      <Link to="/events/create">Create an Event</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="saved">
                <h2 className="text-white text-xl font-bold mb-4">Saved Events</h2>
                {savedEventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
                  </div>
                ) : savedEvents && savedEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedEvents.map(event => (
                      <Card key={event.id} className="bg-kenya-dark border-kenya-brown/20">
                        <div className="h-40 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${event.image_url})` }}></div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white">{event.title}</CardTitle>
                          <CardDescription className="text-kenya-brown-light flex items-center gap-1">
                            <Calendar size={14} />
                            {event.date}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                          <Button asChild>
                            <Link to={`/events/${event.id}`}>View Event</Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              toast.success('Event removed from saved list');
                              // This would typically call a mutation to remove the event
                            }}
                          >
                            <Heart size={16} className="fill-kenya-orange text-kenya-orange" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-kenya-brown-light mb-4">You haven't saved any events yet.</p>
                    <Button asChild>
                      <Link to="/events">Browse Events</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tickets">
                <h2 className="text-white text-xl font-bold mb-4">Your Tickets</h2>
                <div className="text-center py-8">
                  <p className="text-kenya-brown-light mb-4">Ticket functionality coming soon!</p>
                  <div className="flex justify-center">
                    <Ticket size={48} className="text-kenya-orange opacity-50" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
