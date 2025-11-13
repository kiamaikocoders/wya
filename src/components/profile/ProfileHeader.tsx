import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, UserPlus, Check, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  profile: {
    id: string;
    full_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    location?: string;
  };
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
  isCurrentUser: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
  onMessage?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  stats,
  isCurrentUser,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onEdit,
  onMessage,
}) => {
  const displayName = profile.full_name || profile.username || 'User';

  return (
    <div className="border-b border-white/10 pb-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
        {/* Avatar */}
        <div className="flex justify-center md:justify-start">
          <Avatar className="h-24 w-24 border-4 border-white/20 md:h-32 md:w-32">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-kenya-orange to-kenya-brown text-2xl text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          {/* Name and Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white md:text-3xl">
                {displayName}
              </h1>
              {profile.username && (
                <p className="text-white/70">@{profile.username}</p>
              )}
          </div>

            <div className="flex items-center gap-2">
              {isCurrentUser ? (
                <>
                  <Button
                    variant="outline"
                    onClick={onEdit}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={isFollowing ? onUnfollow : onFollow}
                    className={cn(
                      'px-6',
                      isFollowing
                        ? 'border border-white/20 bg-transparent text-white hover:bg-white/10'
                        : 'bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-black'
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onMessage}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{stats.posts}</p>
              <p className="text-sm text-white/70">posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{stats.followers}</p>
              <p className="text-sm text-white/70">followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{stats.following}</p>
              <p className="text-sm text-white/70">following</p>
          </div>
          </div>

          {/* Bio and Location */}
          <div className="space-y-2">
            {profile.bio && (
              <p className="text-white">{profile.bio}</p>
            )}
            {profile.location && (
              <p className="text-sm text-white/70">{profile.location}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
