import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService, Profile } from '@/lib/profile-service';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, UserPlus, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

interface UserData {
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
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

interface UserStats {
  eventsCreated: number;
  eventsJoined: number;
  reviewsGiven: number;
}

interface ProfileCardProps {
  userData: UserData;
  userStats: UserStats;
  eventsCount: number;
  reviewsCount: number;
  isFollowing: boolean;
  onFollowToggle: () => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userData, userStats, eventsCount, reviewsCount, isFollowing, onFollowToggle }) => {
  return (
    <Card className="bg-kenya-brown-dark bg-opacity-20 text-white">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userData.profile_picture} alt={userData.name} />
            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{userData.name}</h2>
            <p className="text-sm text-muted-foreground">@{userData.username}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm">{userData.bio}</p>
          <div className="flex items-center text-muted-foreground mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{userData.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground mt-1">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span>Joined {formatDate(userData.joined)}</span>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <div>
            <p className="text-sm font-medium">{userData.followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="text-sm font-medium">{userData.following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div>
            <p className="text-sm font-medium">{eventsCount}</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div>
            <p className="text-sm font-medium">{reviewsCount}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={onFollowToggle}>
          {isFollowing ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const UserActivityCard: React.FC = () => {
  return (
    <Card className="bg-kenya-brown-dark bg-opacity-20 text-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Activity</h3>
        <p className="text-sm">
          This section will display the user's recent activities, such as events joined, reviews given, and posts made.
        </p>
      </CardContent>
    </Card>
  );
};

const UserEventsCard: React.FC = () => {
  return (
    <Card className="bg-kenya-brown-dark bg-opacity-20 text-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Events</h3>
        <p className="text-sm">
          This section will display the events created or joined by the user.
        </p>
      </CardContent>
    </Card>
  );
};

const UserReviewsCard: React.FC = () => {
  return (
    <Card className="bg-kenya-brown-dark bg-opacity-20 text-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reviews</h3>
        <p className="text-sm">
          This section will display the reviews given by the user.
        </p>
      </CardContent>
    </Card>
  );
};

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => profileService.getProfileByUsername(username!),
    enabled: !!username,
  });

  useEffect(() => {
    // Mocked data for demonstration
    const mockIsFollowing = false;
    setIsFollowing(mockIsFollowing);
  }, [username]);

  const handleFollowToggle = async () => {
    // Mocked function for demonstration
    setIsFollowing(!isFollowing);
  };

  const userData: UserData = {
    id: 1,
    name: profile?.full_name || 'Loading...',
    username: profile?.username || 'loading...',
    bio: profile?.bio || 'No bio available.',
    location: profile?.location || 'Unknown',
    joined: profile?.created_at || new Date().toISOString(),
    followers: 150,
    following: 200,
    profile_picture: profile?.avatar_url || 'https://via.placeholder.com/150',
    interests: ['Technology', 'Travel', 'Photography'],
    social: {
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
    },
  };

  const userStats: UserStats = {
    eventsCreated: 10,
    eventsJoined: 25,
    reviewsGiven: 42,
  };

  const userEvents = [
    {
      id: 1,
      title: 'Nairobi Tech Week',
      date: '2024-08-15',
      location: 'Nairobi',
    },
    {
      id: 2,
      title: 'Mombasa Cultural Festival',
      date: '2024-09-20',
      location: 'Mombasa',
    },
  ];

  const userReviews = [
    {
      id: 1,
      event: 'Lamu Yoga Festival',
      rating: 5,
    },
    {
      id: 2,
      event: 'Kilifi New Year',
      rating: 4,
    },
  ];

  if (isLoading) {
    return <div className="text-center text-white">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center text-white">Error loading profile.</div>;
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-2xl font-semibold mb-4">User Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <ProfileCard 
            userData={userData} 
            userStats={userStats}
            eventsCount={userEvents.length}
            reviewsCount={userReviews.length}
            isFollowing={isFollowing} // Add this prop
            onFollowToggle={handleFollowToggle}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <UserActivityCard />
          <UserEventsCard />
          <UserReviewsCard />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
