import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/lib/event-service";
import { forumService } from "@/lib/forum-service";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const profileId = userId;
  
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
  
  const userEvents = events?.filter(event => event.organizer_id === userData.id.toString()) || [];
  const userPosts = posts?.filter(post => post.user_id === userData.id.toString()) || [];
  const isCurrentUser = currentUser?.id === userId;

  useEffect(() => {
    // When the component mounts, check if the user is already following this profile
    const checkIfFollowing = async () => {
      if (isAuthenticated && currentUser && profileId && profileId !== currentUser.id) {
        try {
          const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profileId)
            .single();
          
          setIsFollowing(!!data);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };
    
    checkIfFollowing();
  }, [isAuthenticated, currentUser, profileId]);
  
  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow this user');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser?.id)
          .eq('following_id', profileId);
          
        if (error) throw error;
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser?.id,
            following_id: profileId
          });
          
        if (error) throw error;
        setIsFollowing(true);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };
  
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
            isFollowing={isFollowing}
            isLoading={isLoading}
            onFollowToggle={handleFollowToggle}
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
