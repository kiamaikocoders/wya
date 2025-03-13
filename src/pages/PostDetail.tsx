
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { forumService, ForumComment } from "@/lib/forum-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, MessageCircle, ThumbsUp, User, Calendar, Image as ImageIcon, Film } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [commentMediaUrl, setCommentMediaUrl] = useState('');
  
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["forumPost", postId],
    queryFn: () => forumService.getPostById(Number(postId)),
    enabled: !!postId,
  });
  
  const { 
    data: comments, 
    isLoading: commentsLoading,
    refetch: refetchComments
  } = useQuery({
    queryKey: ["forumComments", postId],
    queryFn: () => forumService.getComments(Number(postId)),
    enabled: !!postId,
  });
  
  const commentMutation = useMutation({
    mutationFn: forumService.createComment,
    onSuccess: () => {
      setComment("");
      setCommentMediaUrl("");
      refetchComments();
      toast.success("Comment added successfully!");
    },
    onError: () => {
      toast.error("Failed to add comment. Please try again.");
    },
  });
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    
    commentMutation.mutate({
      post_id: Number(postId),
      content: comment.trim(),
      media_url: commentMediaUrl.trim() || undefined
    });
  };

  // Function to determine if a URL is a video
  const isVideoUrl = (url: string) => {
    return url && (
      url.match(/\.(mp4|webm|ogg)$/) || 
      url.includes('youtube.com') || 
      url.includes('youtu.be') || 
      url.includes('vimeo.com')
    );
  };
  
  // Function to get YouTube embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };
  
  // Render media content based on URL
  const renderMedia = (mediaUrl: string | undefined) => {
    if (!mediaUrl) return null;
    
    if (isVideoUrl(mediaUrl)) {
      // Handle YouTube videos
      if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
        const embedUrl = getYoutubeEmbedUrl(mediaUrl);
        if (embedUrl) {
          return (
            <div className="relative pt-[56.25%] mt-4 overflow-hidden rounded-md">
              <iframe 
                className="absolute top-0 left-0 w-full h-full border-0"
                src={embedUrl}
                title="Video content"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
      }
      
      // Handle direct video files
      return (
        <div className="mt-4 relative rounded-md overflow-hidden">
          <video 
            className="w-full max-h-96 object-contain" 
            controls
          >
            <source src={mediaUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Default to image
    return (
      <div className="mt-4">
        <img 
          src={mediaUrl} 
          alt="Media attachment" 
          className="rounded-md max-h-96 object-contain w-full" 
        />
      </div>
    );
  };
  
  const isLoading = postLoading || commentsLoading;
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">Loading post...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-2">Post not found</h2>
              <Button onClick={() => navigate("/forum")} className="mt-4">Back to Forum</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/forum")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Forum
        </Button>
        <h1 className="text-2xl font-bold">Forum Discussion</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <CardTitle className="text-xl md:text-2xl">{post.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.user_image} alt={post.user_name || "User"} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <span>{post.user_name || "Anonymous"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content}</p>
          
          {renderMedia(post.media_url)}
        </CardContent>
        
        <CardFooter>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>{post.likes_count || 0}</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{comments?.length || 0} comments</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">Comments</h2>
      
      {user ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleAddComment}>
              <div className="space-y-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      {isVideoUrl(commentMediaUrl) ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add media URL (optional)" 
                      className="pl-10 w-full h-10 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={commentMediaUrl}
                      onChange={(e) => setCommentMediaUrl(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={commentMutation.isPending}
                  >
                    {commentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
                
                {commentMediaUrl && (
                  <div className="p-2 border rounded-md">
                    {isVideoUrl(commentMediaUrl) ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Film className="h-4 w-4" />
                        <span className="truncate">{commentMediaUrl}</span>
                      </div>
                    ) : (
                      <img src={commentMediaUrl} alt="Preview" className="max-h-40 object-contain mx-auto" />
                    )}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-4 text-center">
            <p>Please log in to comment on this post.</p>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        ) : (
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

interface CommentCardProps {
  comment: ForumComment;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const formattedDate = format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a");
  
  // Function to determine if a URL is a video
  const isVideoUrl = (url: string) => {
    return url && (
      url.match(/\.(mp4|webm|ogg)$/) || 
      url.includes('youtube.com') || 
      url.includes('youtu.be') || 
      url.includes('vimeo.com')
    );
  };
  
  // Function to get YouTube embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };
  
  // Render media content
  const renderMedia = () => {
    if (!comment.media_url) return null;
    
    if (isVideoUrl(comment.media_url)) {
      // Handle YouTube videos
      if (comment.media_url.includes('youtube.com') || comment.media_url.includes('youtu.be')) {
        const embedUrl = getYoutubeEmbedUrl(comment.media_url);
        if (embedUrl) {
          return (
            <div className="relative pt-[56.25%] mt-3 overflow-hidden rounded-md">
              <iframe 
                className="absolute top-0 left-0 w-full h-full border-0"
                src={embedUrl}
                title="Comment video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
      }
      
      // Handle direct video files
      return (
        <div className="mt-3 relative rounded-md overflow-hidden">
          <video 
            className="w-full max-h-60 object-contain" 
            controls
          >
            <source src={comment.media_url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Default to image
    return (
      <div className="mt-3">
        <img 
          src={comment.media_url} 
          alt="Comment attachment" 
          className="rounded-md max-h-60 object-contain" 
        />
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={comment.user_image} alt={comment.user_name || "User"} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <span className="font-medium">{comment.user_name || "Anonymous"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <p className="whitespace-pre-wrap">{comment.content}</p>
        {renderMedia()}
      </CardContent>
    </Card>
  );
};

export default PostDetail;
