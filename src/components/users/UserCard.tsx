import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Check, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { followService } from '@/lib/follow';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserCardProps {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onMessage: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  username,
  name,
  avatar,
  bio,
  isFollowing,
  onFollow,
  onUnfollow,
  onMessage,
}) => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [canMessage, setCanMessage] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const checkMessagingPermissions = async () => {
      if (!isAuthenticated || !currentUser) {
        setCanMessage(false);
        return;
      }
      try {
        const canMsg = await followService.canMessage(id);
        setCanMessage(canMsg);
      } catch {
        setCanMessage(false);
      }
    };
    checkMessagingPermissions();
  }, [id, isAuthenticated, currentUser, isFollowing]);

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('You must be logged in to send messages');
      navigate('/login');
      return;
    }
    if (!canMessage) {
      toast.error('You can only message users you follow and who follow you back');
      return;
    }
    navigate(`/chat/${id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('You must be logged in to follow users');
      navigate('/login');
      return;
    }
    setIsFollowLoading(true);
    if (isFollowing) {
      followService.unfollowUser(id).then(() => {
        onUnfollow();
        setIsFollowLoading(false);
      }).catch(() => setIsFollowLoading(false));
    } else {
      followService.followUser(id).then(() => {
        onFollow();
        setIsFollowLoading(false);
      }).catch(() => setIsFollowLoading(false));
    }
  };

  const goToProfile = () => {
    navigate(`/users/${username || id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProfile();
        }
      }}
      className={cn(
        'w-full rounded-3xl p-6 text-left transition-all',
        'bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10',
        'shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
        'hover:bg-white/[0.07] dark:hover:bg-white/[0.07] cursor-pointer active:scale-[0.99]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-white/5">
            <AvatarImage src={avatar} alt={name} className="object-cover" />
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/80 to-orange-500 text-lg font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{name}</h3>
          {username && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">@{username}</p>
          )}
          {bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {bio}
            </p>
          )}
        </div>
      </div>

      {isAuthenticated && currentUser?.id !== id && (
        <div className="mt-6 flex gap-3">
          <Button
            size="sm"
            onClick={handleFollowClick}
            disabled={isFollowLoading}
            className={cn(
              'flex-1 py-3 h-auto rounded-2xl font-bold text-sm flex items-center justify-center gap-2',
              'shadow-lg active:scale-95 transition-transform',
              isFollowing
                ? 'bg-muted text-muted-foreground hover:bg-muted/90 border border-border'
                : 'bg-gradient-to-r from-primary to-orange-400 text-white shadow-orange-500/20 hover:opacity-90'
            )}
          >
            {isFollowing ? (
              <>
                <Check className="h-5 w-5" />
                {isFollowLoading ? 'Updating...' : 'Following'}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                {isFollowLoading ? 'Following...' : 'Follow'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleMessage}
            disabled={!canMessage}
            className="h-12 w-12 shrink-0 rounded-2xl border-white/10 dark:border-white/10 bg-white/5 hover:bg-white/10"
            title={!canMessage ? 'Message users you follow who follow you back' : 'Message'}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserCard;
