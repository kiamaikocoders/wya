import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Heart, 
  Share, 
  MapPin, 
  Tag, 
  Upload, 
  X, 
  TrendingUp,
  Users,
  Lightbulb,
  Music,
  Camera
} from 'lucide-react';
import { engagementService } from '@/lib/engagement-service';
import { storageService } from '@/lib/storage-service';
import { toast } from 'sonner';

interface CommunityPostsProps {
  onPostCreated?: () => void;
}

const CommunityPosts: React.FC<CommunityPostsProps> = ({ onPostCreated }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    location: '',
    tags: '',
    mediaFile: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: 'General Discussion', icon: MessageCircle },
    { value: 'tips', label: 'Local Tips', icon: Lightbulb },
    { value: 'culture', label: 'Culture & Trends', icon: Music },
    { value: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await engagementService.getCommunityPosts(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setPosts(data);
    } catch (error) {
      console.error('Error loading community posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!storageService.validateFileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])) {
      toast.error('Invalid file type. Please select an image or video file.');
      return;
    }

    if (!storageService.validateFileSize(file, 50)) {
      toast.error('File size must be less than 50MB.');
      return;
    }

    setFormData({ ...formData, mediaFile: file });
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeFile = () => {
    setFormData({ ...formData, mediaFile: null });
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let mediaUrl = '';
      let mediaType = '';

      // Upload media if provided
      if (formData.mediaFile) {
        const uploadResult = await storageService.uploadCommunityContent(
          formData.mediaFile,
          'current-user-id' // This should be the actual user ID
        );
        mediaUrl = uploadResult.publicUrl;
        mediaType = formData.mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      // Create community post
      await engagementService.createCommunityPost(
        formData.title,
        formData.content,
        formData.category,
        mediaUrl,
        mediaType,
        formData.location,
        formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      );

      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'general',
        location: '',
        tags: '',
        mediaFile: null
      });
      setPreviewUrl(null);
      setShowCreateForm(false);

      // Reload posts
      loadPosts();
      
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error('Error creating community post:', error);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await engagementService.likeCommunityPost(postId);
      // Reload posts to update like count
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Community Posts
        </h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="outline"
        >
          {showCreateForm ? 'Cancel' : 'Create Post'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Community Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's on your mind?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your thoughts with the community..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where are you?"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="fun, nightlife, friends"
                />
              </div>

              <div>
                <Label htmlFor="media">Media (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-kenya-brown file:text-white hover:file:bg-kenya-brown-dark"
                  />
                  {previewUrl && (
                    <div className="relative">
                      {formData.mediaFile?.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-48 object-cover rounded-md"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeFile}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Create Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              <category.icon className="h-4 w-4 mr-1" />
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts found in this category.
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-kenya-brown rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {post.user?.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{post.user?.username || 'Anonymous'}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                  <p className="text-gray-700 mb-4">{post.content}</p>
                  
                  {post.media_url && (
                    <div className="mb-4">
                      {post.media_type === 'video' ? (
                        <video
                          src={post.media_url}
                          controls
                          className="w-full h-64 object-cover rounded-md"
                        />
                      ) : (
                        <img
                          src={post.media_url}
                          alt="Post media"
                          className="w-full h-64 object-cover rounded-md"
                        />
                      )}
                    </div>
                  )}

                  {post.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      {post.location}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1"
                    >
                      <Heart className="h-4 w-4" />
                      {post.likes_count || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Share className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityPosts;

