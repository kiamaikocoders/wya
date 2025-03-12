
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ForumPost } from "@/lib/forum-service";
import { MessageCircle, ThumbsUp, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  post: ForumPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formattedDate = format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-2">
              <Link to={`/forum/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={post.user_image} alt={post.user_name || "User"} />
                  <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                </Avatar>
                <span>{post.user_name || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </CardDescription>
          </div>
          
          {post.event_id && (
            <Link 
              to={`/events/${post.event_id}`}
              className="text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80"
            >
              Event #{post.event_id}
            </Link>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        {post.media_url && (
          <div className="mt-4">
            <img 
              src={post.media_url} 
              alt="Post attachment" 
              className="rounded-md max-h-64 object-cover" 
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            <span>{post.likes_count || 0}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count || 0}</span>
          </Button>
        </div>
        
        <Link to={`/forum/${post.id}`}>
          <Button variant="outline" size="sm">
            View Discussion
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
