import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MessageSquare, BarChart, PlusCircle } from "lucide-react";
import EventCard from "@/components/ui/EventCard";
import PostCard from "@/components/forum/PostCard";
import { Event } from "@/types/event.types";

interface OrganizerContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  organizedEvents: Event[];
  userPosts: any[];
  userSurveys: any[];
}

const OrganizerContent: React.FC<OrganizerContentProps> = ({
  activeTab,
  setActiveTab,
  organizedEvents,
  userPosts,
  userSurveys,
}) => {
  return (
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
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          Analytics
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="events" className="space-y-4">
        <div className="flex justify-end mb-4">
          <Link to="/create-event">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
        
        {organizedEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {organizedEvents.map(event => (
              <EventCard 
                key={event.id}
                id={event.id.toString()}
                title={event.title}
                category={event.category}
                date={new Date(event.date).toLocaleDateString()}
                location={event.location}
                image={event.image_url}
                capacity={100}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">No events yet</h3>
                <p className="text-muted-foreground">Start by creating your first event!</p>
                <Link to="/create-event">
                  <Button className="mt-4">Create Event</Button>
                </Link>
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
                <p className="text-muted-foreground">Start engaging with your community!</p>
                <Link to="/forum">
                  <Button className="mt-4">Go to Forum</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Event Analytics</CardTitle>
            <CardDescription>Track the performance of your events</CardDescription>
          </CardHeader>
          <CardContent>
            {organizedEvents.length > 0 ? (
              <div className="space-y-6">
                <Link to="/analytics/events">
                  <Button className="w-full">View Event Analytics</Button>
                </Link>
                <Link to="/analytics/surveys">
                  <Button className="w-full" variant="outline">View Survey Results</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-4">Create events to see analytics</p>
                <Link to="/create-event">
                  <Button>Create Your First Event</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OrganizerContent;
