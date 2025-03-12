
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MessageSquare, BarChart, Ticket } from "lucide-react";
import EventCard from "@/components/ui/EventCard";
import PostCard from "@/components/forum/PostCard";
import { Event } from "@/lib/event-service";

interface AttendeeContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  attendedEvents: Event[];
  userPosts: any[];
  userTickets: any[];
}

const AttendeeContent: React.FC<AttendeeContentProps> = ({
  activeTab,
  setActiveTab,
  attendedEvents,
  userPosts,
  userTickets,
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
        <TabsTrigger value="tickets" className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Tickets
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="events" className="space-y-4">
        {attendedEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {attendedEvents.map(event => (
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
                <h3 className="text-lg font-medium mb-2">No attended events yet</h3>
                <p className="text-muted-foreground">Discover events to attend!</p>
                <Link to="/events">
                  <Button className="mt-4">Browse Events</Button>
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
                <p className="text-muted-foreground">Join the conversation!</p>
                <Link to="/forum">
                  <Button className="mt-4">Go to Forum</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="tickets" className="space-y-4">
        {userTickets.length > 0 ? (
          userTickets.map(ticket => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{ticket.event_title}</CardTitle>
                    <CardDescription>{new Date(ticket.event_date).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge>{ticket.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket ID</span>
                    <span className="font-mono text-sm">{ticket.reference_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased</span>
                    <span>{new Date(ticket.purchase_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/tickets/${ticket.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Ticket</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
                <p className="text-muted-foreground">Purchase tickets to upcoming events!</p>
                <Link to="/events">
                  <Button className="mt-4">Find Events</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AttendeeContent;
