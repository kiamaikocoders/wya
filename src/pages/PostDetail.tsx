
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { forumService, ForumComment } from "@/lib/forum-service";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, MessageCircle, ThumbsUp, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  
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
      content: comment.trim()
    });
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
          
          {post.media_url && (
            <div className="mt-4">
              <img 
                src={post.media_url} 
                alt="Post attachment" 
                className="rounded-md max-h-96 object-cover" 
              />
            </div>
          )}
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
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={commentMutation.isPending}
                  >
                    {commentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
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

const CommentCard: React.FC<{ comment: ForumComment }> = ({ comment }) => {
  const formattedDate = format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a");
  
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
      </CardContent>
    </Card>
  );
};

export default PostDetail;
