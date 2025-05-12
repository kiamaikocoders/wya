
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ForumPost } from "@/lib/forum-service"; 
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: ForumPost;
  isLiked?: boolean;
  onLikeToggle?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, isLiked = false, onLikeToggle }) => {
  const { isAuthenticated, user } = useAuth();

  // Format creation date to relative time
  const formattedDate = post.created_at 
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) 
    : '';
    
  // Check if user is the post author
  const isAuthor = user?.id === post.user_id;

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} alt={post.user?.name || "User"} />
              <AvatarFallback>
                {(post.user?.name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {post.user?.name || "Anonymous"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedDate}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/posts/${post.id}`}>View Post</Link>
              </DropdownMenuItem>
              {isAuthor && (
                <DropdownMenuItem className="text-red-500">
                  Delete Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Link to={`/posts/${post.id}`} className="hover:underline">
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        </Link>
        <p className="text-muted-foreground whitespace-pre-line">{post.content}</p>
        
        {post.media_url && (
          <div className="mt-3">
            <img 
              src={post.media_url} 
              alt="Post attachment" 
              className="rounded-md max-h-[300px] w-auto object-contain"
            />
          </div>
        )}
        
        {post.event_id && (
          <div className="mt-3">
            <Link 
              to={`/events/${post.event_id}`}
              className="text-sm text-muted-foreground hover:underline flex items-center"
            >
              <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded">
                Related Event
              </span>
            </Link>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
            onClick={() => onLikeToggle && onLikeToggle(post.id)}
            disabled={!isAuthenticated}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            asChild
          >
            <Link to={`/posts/${post.id}`}>
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 md:hidden lg:flex"
            onClick={() => {
              navigator.share({
                title: post.title,
                text: post.content.substring(0, 50) + '...',
                url: window.location.origin + `/posts/${post.id}`,
              }).catch(err => {
                console.error('Share failed:', err);
              });
            }}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden md:inline">Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
