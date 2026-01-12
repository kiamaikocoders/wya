import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, Check, MessageCircle, Grid, Users, Calendar } from 'lucide-react';
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
    friends: number;
    eventsAttended: number;
  };
  isCurrentUser: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
  onMessage?: () => void;
  onPostsClick?: () => void;
  onFriendsClick?: () => void;
  onEventsClick?: () => void;
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
  onPostsClick,
  onFriendsClick,
  onEventsClick,
}) => {
  const rawDisplayName = profile.full_name || profile.username || 'User';

  const toTitleCase = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .map((word) => {
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');

  const displayName = toTitleCase(rawDisplayName);

  // If username is an email, show a clean @handle (no domain)
  const rawUsername = (profile.username || '').trim();
  const normalizedUsername = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const handleBase = normalizedUsername.includes('@')
    ? normalizedUsername.split('@')[0]
    : normalizedUsername;
  const displayHandle = handleBase ? `@${handleBase}` : undefined;

  return (
    <div className="relative mb-8">
      {/* Ambient Glow - Behind Avatar */}
      <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-accent/15 blur-3xl pointer-events-none md:left-8 md:translate-x-0" />

      {/* Profile Card Container */}
      <div className="relative rounded-2xl border border-white/8 bg-[#1A1A1A] shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Banner Area */}
        <div className="relative h-32 bg-gradient-to-br from-kenya-orange/10 via-kenya-brown/20 to-transparent border-b border-white/5">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }} />
        </div>

        {/* Content Area */}
        <div className="relative px-6 pb-6 pt-20 md:px-8 md:pt-24">
          {/* Avatar - Overlapping Banner */}
          <div className="absolute left-6 top-0 md:left-8" style={{ transform: 'translateY(-50%)' }}>
            <div className="relative">
              {/* Avatar Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-accent/20 blur-xl" />
              <Avatar className="relative h-32 w-32 border-4 border-[#1A1A1A] shadow-[0_8px_32px_rgba(0,0,0,0.6)] md:h-36 md:w-36">
            <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-kenya-orange to-kenya-brown text-3xl text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {/* Spacer for Avatar on Mobile */}
            <div className="h-20 md:hidden" />

            {/* Main Content */}
            <div className="flex-1 space-y-6">
          {/* Name and Action Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black text-white tracking-tight md:text-5xl" style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}>
                {displayName}
              </h1>
                  {!!displayHandle && (
                    <p className="text-sm text-white/60 font-medium" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
                      {displayHandle}
                    </p>
              )}
          </div>

            <div className="flex items-center gap-2">
              {isCurrentUser ? (
                  <Button
                    variant="outline"
                    onClick={onEdit}
                      className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
              ) : (
                <>
                  <Button
                    onClick={isFollowing ? onUnfollow : onFollow}
                    className={cn(
                          'px-6 transition-all',
                      isFollowing
                            ? 'border border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/30'
                            : 'bg-gradient-to-r bg-gradient-accent text-black shadow-[0_0_20px_rgba(255,128,0,0.3)] hover:shadow-[0_0_30px_rgba(255,128,0,0.5)]'
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
                        className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

              {/* Stats as Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={onPostsClick}
                  aria-label="View posts"
                  className="group cursor-pointer rounded-xl border border-kenya-orange/15 bg-gradient-accent/8 px-5 py-3 text-left transition-all hover:scale-105 hover:border-kenya-orange/25 hover:bg-gradient-accent/12 hover:shadow-[0_0_20px_rgba(255,128,0,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-kenya-orange/60"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="h-4 w-4 text-gradient-orange-accent/80" />
                    <div>
                      <p className="text-2xl font-bold text-white leading-none">{stats.posts}</p>
                      <p className="text-xs text-white/60 font-medium mt-0.5">posts</p>
            </div>
            </div>
                </button>
                
                <button
                  type="button"
                  onClick={onFriendsClick}
                  aria-label="View friends"
                  className="group cursor-pointer rounded-xl border border-[#1C6F6F]/15 bg-[#1C6F6F]/8 px-5 py-3 text-left transition-all hover:scale-105 hover:border-[#1C6F6F]/25 hover:bg-[#1C6F6F]/12 hover:shadow-[0_0_20px_rgba(28,111,111,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-kenya-orange/60"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1C6F6F]/80" />
                    <div>
                      <p className="text-2xl font-bold text-white leading-none">{stats.friends}</p>
                      <p className="text-xs text-white/60 font-medium mt-0.5">friends</p>
          </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={onEventsClick}
                  aria-label="View events"
                  className="group cursor-pointer rounded-xl border border-kenya-orange/15 bg-gradient-accent/8 px-5 py-3 text-left transition-all hover:scale-105 hover:border-kenya-orange/25 hover:bg-gradient-accent/12 hover:shadow-[0_0_20px_rgba(255,128,0,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-kenya-orange/60"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gradient-orange-accent/80" />
                    <div>
                      <p className="text-2xl font-bold text-white leading-none">{stats.eventsAttended}</p>
                      <p className="text-xs text-white/60 font-medium mt-0.5">events</p>
                    </div>
                  </div>
                </button>
          </div>

          {/* Bio and Location */}
          <div className="space-y-2">
            {profile.bio && (
                  <p className="text-base text-white/80 leading-relaxed" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
                    {profile.bio}
                  </p>
            )}
            {profile.location && (
                  <p className="text-sm text-white/50 font-medium" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
                    {profile.location}
                  </p>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
