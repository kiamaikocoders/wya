
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { eventService } from "@/lib/event-service";
import { forumService } from "@/lib/forum-service";
import { surveyService } from "@/lib/survey-service";
import { User, Calendar, MessageSquare, BarChart } from "lucide-react";
import { Link } from "react-router-dom";
import EventCard from "@/components/ui/EventCard";
import PostCard from "@/components/forum/PostCard";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: eventService.getAllEvents,
  });
  
  const { data: posts } = useQuery({
    queryKey: ["forumPosts"],
    queryFn: forumService.getAllPosts,
  });
  
  const { data: surveys } = useQuery({
    queryKey: ["surveys"],
    queryFn: surveyService.getAllSurveys,
  });
  
  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-2">Please login to view your profile</h2>
              <Link to="/login">
                <Button className="mt-4">Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Filter for user's content
  const userEvents = events?.filter(event => event.organizer_id === user.id) || [];
  const userPosts = posts?.filter(post => post.user_id === user.id) || [];
  const userSurveys = surveys?.filter(survey => survey.creator_id === user.id) || [];
  
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg" alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center">{user.name}</CardTitle>
              <CardDescription className="text-center">
                {user.email}
              </CardDescription>
              <div className="text-center mt-2 text-sm font-medium">
                {user.user_type === "organizer" ? "Event Organizer" : "Attendee"}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events</span>
                  <span>{userEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts</span>
                  <span>{userPosts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surveys</span>
                  <span>{userSurveys.length}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={logout}>
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="surveys" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Surveys
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="space-y-4">
              {userEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {userEvents.map(event => (
                    <EventCard 
                      key={event.id}
                      id={event.id.toString()}
                      title={event.title}
                      category={event.category}
                      date={new Date(event.date).toLocaleDateString()}
                      location={event.location}
                      image={event.image_url}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-8">
                      <h3 className="text-lg font-medium mb-2">No events yet</h3>
                      {user.user_type === "organizer" ? (
                        <p className="text-muted-foreground">Start by creating your first event!</p>
                      ) : (
                        <p className="text-muted-foreground">You haven't attended any events yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="posts" className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-8">
                      <h3 className="text-lg font-medium mb-2">No forum posts yet</h3>
                      <p className="text-muted-foreground">You haven't created any posts yet.</p>
                      <Link to="/forum">
                        <Button className="mt-4">Go to Forum</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="surveys" className="space-y-4">
              {userSurveys.length > 0 ? (
                userSurveys.map(survey => (
                  <Card key={survey.id}>
                    <CardHeader>
                      <CardTitle>{survey.title}</CardTitle>
                      {survey.description && (
                        <CardDescription>{survey.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          {survey.questions.length} questions
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/surveys/${survey.id}`}>
                          <Button variant="outline" size="sm">Take Survey</Button>
                        </Link>
                        <Link to={`/surveys/${survey.id}/results`}>
                          <Button variant="outline" size="sm">View Results</Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center p-8">
                      <h3 className="text-lg font-medium mb-2">No surveys yet</h3>
                      <p className="text-muted-foreground">You haven't created any surveys yet.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
