
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/lib/event-service";
import { forumService } from "@/lib/forum-service";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileTabs from "@/components/profile/ProfileTabs";

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
  
  const { data: events = [] } = useQuery({
    queryKey: ["userEvents", userId],
    queryFn: () => eventService.getAllEvents(),
  });
  
  const { data: posts = [] } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => forumService.getAllPosts(),
  });
  
  const userEvents = events?.filter(event => event.organizer_id === userData.id) || [];
  const userPosts = posts?.filter(post => post.user_id === userData.id) || [];
  const isCurrentUser = currentUser?.id === userData.id;
  
  const handleMessage = () => {
    // TODO: Implement messaging functionality
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ProfileCard
            userData={userData}
            isCurrentUser={isCurrentUser}
            onMessage={handleMessage}
          />
        </div>
        
        <div className="md:col-span-2">
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userEvents={userEvents}
            userPosts={userPosts}
            userData={userData}
            isCurrentUser={isCurrentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
