
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, MessageCircle } from 'lucide-react';

interface ProfileCardProps {
  userData: {
    id: number;
    name: string;
    username: string;
    bio: string;
    location: string;
    joined: string;
    followers: number;
    following: number;
    profile_picture: string;
    interests: string[];
    social: {
      [key: string]: string;
    };
  };
  isCurrentUser: boolean;
  onMessage?: () => void;
}

const ProfileCard = ({ userData, isCurrentUser, onMessage }: ProfileCardProps) => {
  return (
    <Card className="dark:bg-kenya-brown-dark animate-fade-in">
      <CardHeader className="text-center">
        <Avatar className="h-24 w-24 mx-auto">
          <AvatarImage src={userData.profile_picture} alt={userData.name} />
          <AvatarFallback className="bg-kenya-orange text-white text-2xl">
            {userData.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mt-4">{userData.name}</h2>
        <p className="text-muted-foreground">@{userData.username}</p>
        
        {!isCurrentUser && (
          <div className="flex space-x-2 mt-4">
            <Button className="flex-1">Follow</Button>
            <Button variant="outline" className="flex items-center justify-center" onClick={onMessage}>
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
  );
};

export default ProfileCard;
