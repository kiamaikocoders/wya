
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User } from "@/lib/auth-service";

interface ProfileHeaderProps {
  user: User;
  stats: {
    events: number;
    posts: number;
    surveys: number;
  };
  onLogout: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, stats, onLogout }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.profile_picture || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-center">{user.name}</CardTitle>
        <CardDescription className="text-center">
          {user.email}
        </CardDescription>
        {user.user_type === "admin" && (
          <div className="text-center mt-2 text-sm font-medium">
            Administrator
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Events</span>
            <span>{stats.events}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Posts</span>
            <span>{stats.posts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Surveys</span>
            <span>{stats.surveys}</span>
          </div>
          {user.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-muted-foreground block mb-1">Bio</span>
              <p className="text-sm">{user.bio}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onLogout}>
          Logout
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileHeader;
