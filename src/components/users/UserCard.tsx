
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, UserPlus, UserMinus, User } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const UserCard = ({
  id,
  name,
  avatar,
  bio,
  isFollowing,
  onFollow,
  onUnfollow,
  onMessage
}: UserCardProps) => {
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-grow">
            <Link to={`/users/${id}`} className="hover:underline">
              <h3 className="font-medium">{name}</h3>
            </Link>
            {bio && <p className="text-sm text-muted-foreground line-clamp-1">{bio}</p>}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={isFollowing ? onUnfollow : onFollow}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onMessage}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
