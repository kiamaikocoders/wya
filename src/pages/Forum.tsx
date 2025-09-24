import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Heart, 
  Share, 
  Eye, 
  Plus, 
  Search,
  Bell,
  User
} from 'lucide-react';
import { forumService, ForumPost, ForumComment } from '@/lib/forum-service';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storage-service';
import { toast } from 'sonner';

const Forum: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { value: 'all', label: 'All Posts' },
    { value: 'general', label: 'General Discussion' },
    { value: 'events', label: 'Events' },
    { value: 'tips', label: 'Tips & Advice' },
    { value: 'questions', label: 'Questions' }
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await forumService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load forum posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const eventId = formData.get('eventId') as string;

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsUploading(true);
      let mediaUrl: string | undefined;

      // Upload media if selected
      if (selectedFile) {
        try {
          const uploadResult = await storageService.uploadFile(selectedFile, {
            bucket: 'forum-media',
            folder: 'posts'
          });
          mediaUrl = uploadResult.publicUrl;
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          toast.error('Failed to upload media');
          return;
        }
      }

      await forumService.createPost({
        title,
        content,
        event_id: eventId && !isNaN(parseInt(eventId)) ? parseInt(eventId) : undefined,
        media_url: mediaUrl
      });
      
      setShowCreateForm(false);
      setSelectedFile(null);
      loadPosts();
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      await forumService.likePost(postId);
      loadPosts(); // Reload to update like count
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleViewPost = async (post: ForumPost) => {
    setSelectedPost(post);
    try {
      // Increment views
      await forumService.incrementViews(post.id);
      
      // Load comments
      const postComments = await forumService.getPostComments(post.id);
      setComments(postComments);
      
      // Reload posts to update view count
      loadPosts();
    } catch (error) {
      console.error('Error loading post details:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    setIsSubmittingComment(true);
    try {
      await forumService.createComment({ content: newComment, post_id: selectedPost.id });
      
      setNewComment('');
      // Reload comments
      const postComments = await forumService.getPostComments(selectedPost.id);
      setComments(postComments);
      
      // Reload posts to update comment count
      loadPosts();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Debug logging
  console.log('Forum - isAuthenticated:', isAuthenticated, 'user:', user, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kenya-brown mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading...</p>
            </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-kenya-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the forum.</p>
          <p className="text-gray-500 text-sm mt-2">Debug: isAuthenticated={String(isAuthenticated)}, user={user ? 'exists' : 'null'}</p>
        </div>
      </div>
    );
  }

    return (
    <>
      <Helmet>
        <title>Forum - WYA</title>
        <meta name="description" content="Join the WYA community discussion forum. Share ideas, ask questions, and connect with other event-goers." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-purple-600" />
                Community Forum
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Share ideas, ask questions, and connect with the WYA community
              </p>
            </div>
        <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Post
        </Button>
      </div>

          {/* Create Post Form */}
          {showCreateForm && (
            <Card className="mb-8 bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-medium">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="What's your post about?"
                      className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content" className="text-gray-700 font-medium">Content *</Label>
                    <Textarea
                      id="content"
                      name="content"
                      placeholder="Share your thoughts with the community..."
                      rows={4}
                      className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="eventId" className="text-gray-700 font-medium">Event ID (Optional)</Label>
                    <Input
                      id="eventId"
                      name="eventId"
                      type="number"
                      placeholder="Link to a specific event"
                      className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="media" className="text-gray-700 font-medium">Media (Optional)</Label>
                    <Input
                      id="media"
                      name="media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isUploading ? 'Creating...' : 'Create Post'}
                    </Button>
                  <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                  </Button>
                </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 w-full"
                />
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.value
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Be the first to start a discussion!'}
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewPost(post)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user?.avatar_url} />
                          <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                            {post.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{post.user?.username || 'Anonymous'}</h3>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">user@example.com</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          post.category === 'general' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {post.category || 'general'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{post.title}</h4>
                    
                    {post.media_url && (
                      <div className="mb-4">
                        <img
                          src={post.media_url}
                          alt="Post media"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikePost(post.id);
                          }}
                          className="flex items-center gap-1 hover:text-purple-600 p-2"
                        >
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count || 0}</span>
                        </Button>
                        <div className="flex items-center gap-1 p-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 p-2">
                          <Eye className="h-4 w-4" />
                          <span>{post.views_count || 0}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-purple-600 p-2"
                      >
                        <Share className="h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <Button
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-12 h-12 shadow-lg"
          onClick={() => setShowCreateForm(true)}
        >
          <Bell className="h-5 w-5" />
        </Button>
    </div>
    </>
  );
};

export default Forum;