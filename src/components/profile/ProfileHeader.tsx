import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Settings,
  UserPlus,
  Check,
  MessageCircle,
  Grid,
  Users,
  Calendar,
  MessageSquarePlus,
} from 'lucide-react';

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
    <>
      {/* Profile Section */}
      <section className="px-6 flex items-center gap-5">
        {/* Avatar on Left */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-20 w-20 rounded-full bg-gradient-to-tr from-kenya-orange to-orange-300 border-4 border-white dark:border-slate-900 shadow-xl">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-to-tr from-kenya-orange to-orange-300 text-3xl text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Online Status Indicator */}
          {isCurrentUser && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
          )}
        </div>

        {/* Content on Right */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white">{displayName}</h1>
          {!!displayHandle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{displayHandle}</p>
          )}
          {profile.location && (
            <div className="flex items-center mt-1 text-xs text-slate-400">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.location}
            </div>
          )}
        </div>
      </section>

      {/* Bio Section */}
      {profile.bio && (
        <section className="px-6 mt-4">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {/* Action Buttons */}
      <section className="px-6 mt-6 flex gap-3">
        {isCurrentUser ? (
          <>
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold py-3 rounded-full border border-transparent dark:border-slate-700"
            >
              <Settings className="mr-2 h-5 w-5" />
              Edit Profile
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={isFollowing ? onUnfollow : onFollow}
              className="flex-1 bg-gradient-to-r from-kenya-orange to-amber-500 text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {isFollowing ? (
                <>
                  <Check className="h-5 w-5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Follow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onMessage}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 border border-transparent dark:border-slate-700"
            >
              <MessageCircle className="h-5 w-5" />
              Message
            </Button>
          </>
        )}
      </section>

      {isCurrentUser && (
        <section className="px-6 mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            asChild
            className="flex-1 rounded-full border-orange-500/30 bg-transparent py-2.5 text-sm font-semibold text-orange-600 dark:text-orange-400"
          >
            <Link to="/settings" className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              Settings & privacy
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1 rounded-full border-orange-500/40 bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-600 dark:text-orange-400"
          >
            <Link to="/feedback" className="flex items-center justify-center gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Send feedback
            </Link>
          </Button>
        </section>
      )}

      {/* Stats Section - Single Row with Dividers */}
      <section className="px-6 mt-8">
        <div className="flex justify-between items-center py-4 border-y border-slate-100 dark:border-slate-800/50">
          <button
            type="button"
            onClick={onPostsClick}
            className="text-center flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="block text-xl font-bold text-white">{stats.posts}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Posts</span>
          </button>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
          <button
            type="button"
            onClick={onFriendsClick}
            className="text-center flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="block text-xl font-bold text-white">{stats.friends}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Friends</span>
          </button>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
          <button
            type="button"
            onClick={onEventsClick}
            className="text-center flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="block text-xl font-bold text-white">{stats.eventsAttended}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Events</span>
          </button>
        </div>
      </section>
    </>
  );
};

export default ProfileHeader;
