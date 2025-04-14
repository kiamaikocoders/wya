
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, MessageCircle, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/lib/event-service";
import { forumService } from "@/lib/forum-service";

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  
  const userData = {
    id: parseInt(userId || "0"),
    name: "Jane Doe",
    username: "janedoe",
    bio: "Event enthusiast and community builder. Always looking for the next exciting gathering in Nairobi!",
    location: "Nairobi, Kenya",
    joined: "January 2023",
    followers: 120,
    following: 85,
    profile_picture: "/placeholder.svg",
    interests: ["Music", "Technology", "Food", "Art", "Culture"],
    social: {
      twitter: "janedoe",
      instagram: "jane.doe",
      linkedin: "janedoe"
    }
  };
  
  const { data: events } = useQuery({
    queryKey: ["userEvents", userId],
    queryFn: () => eventService.getAllEvents(),
  });
  
  const { data: posts } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => forumService.getAllPosts(),
  });
  
  const userEvents = events?.filter(event => event.organizer_id === userData.id) || [];
  const userPosts = posts?.filter(post => post.user_id === userData.id) || [];
  
  const isCurrentUser = currentUser?.id === userData.id;
  
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="dark:bg-kenya-brown-dark animate-fade-in">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={userData.profile_picture || "/placeholder.svg"} alt={userData.name} />
                <AvatarFallback className="bg-kenya-orange text-white text-2xl">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mt-4">{userData.name}</h2>
              <p className="text-muted-foreground">@{userData.username}</p>
              
              {!isCurrentUser && (
                <div className="flex space-x-2 mt-4">
                  <Button className="flex-1">Follow</Button>
                  <Button variant="outline" className="flex items-center justify-center">
                    <MessageCircle size={18} />
                  </Button>
                </div>
              )}
              
              {isCurrentUser && (
                <Link to="/profile">
                  <Button variant="outline" className="w-full mt-4">Edit Profile</Button>
                </Link>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="text-sm space-y-3">
                <p>{userData.bio}</p>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin size={16} className="mr-2" />
                  <span>{userData.location}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <Calendar size={16} className="mr-2" />
                  <span>Joined {userData.joined}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="font-bold">{userData.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{userData.following}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{userEvents.length}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-medium mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.interests.map(interest => (
                      <Badge key={interest} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-medium mb-2">Social Media</h3>
                  <div className="flex space-x-3">
                    {Object.entries(userData.social).map(([platform, username]) => (
                      <a 
                        key={platform} 
                        href={`https://${platform}.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            
            <TabsContent value="events" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                {isCurrentUser ? "My Events" : `${userData.name}'s Events`}
              </h2>
              
              {userEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userEvents.map(event => (
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
                              <div className="flex items-center text-muted-foreground text-sm mt-1">
                                <MapPin size={14} className="mr-1" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/50 rounded-lg">
                  <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No events yet</h3>
                  <p className="text-muted-foreground">
                    {isCurrentUser ? "You haven't organized any events yet." : `${userData.name} hasn't organized any events yet.`}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="posts" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                {isCurrentUser ? "My Posts" : `${userData.name}'s Posts`}
              </h2>
              
              {userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map(post => (
                    <Link key={post.id} to={`/forum/${post.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                            {post.content}
                          </p>
                          <div className="flex items-center text-muted-foreground text-sm mt-2">
                            <Clock size={14} className="mr-1" />
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
              ) : (
                <div className="text-center p-8 bg-muted/50 rounded-lg">
                  <MessageCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No posts yet</h3>
                  <p className="text-muted-foreground">
                    {isCurrentUser ? "You haven't created any posts yet." : `${userData.name} hasn't created any posts yet.`}
                  </p>
                  {isCurrentUser && (
                    <Link to="/forum">
                      <Button className="mt-4">Create a Post</Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">About {isCurrentUser ? "Me" : userData.name}</h2>
                  <p className="mb-4">{userData.bio}</p>
                  
                  <h3 className="text-lg font-medium mt-6 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {userData.interests.map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                  
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
