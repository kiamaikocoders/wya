import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageCircle, 
  Heart, 
  Share, 
  Eye, 
  ArrowLeft,
  User,
  Clock,
  Tag,
  Send
} from 'lucide-react';
import { forumService, ForumPost, ForumComment } from '@/lib/forum-service';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      const postIdNum = parseInt(postId!);
      if (isNaN(postIdNum)) {
        throw new Error('Invalid post ID');
      }
      
      const postData = await forumService.getPostById(postIdNum);
      setPost(postData);
      
      // Load comments
      const commentsData = await forumService.getPostComments(postIdNum);
      setComments(commentsData);
      
      // Increment views
      await forumService.incrementViews(postIdNum);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
      navigate('/forum');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, postId]);

  useEffect(() => {
    if (postId) {
      void loadPost();
    }
  }, [loadPost, postId]);

  const handleLikePost = async () => {
    if (!post) return;
    
    try {
      await forumService.likePost(post.id);
      // Reload post to update like count
      const updatedPost = await forumService.getPostById(post.id);
      setPost(updatedPost);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setIsSubmittingComment(true);
    try {
      await forumService.createComment(post.id, {
        content: newComment
      });
      
      setNewComment('');
      // Reload comments
      const commentsData = await forumService.getPostComments(post.id);
      setComments(commentsData);
      
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to view this post.</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kenya-brown mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading post...</p>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-gray-400 mb-4">The post you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/forum')}
            className="bg-kenya-brown hover:bg-kenya-brown-dark"
          >
            Back to Forum
          </Button>
            </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{post.title} - WYA Forum</title>
        <meta name="description" content={post.content.substring(0, 160)} />
      </Helmet>
      
      <div className="min-h-screen bg-kenya-dark">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
        <Button
          variant="ghost"
            onClick={() => navigate('/forum')}
            className="mb-6 text-kenya-brown hover:text-kenya-brown-dark"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>
      
          {/* Post Content */}
          <Card className="mb-8 bg-kenya-dark border-kenya-brown/20">
        <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-kenya-brown rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {post.user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
            <div>
                    <h1 className="text-2xl font-bold text-white">{post.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>@{post.user?.username || 'Anonymous'}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                </div>
                <Badge variant="outline" className="text-kenya-brown border-kenya-brown/30">
                  {post.category || 'general'}
                </Badge>
          </div>
        </CardHeader>
        <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
              
              {post.media_url && (
                <div className="mt-6">
                  <img
                    src={post.media_url}
                    alt="Post media"
                    className="w-full max-h-96 object-cover rounded-md"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-kenya-brown/20">
                <Button
                  variant="ghost"
                  onClick={handleLikePost}
                  className="flex items-center gap-2 hover:text-kenya-brown"
                >
                  <Heart className="h-5 w-5" />
                  <span>{post.likes_count || 0} Likes</span>
            </Button>
                <div className="flex items-center gap-2 text-gray-400">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length} Comments</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="h-5 w-5" />
                  <span>{post.views_count || 0} Views</span>
            </div>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:text-kenya-brown"
                >
                  <Share className="h-5 w-5" />
                  Share
                </Button>
          </div>
            </CardContent>
      </Card>
      
          {/* Comments Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({comments.length})
            </h2>

            {/* Add Comment Form */}
            {isAuthenticated && (
              <Card className="bg-kenya-dark border-kenya-brown/20">
          <CardContent className="pt-6">
                  <form onSubmit={handleSubmitComment} className="space-y-4">
                    <div>
                      <Label htmlFor="comment" className="text-white">Add a comment</Label>
                <Textarea
                        id="comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                  rows={3}
                        className="bg-black/20 border-kenya-brown/30 text-white mt-2"
                        required
                />
                    </div>
                    <div className="flex justify-end">
                  <Button 
                    type="submit" 
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="bg-kenya-brown hover:bg-kenya-brown-dark"
                      >
                        {isSubmittingComment ? (
                          'Posting...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Comment
                          </>
                        )}
                  </Button>
              </div>
            </form>
          </CardContent>
        </Card>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <Card className="bg-kenya-dark border-kenya-brown/20">
                <CardContent className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No comments yet</h3>
                  <p className="text-gray-400">Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id} className="bg-kenya-dark border-kenya-brown/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-kenya-brown rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {comment.user?.username?.charAt(0) || 'U'}
                          </span>
      </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">
                              @{comment.user?.username || 'Anonymous'}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
    </div>
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-kenya-brown"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              {comment.likes_count || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-kenya-brown"
                            >
                              Reply
                            </Button>
            </div>
        </div>
      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetail;