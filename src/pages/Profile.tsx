
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { eventService } from "@/lib/event-service";
import { forumService } from "@/lib/forum-service";
import { surveyService } from "@/lib/survey-service";
import { ticketService } from "@/lib/ticket-service";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AttendeeContent from "@/components/profile/AttendeeContent";
import OrganizerContent from "@/components/profile/OrganizerContent";

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
  
  const { data: tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: ticketService.getUserTickets,
    enabled: !!user && user.user_type === "attendee",
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
  const userEvents = events?.filter(event => 
    user.user_type === "organizer" 
      ? event.organizer_id === user.id 
      : true
  ) || [];
  
  const userPosts = posts?.filter(post => post.user_id === user.id) || [];
  const userSurveys = surveys?.filter(survey => survey.creator_id === user.id) || [];
  const userTickets = tickets || [];
  
  const stats = {
    events: userEvents.length,
    posts: userPosts.length,
    surveys: userSurveys.length,
  };
  
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ProfileHeader 
            user={user}
            stats={stats}
            onLogout={logout}
          />
        </div>
        
        <div className="md:col-span-2">
          {user.user_type === "organizer" ? (
            <OrganizerContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              organizedEvents={userEvents}
              userPosts={userPosts}
              userSurveys={userSurveys}
            />
          ) : (
            <AttendeeContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              attendedEvents={userEvents}
              userPosts={userPosts}
              userTickets={userTickets}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
