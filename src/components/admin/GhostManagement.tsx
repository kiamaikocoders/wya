import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Play, 
  X, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Plus,
  History,
  BarChart3,
  ExternalLink,
  Info,
  Upload,
  Calendar,
  Search,
  HelpCircle
} from 'lucide-react';
import { ghostService, type GhostActionQueue, type GhostPersonaGroup, type GhostUser } from '@/lib/ghost-service';
import { eventService } from '@/lib/event-service';
import { storyService } from '@/lib/story/story-service';
import { forumService } from '@/lib/forum-service';
import { engagementService } from '@/lib/engagement-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GhostManagement: React.FC = () => {
  const [ghostUsers, setGhostUsers] = useState<GhostUser[]>([]);
  const [personaGroups, setPersonaGroups] = useState<GhostPersonaGroup[]>([]);
  const [queuedActions, setQueuedActions] = useState<GhostActionQueue[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersonaGroup, setSelectedPersonaGroup] = useState<number | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Action creation form state
  const [actionType, setActionType] = useState<GhostActionQueue['action_type']>('like_story');
  const [targetType, setTargetType] = useState<GhostActionQueue['target_type']>('story');
  const [targetId, setTargetId] = useState<string>('');
  const [selectedPersonaForAction, setSelectedPersonaForAction] = useState<number | 'all'>('all');
  
  // Form fields for content creation (replaces JSON)
  const [contentTitle, setContentTitle] = useState<string>('');
  const [contentText, setContentText] = useState<string>('');
  const [contentCategory, setContentCategory] = useState<string>('general');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Target selection state
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all');

  // Fetch events, stories, posts for target selection
  const { data: events = [] } = useQuery({
    queryKey: ['allEvents', 'ghost-management'],
    queryFn: () => eventService.queryEvents({
      search: '',
      category: null,
      location: null,
      tags: [],
      featuredOnly: false,
      startDate: null,
      endDate: null,
      page: 1,
      pageSize: 500,
      sort: 'soonest',
      includePast: true,
    }).then(result => result.events),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['allStories', 'ghost-management'],
    queryFn: () => storyService.getAllStories(),
    staleTime: 1000 * 60,
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts', 'ghost-management'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 60,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: ['communityPosts', 'ghost-management'],
    queryFn: () => engagementService.getCommunityPosts(),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    loadData();
  }, [selectedPersonaGroup]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, groups, actions, stats] = await Promise.all([
        selectedPersonaGroup === 'all' 
          ? ghostService.getGhostUsers()
          : ghostService.getGhostUsersByPersona(selectedPersonaGroup as number),
        ghostService.getPersonaGroups(),
        ghostService.getQueuedActions(),
        ghostService.getStatistics()
      ]);

      setGhostUsers(users);
      setPersonaGroups(groups);
      setQueuedActions(actions);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load ghost management data');
    } finally {
      setLoading(false);
    }
  };

  // Filter events by status
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (eventFilter === 'upcoming') return eventDate >= now;
      if (eventFilter === 'past') return eventDate < now;
      if (eventFilter === 'ongoing') {
        // Assume events last 4 hours
        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + 4);
        return now >= eventDate && now <= endDate;
      }
      return true; // all
    });
  }, [events, eventFilter]);

  // Filter targets by search query
  const filteredStories = useMemo(() => {
    if (!targetSearchQuery) return stories.slice(0, 20);
    const query = targetSearchQuery.toLowerCase();
    return stories.filter(s => 
      s.content?.toLowerCase().includes(query) ||
      s.caption?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [stories, targetSearchQuery]);

  const filteredForumPosts = useMemo(() => {
    if (!targetSearchQuery) return forumPosts.slice(0, 20);
    const query = targetSearchQuery.toLowerCase();
    return forumPosts.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [forumPosts, targetSearchQuery]);

  const filteredCommunityPosts = useMemo(() => {
    if (!targetSearchQuery) return communityPosts.slice(0, 20);
    const query = targetSearchQuery.toLowerCase();
    return communityPosts.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [communityPosts, targetSearchQuery]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ghost-content/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const bucket = 'media';

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setMediaUrl(data.publicUrl);
      setMediaPreview(data.publicUrl);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please upload an image or video file');
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);

    // Upload file
    handleFileUpload(file);
  };

  const handleProcessActions = async () => {
    setIsProcessing(true);
    try {
      const result = await ghostService.processActions();
      toast.success(`Processed ${result.processed} actions`);
      // Reload data after processing
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Error processing actions:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAction = async () => {
    // Validate target ID for non-create actions
    if (actionType !== 'create_story' && actionType !== 'create_post' && actionType !== 'create_community_post') {
      if (!targetId) {
        toast.error('Please select a target');
        return;
      }
    }

    // Validate content for create actions
    if (actionType === 'create_story' || actionType === 'create_post' || actionType === 'create_community_post') {
      if (!contentText.trim()) {
        toast.error('Please enter content');
        return;
      }
      if (actionType === 'create_post' || actionType === 'create_community_post') {
        if (!contentTitle.trim()) {
          toast.error('Please enter a title');
          return;
        }
      }
      if (actionType === 'create_community_post' && !contentCategory) {
        toast.error('Please select a category');
        return;
      }
    }

    try {
      // Build metadata from form fields
      let metadata: any = {};
      let finalTargetId: number | undefined = undefined;
      let finalTargetType: GhostActionQueue['target_type'] = targetType;
      
      if (actionType === 'create_story') {
        metadata = {
          content: contentText,
          media_url: mediaUrl || undefined
        };
        // For create_story, event_id goes in target_id if event is selected
        if (selectedEventId) {
          finalTargetId = parseInt(selectedEventId);
          finalTargetType = 'event';
        }
      } else if (actionType === 'create_post') {
        metadata = {
          title: contentTitle,
          content: contentText,
          media_url: mediaUrl || undefined
        };
        // For create_post, event_id goes in target_id if event is selected
        if (selectedEventId) {
          finalTargetId = parseInt(selectedEventId);
          finalTargetType = 'event';
        }
      } else if (actionType === 'create_community_post') {
        metadata = {
          title: contentTitle,
          content: contentText,
          category: contentCategory,
          media_url: mediaUrl || undefined
        };
        // Community posts don't have event_id
      } else {
        // For non-create actions, use the selected target_id
        finalTargetId = targetId ? parseInt(targetId) : undefined;
      }
      
      const params = {
        action_type: actionType,
        target_type: finalTargetType,
        target_id: finalTargetId,
        persona_group_id: selectedPersonaForAction === 'all' ? undefined : selectedPersonaForAction as number,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      const result = await ghostService.createGhostAction(params);
      if (result) {
        // Reset form
        setTargetId('');
        setContentTitle('');
        setContentText('');
        setContentCategory('general');
        setMediaUrl('');
        setSelectedEventId('');
        setMediaPreview(null);
        setTargetSearchQuery('');
        // Reload actions
        loadData();
      }
    } catch (error: any) {
      console.error('Error creating action:', error);
    }
  };

  const handleCancelAction = async (id: number) => {
    if (confirm('Are you sure you want to cancel this action?')) {
      const success = await ghostService.cancelAction(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleDeleteAction = async (id: number) => {
    if (confirm('Are you sure you want to delete this action? This cannot be undone.')) {
      const success = await ghostService.deleteAction(id);
      if (success) {
        loadData();
      }
    }
  };

  const getStatusBadge = (status: GhostActionQueue['status']) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      processing: { variant: 'default', icon: Loader2, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      completed: { variant: 'default', icon: CheckCircle2, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      failed: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      cancelled: { variant: 'outline', icon: X, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        {status === 'processing' ? (
          <Icon className="h-3 w-3 animate-spin" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
        {status}
      </Badge>
    );
  };

  // Determine if action needs target ID
  const needsTargetId = actionType !== 'create_story' && actionType !== 'create_post' && actionType !== 'create_community_post';
  
  // Determine target type based on action type
  const getTargetTypeForAction = () => {
    if (actionType.startsWith('like_') || actionType.startsWith('comment_')) {
      if (actionType.includes('story')) return 'story';
      if (actionType.includes('post') && !actionType.includes('community')) return 'forum_post';
      if (actionType.includes('community_post')) return 'community_post';
    }
    if (actionType === 'follow_user') return 'user';
    return targetType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Ghost User Management</h2>
        <p className="text-muted-foreground">
          Manage ghost accounts and queue engagement actions
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Ghost Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_ghost_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Queued Actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_queued_actions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending_actions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.completed_actions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.failed_actions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Action Queue</TabsTrigger>
          <TabsTrigger value="users">Ghost Users</TabsTrigger>
          <TabsTrigger value="create">Create Action</TabsTrigger>
        </TabsList>

        {/* Action Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queued Actions</CardTitle>
                  <CardDescription>
                    Monitor and manage queued ghost actions
                  </CardDescription>
                </div>
                {statistics?.pending_actions > 0 && (
                  <Button
                    onClick={handleProcessActions}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Process Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queuedActions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No actions in queue
                  </p>
                ) : (
                  <div className="space-y-2">
                    {queuedActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{action.action_type.replace(/_/g, ' ')}</span>
                            {getStatusBadge(action.status)}
                            {action.target_id && (
                              <span className="text-sm text-muted-foreground">
                                Target: {action.target_type} #{action.target_id}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              Scheduled: {format(new Date(action.scheduled_at), 'PPp')}
                            </div>
                            {action.executed_at && (
                              <div>
                                Executed: {format(new Date(action.executed_at), 'PPp')}
                              </div>
                            )}
                            {action.error_message && (
                              <div className="text-red-600">
                                Error: {action.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {action.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelAction(action.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAction(action.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ghost Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ghost Users</CardTitle>
              <CardDescription>
                View all ghost accounts ({ghostUsers.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Filter by Persona Group</Label>
                <Select
                  value={selectedPersonaGroup === 'all' ? 'all' : selectedPersonaGroup.toString()}
                  onValueChange={(value) => setSelectedPersonaGroup(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {personaGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {ghostUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No ghost users found
                  </p>
                ) : (
                  ghostUsers.map((user) => (
                    <Link
                      key={user.id}
                      to={`/users/${user.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{user.full_name || user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username} • {user.location || 'No location'}
                          </div>
                          {user.bio && (
                            <div className="text-sm mt-1 text-muted-foreground">{user.bio}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Ghost</Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Action Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Ghost Action</CardTitle>
              <CardDescription>
                Queue an action to be performed by ghost accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Help Alert for Forum vs Community Posts */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Forum Posts</strong> can be linked to events (event-specific discussions). 
                  <strong> Community Posts</strong> are general discussions with categories (not event-specific).
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => {
                    setActionType(value as GhostActionQueue['action_type']);
                    // Reset form when action type changes
                    setTargetId('');
                    setContentTitle('');
                    setContentText('');
                    setMediaUrl('');
                    setMediaPreview(null);
                    setSelectedEventId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like_story">Like Story</SelectItem>
                    <SelectItem value="like_post">Like Forum Post</SelectItem>
                    <SelectItem value="like_community_post">Like Community Post</SelectItem>
                    <SelectItem value="comment_story">Comment on Story</SelectItem>
                    <SelectItem value="comment_post">Comment on Forum Post</SelectItem>
                    <SelectItem value="comment_community_post">Comment on Community Post</SelectItem>
                    <SelectItem value="create_story">Create Story</SelectItem>
                    <SelectItem value="create_post">Create Forum Post</SelectItem>
                    <SelectItem value="create_community_post">Create Community Post</SelectItem>
                    <SelectItem value="follow_user">Follow User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target ID Selection - Dropdowns for existing content */}
              {needsTargetId && (
                <div className="space-y-2">
                  <Label>Select Target</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search..."
                      value={targetSearchQuery}
                      onChange={(e) => setTargetSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <Select
                      value={targetId}
                      onValueChange={setTargetId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getTargetTypeForAction() === 'story' && (
                          <>
                            {filteredStories.length === 0 ? (
                              <SelectItem value="" disabled>No stories found</SelectItem>
                            ) : (
                              filteredStories.map((story) => (
                                <SelectItem key={story.id} value={story.id.toString()}>
                                  Story #{story.id} - {story.content?.substring(0, 50) || story.caption?.substring(0, 50) || 'No content'}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                        {getTargetTypeForAction() === 'forum_post' && (
                          <>
                            {filteredForumPosts.length === 0 ? (
                              <SelectItem value="" disabled>No forum posts found</SelectItem>
                            ) : (
                              filteredForumPosts.map((post) => (
                                <SelectItem key={post.id} value={post.id.toString()}>
                                  Forum Post #{post.id} - {post.title || post.content.substring(0, 50)}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                        {getTargetTypeForAction() === 'community_post' && (
                          <>
                            {filteredCommunityPosts.length === 0 ? (
                              <SelectItem value="" disabled>No community posts found</SelectItem>
                            ) : (
                              filteredCommunityPosts.map((post) => (
                                <SelectItem key={post.id} value={post.id.toString()}>
                                  Community Post #{post.id} - {post.title || post.content.substring(0, 50)}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                        {getTargetTypeForAction() === 'user' && (
                          <SelectItem value="" disabled>User selection coming soon</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {targetId && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {getTargetTypeForAction()} #{targetId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Content Creation Form Fields (replaces JSON) */}
              {(actionType === 'create_story' || actionType === 'create_post' || actionType === 'create_community_post') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-semibold">Content Details</Label>
                  </div>

                  {/* Title (for posts) */}
                  {(actionType === 'create_post' || actionType === 'create_community_post') && (
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder="Enter post title"
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="space-y-2">
                    <Label>Content *</Label>
                    <Textarea
                      placeholder="Enter content..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Category (for community posts) */}
                  {actionType === 'create_community_post' && (
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={contentCategory} onValueChange={setContentCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="tips">Tips</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                          <SelectItem value="trending">Trending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Event ID (for forum posts and stories) */}
                  {(actionType === 'create_story' || actionType === 'create_post') && (
                    <div className="space-y-2">
                      <Label>Link to Event (Optional)</Label>
                      <div className="space-y-2">
                        <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as typeof eventFilter)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={selectedEventId}
                          onValueChange={setSelectedEventId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event (optional)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="">None</SelectItem>
                            {filteredEvents.map((event) => (
                              <SelectItem key={event.id} value={event.id.toString()}>
                                {event.title} - {format(new Date(event.date), 'MMM d, yyyy')} • {event.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Media Upload */}
                  <div className="space-y-2">
                    <Label>Media (Optional)</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Or enter media URL"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="flex-1"
                        />
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="media-upload"
                            disabled={isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('media-upload')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {mediaPreview && (
                        <div className="relative">
                          <img
                            src={mediaPreview}
                            alt="Preview"
                            className="max-w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setMediaPreview(null);
                              setMediaUrl('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload an image or video, or enter a URL. Max file size: 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Persona Group</Label>
                <Select
                  value={selectedPersonaForAction === 'all' ? 'all' : selectedPersonaForAction.toString()}
                  onValueChange={(value) => setSelectedPersonaForAction(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ghost Users</SelectItem>
                    {personaGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name} ({group.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateAction} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Queue Action
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GhostManagement;
