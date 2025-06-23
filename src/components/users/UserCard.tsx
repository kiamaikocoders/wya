
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { followService } from '@/lib/follow-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserCardProps {
  id: number;
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
  name,
  avatar,
  bio,
  isFollowing,
  onFollow,
  onUnfollow,
  onMessage
}) => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [canMessage, setCanMessage] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const checkMessagingPermissions = async () => {
      if (!isAuthenticated || !currentUser) {
        setCanMessage(false);
        return;
      }
      
      setIsCheckingPermissions(true);
      try {
        const canMsg = await followService.canMessage(id.toString());
        setCanMessage(canMsg);
      } catch (error) {
        console.error('Error checking messaging permissions:', error);
        setCanMessage(false);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkMessagingPermissions();
  }, [id, isAuthenticated, currentUser, isFollowing]);

  const handleMessage = () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to send messages');
      navigate('/login');
      return;
    }

    if (!canMessage) {
      toast.error('You can only message users you follow and who follow you back');
      return;
    }

    // Navigate directly to chat with this specific user
    navigate(`/chat/${id}`);
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to follow users');
      navigate('/login');
      return;
    }
    
    setIsFollowLoading(true);
    try {
      await onFollow();
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to unfollow users');
      return;
    }
    
    setIsFollowLoading(true);
    try {
      await onUnfollow();
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            {bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {bio}
              </p>
            )}
            
            <div className="flex items-center space-x-2 mt-4">
              {isAuthenticated && currentUser?.id !== id.toString() && (
                <>
                  {isFollowing ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUnfollow}
                      disabled={isFollowLoading}
                      className="flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      {isFollowLoading ? 'Unfollowing...' : 'Unfollow'}
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {isFollowLoading ? 'Following...' : 'Follow'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMessage}
                    disabled={isCheckingPermissions || !canMessage}
                    className="flex items-center gap-2"
                    title={!canMessage ? "You can only message users you follow and who follow you back" : "Send message"}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
