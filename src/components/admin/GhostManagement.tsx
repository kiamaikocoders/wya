import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { ghostService, type GhostActionQueue, type GhostPersonaGroup, type GhostUser } from '@/lib/ghost-service';
import { eventService } from '@/lib/event-service';
import { eventLastDayIso } from '@/utils/event-utils';
import { storyService } from '@/lib/story/story-service';
import { adminService, type AdminStory } from '@/lib/admin-service';
import { supabase } from '@/lib/supabase';
import {
  prepareMediaForUpload,
  STORAGE_CACHE_CONTROL_IMMUTABLE,
} from '@/lib/media-upload-prepare';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { Story } from '@/lib/story/types';

const GhostManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [ghostUsers, setGhostUsers] = useState<GhostUser[]>([]);
  const [personaGroups, setPersonaGroups] = useState<GhostPersonaGroup[]>([]);
  const [queuedActions, setQueuedActions] = useState<GhostActionQueue[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersonaGroup, setSelectedPersonaGroup] = useState<number | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ghost content management state
  const [ghostStories, setGhostStories] = useState<AdminStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [editingStory, setEditingStory] = useState<AdminStory | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image' | 'video'>('image');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<AdminStory | null>(null);
  
  // Action creation form state
  const [actionType, setActionType] = useState<GhostActionQueue['action_type']>('like_story');
  const [targetType, setTargetType] = useState<GhostActionQueue['target_type']>('story');
  const [targetId, setTargetId] = useState<string>('');
  const [selectedPersonaForAction, setSelectedPersonaForAction] = useState<number | 'all' | 'random'>('all');
  
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
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
  const [likeTotalTarget, setLikeTotalTarget] = useState(30);
  const [preferMediaFirstLikes, setPreferMediaFirstLikes] = useState(false);
  const [selectedStoryIdsForLike, setSelectedStoryIdsForLike] = useState<number[]>([]);

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
    queryFn: () => storyService.getAllStories(undefined, 500),
    staleTime: 1000 * 60,
  });

  // Fetch users for follow_user action
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers', 'ghost-management', targetSearchQuery],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .neq('is_ghost', true) // Exclude ghost users
          .order('full_name', { ascending: true })
          .limit(500);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: actionType === 'follow_user',
    staleTime: 1000 * 60 * 5,
  });

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!targetSearchQuery || !allUsers) return allUsers?.slice(0, 50) || [];
    const query = targetSearchQuery.toLowerCase();
    return allUsers.filter(u => 
      u?.full_name?.toLowerCase().includes(query) ||
      u?.username?.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [allUsers, targetSearchQuery]);

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
      
      // Always use the actual database count from statistics (not filtered list)
      // The statistics already reflect the total from database
      // Only override if we're filtering by persona group
      if (selectedPersonaGroup !== 'all') {
        // When filtered, show both: filtered count and total
        stats.total_ghost_users = stats.total_ghost_users; // Keep total
        stats.filtered_ghost_users = users.length; // Add filtered count
      }
      
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load ghost management data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const lastStr = eventLastDayIso(event);
      if (eventFilter === 'upcoming') return eventDate >= now;
      if (eventFilter === 'past') return lastStr < todayStr;
      if (eventFilter === 'ongoing') return eventDate <= now && lastStr >= todayStr;
      return true;
    });
  }, [events, eventFilter]);

  // For "Like Story": all events (search-filtered); no date cutoff for admin
  const eventsForLikeStoryTarget = useMemo(() => {
    const q = (targetSearchQuery || '').trim().toLowerCase();
    const base = events;
    if (!q) return base.slice(0, 50);
    return base
      .filter((e: { title?: string; location?: string; description?: string }) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [events, targetSearchQuery]);

  const filteredEventsForStory = useMemo(() => {
    try {
      const base = filteredEvents || [];
      const q = eventSearchQuery.trim().toLowerCase();
      if (!q) return base.slice(0, 50);

      return base
        .filter((event: any) => {
          const title = (event?.title || '').toString().toLowerCase();
          const location = (event?.location || '').toString().toLowerCase();
          const description = (event?.description || '').toString().toLowerCase();
          return title.includes(q) || location.includes(q) || description.includes(q);
        })
        .slice(0, 50);
    } catch (error) {
      console.error('Error filtering events for story:', error);
      return (filteredEvents || []).slice(0, 50);
    }
  }, [filteredEvents, eventSearchQuery]);

  // Filter targets by search query (with error handling)
  const filteredStories = useMemo(() => {
    try {
      if (!targetSearchQuery || !stories) return stories?.slice(0, 20) || [];
      const query = targetSearchQuery.toLowerCase();
      return stories.filter(s => 
        s?.content?.toLowerCase().includes(query) ||
        s?.caption?.toLowerCase().includes(query)
      ).slice(0, 20);
    } catch (error) {
      console.error('Error filtering stories:', error);
      return stories?.slice(0, 20) || [];
    }
  }, [stories, targetSearchQuery]);

  const storiesInSelectedLikeEvent = useMemo(() => {
    if (actionType !== 'like_story' || !targetId) return [];
    const eid = parseInt(targetId, 10);
    if (Number.isNaN(eid)) return [];
    return (stories as Story[]).filter((s) => s.event_id === eid);
  }, [actionType, targetId, stories]);

  useEffect(() => {
    if (actionType === 'like_story') setSelectedStoryIdsForLike([]);
  }, [targetId, actionType]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const prepared = await prepareMediaForUpload(file, 'ghost');
      const fileExt = prepared.name.split('.').pop();
      const fileName = `ghost-content/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const bucket = 'media';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, prepared, {
          cacheControl: STORAGE_CACHE_CONTROL_IMMUTABLE,
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
      queryClient.invalidateQueries({ queryKey: ['discoverRecentEventStories'] });
      queryClient.invalidateQueries({ queryKey: ['discoverEventStories'] });
      queryClient.invalidateQueries({ queryKey: ['discoverEventsByIds'] });
      queryClient.invalidateQueries({ queryKey: ['ungroupedStories'] });
      queryClient.invalidateQueries({ queryKey: ['allEvents', 'discover-including-past'] });
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
    if (actionType !== 'create_story') {
      if (!targetId) {
        toast.error('Please select a target');
        return;
      }
    }

    // Content is optional for create_story - Edge Function will use default if empty

    try {
      // Build metadata from form fields
      let metadata: any = {};
      let finalTargetId: number | string | undefined = undefined;
      let finalTargetType: GhostActionQueue['target_type'] = targetType;
      let finalPersonaGroupId: number | undefined = undefined;
      let finalGhostUserIds: string[] | undefined = undefined;
      
      // Handle "One Random User" selection
      if (selectedPersonaForAction === 'random') {
        // Fetch all ghost users and pick one random user
        const allGhostUsers = await ghostService.getGhostUsers();
        if (allGhostUsers.length === 0) {
          toast.error('No ghost users available');
          return;
        }
        // Pick a random user
        const randomUser = allGhostUsers[Math.floor(Math.random() * allGhostUsers.length)];
        finalGhostUserIds = [randomUser.id];
        finalPersonaGroupId = undefined;
        toast.info(`Selected random user: ${randomUser.username || randomUser.id}`);
      } else if (selectedPersonaForAction === 'all') {
        // Use all users - don't set persona_group_id or ghost_user_ids
        finalPersonaGroupId = undefined;
        finalGhostUserIds = undefined;
      } else {
        // Use specific persona group (it's a number)
        finalPersonaGroupId = selectedPersonaForAction as number;
        finalGhostUserIds = undefined;
      }
      
      if (actionType === 'create_story') {
        metadata = {
          content: contentText,
          media_url: mediaUrl || undefined
        };
        // For create_story, event_id goes in target_id if event is selected
        if (selectedEventId && selectedEventId !== 'none') {
          finalTargetId = parseInt(selectedEventId);
          finalTargetType = 'event';
        }
      } else if (actionType === 'follow_user') {
        // For follow_user, target_id is a UUID string, not a number
        finalTargetId = targetId || undefined;
        finalTargetType = 'user';
      } else if (actionType === 'like_story') {
        finalTargetId = targetId || undefined;
        finalTargetType = 'event';
        const n = Math.max(1, Math.min(100_000, Math.floor(Number(likeTotalTarget)) || 30));
        metadata = {
          total_likes: n,
          prefer_media_first: preferMediaFirstLikes,
          ...(selectedStoryIdsForLike.length > 0 ? { story_ids: [...selectedStoryIdsForLike] } : {}),
        };
      } else {
        // For other non-create actions, use the selected target_id
        finalTargetId = targetId || undefined;
      }
      
      const params = {
        action_type: actionType,
        target_type: finalTargetType,
        target_id: finalTargetId,
        persona_group_id: finalPersonaGroupId,
        ghost_user_ids: finalGhostUserIds,
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
        setEventSearchQuery('');
        setLikeTotalTarget(30);
        setPreferMediaFirstLikes(false);
        setSelectedStoryIdsForLike([]);
        // Reload actions
        loadData();
      }
    } catch (error: any) {
      console.error('Error creating action:', error);
      toast.error(error.message || 'Failed to create action');
    }
  };

  const handleCancelAction = async (id: number) => {
    if (confirm('Are you sure you want to cancel this action?')) {
      try {
        await ghostService.cancelAction(id);
        loadData();
      } catch (error) {
        console.error('Failed to cancel action:', error);
      }
    }
  };

  const handleDeleteAction = async (id: number) => {
    if (confirm('Are you sure you want to delete this action? This cannot be undone.')) {
      try {
        await ghostService.deleteAction(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete action:', error);
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
  const needsTargetId = actionType !== 'create_story';
  
  // Determine target type based on action type
  const getTargetTypeForAction = () => {
    if (actionType === 'like_story') return 'event'; // Like story targets events, not individual stories
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
              {selectedPersonaGroup !== 'all' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Filtered: {ghostUsers.length} of {statistics.total_ghost_users}
                </p>
              )}
              {selectedPersonaGroup === 'all' && ghostUsers.length !== statistics.total_ghost_users && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠️ Mismatch: Displayed {ghostUsers.length}, DB has {statistics.total_ghost_users}
                </p>
              )}
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

      <Tabs 
        defaultValue="queue" 
        className="space-y-4"
        onValueChange={(value) => {
          // Auto-load ghost stories when content tab is opened
          if (value === 'content' && ghostStories.length === 0 && !loadingStories) {
            setLoadingStories(true);
            adminService.getGhostStories()
              .then(stories => {
                setGhostStories(stories);
                if (stories.length > 0) {
                  toast.success(`Loaded ${stories.length} ghost stories`);
                }
              })
              .catch(error => {
                console.error('Error loading ghost stories:', error);
                toast.error('Failed to load ghost stories. Please try again.');
              })
              .finally(() => {
                setLoadingStories(false);
              });
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="queue">Action Queue</TabsTrigger>
          <TabsTrigger value="users">Ghost Users</TabsTrigger>
          <TabsTrigger value="content">Ghost Content</TabsTrigger>
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
                <div className="flex gap-2">
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
                  <Button
                    onClick={async () => {
                      try {
                        const result = await ghostService.resetStuckActions();
                        if (result.reset_count > 0) {
                          loadData(); // Refresh the queue
                        }
                      } catch (error) {
                        console.error('Error resetting stuck actions:', error);
                      }
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                    title="Reset actions stuck in processing state (older than 10 minutes)"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Stuck
                  </Button>
                </div>
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
                View all ghost accounts
                {statistics && ghostUsers.length !== statistics.total_ghost_users ? (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {' '}(Showing {ghostUsers.length} of {statistics.total_ghost_users} total)
                  </span>
                ) : (
                  <span> ({ghostUsers.length} total)</span>
                )}
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

        {/* Ghost Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ghost Content Management</CardTitle>
                  <CardDescription>
                    View, edit, and delete stories created by ghost accounts
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setLoadingStories(true);
                    try {
                      const stories = await adminService.getGhostStories();
                      setGhostStories(stories);
                      if (stories.length > 0) {
                        toast.success(`Loaded ${stories.length} ghost stories`);
                      } else {
                        toast.info('No ghost stories found');
                      }
                    } catch (error: any) {
                      console.error('Error loading ghost stories:', error);
                      const errorMessage = error?.message || 'Failed to load ghost stories';
                      toast.error(errorMessage);
                    } finally {
                      setLoadingStories(false);
                    }
                  }}
                  disabled={loadingStories}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loadingStories && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStories ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : ghostStories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No ghost stories found.</p>
                  <p className="text-sm">Click Refresh to load stories, or check if ghost accounts have created any stories.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ghostStories.map((story) => (
                    <Card key={story.id} className="relative">
                      <CardContent className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-4">
                          {/* Media Preview */}
                          {story.media_url && (
                            <div className="flex-shrink-0">
                              {story.media_type === 'video' ? (
                                <video
                                  src={story.media_url}
                                  className="w-24 h-24 object-cover rounded-lg"
                                  controls={false}
                                />
                              ) : (
                                <img
                                  src={story.media_url}
                                  alt={story.caption}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Story Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={story.user_image || undefined} />
                                    <AvatarFallback>{story.user_name?.charAt(0) || 'G'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-semibold text-sm">{story.user_name}</span>
                                  {story.event_title && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-sm text-muted-foreground">{story.event_title}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-1 line-clamp-2">{story.caption}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{story.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>❤️ {story.likes_count}</span>
                                  <span>💬 {story.comments_count}</span>
                                  <span>{format(new Date(story.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setEditingStory(story);
                                    setEditContent(story.content);
                                    setEditCaption(story.caption);
                                    setEditMediaUrl(story.media_url || '');
                                    setEditMediaType(story.media_type);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  type="button"
                                  disabled={deletingStoryId === story.id}
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setStoryToDelete(story);
                                  }}
                                >
                                  {deletingStoryId === story.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                    setLikeTotalTarget(30);
                    setPreferMediaFirstLikes(false);
                    setSelectedStoryIdsForLike([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like_story">Like Story</SelectItem>
                    <SelectItem value="create_story">Create Story</SelectItem>
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
                      placeholder={
                        getTargetTypeForAction() === 'event' 
                          ? "Search events by title, location, or description..."
                          : getTargetTypeForAction() === 'user'
                          ? "Search users by name or username..."
                          : "Search by title or content..."
                      }
                      value={targetSearchQuery}
                      onChange={(e) => {
                        try {
                          setTargetSearchQuery(e.target.value);
                        } catch (error) {
                          console.error('Error updating search query:', error);
                        }
                      }}
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
                        {getTargetTypeForAction() === 'event' && (
                          <>
                            {eventsForLikeStoryTarget.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {targetSearchQuery ? 'No events match your search' : 'Search by title or location'}
                              </div>
                            ) : (
                              eventsForLikeStoryTarget.map((event) => (
                                <SelectItem key={event.id} value={event.id.toString()}>
                                  {event.title} - {format(new Date(event.date), 'MMM d, yyyy')} • {event.location}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                        {getTargetTypeForAction() === 'user' && (
                          <>
                            {filteredUsers.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {targetSearchQuery ? 'No users found' : 'Start typing to search users...'}
                              </div>
                            ) : (
                              filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name || user.username || 'Unknown User'} {user.username && `(@${user.username})`}
                                </SelectItem>
                              ))
                            )}
                          </>
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

              {actionType === 'like_story' && targetId && (
                <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="like-total">Total ghost likes to add</Label>
                    <Input
                      id="like-total"
                      type="number"
                      min={1}
                      max={100000}
                      value={likeTotalTarget}
                      onChange={(e) => setLikeTotalTarget(parseInt(e.target.value, 10) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      One action distributes up to this many new likes across unique ghost×story pairs. Capped by
                      (ghosts × stories) minus likes that already exist.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prefer-media-likes"
                      checked={preferMediaFirstLikes}
                      onCheckedChange={(v) => setPreferMediaFirstLikes(v === true)}
                    />
                    <label htmlFor="prefer-media-likes" className="text-sm font-medium leading-none cursor-pointer">
                      Prioritize stories with photo/video when assigning likes
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label>Stories to include (optional)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedStoryIdsForLike(storiesInSelectedLikeEvent.map((s) => s.id))
                          }
                          disabled={storiesInSelectedLikeEvent.length === 0}
                        >
                          Select all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStoryIdsForLike([])}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave none selected to use every story on this event (including items not listed here).
                      Listed: verified stories ({storiesInSelectedLikeEvent.length}).
                    </p>
                    {storiesInSelectedLikeEvent.length > 0 ? (
                      <div className="max-h-52 overflow-y-auto rounded-md border bg-background p-3 space-y-2">
                        {storiesInSelectedLikeEvent.map((s) => (
                          <label
                            key={s.id}
                            className="flex cursor-pointer items-start gap-2 rounded-sm p-1 text-sm hover:bg-muted/80"
                          >
                            <Checkbox
                              checked={selectedStoryIdsForLike.includes(s.id)}
                              onCheckedChange={(checked) =>
                                setSelectedStoryIdsForLike((prev) =>
                                  checked === true
                                    ? [...prev, s.id]
                                    : prev.filter((id) => id !== s.id)
                                )
                              }
                            />
                            <span className="line-clamp-2 text-muted-foreground">
                              <span className="font-mono text-foreground">#{s.id}</span>{' '}
                              {(s.caption || s.content || '').slice(0, 80)}
                              {s.media_url ? ' · media' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        No verified stories in this feed for this event ID. The job will still use all DB stories for
                        the event when nothing is checked above.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Content Creation Form Fields (replaces JSON) */}
              {actionType === 'create_story' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-semibold">Content Details</Label>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label>Content (Optional)</Label>
                    <Textarea
                      placeholder="Enter content..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Event ID (for stories) */}
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
                      <div className="relative">
                        <Input
                          placeholder="Search events by title, location, or description..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        {/* Show filtered events list only when there's a search query */}
                        {eventSearchQuery && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                            {filteredEventsForStory.length > 0 ? (
                              <>
                                <div className="p-2 border-b text-xs text-muted-foreground">
                                  {filteredEventsForStory.length} event{filteredEventsForStory.length !== 1 ? 's' : ''} found
                                  {eventSearchQuery && ` matching "${eventSearchQuery}"`}
                                </div>
                                <div className="p-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedEventId('');
                                      setEventSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${
                                      !selectedEventId ? 'bg-accent' : ''
                                    }`}
                                  >
                                    None
                                  </button>
                                  {filteredEventsForStory.map((event) => (
                                    <button
                                      key={event.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedEventId(event.id.toString());
                                        setEventSearchQuery('');
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${
                                        selectedEventId === event.id.toString() ? 'bg-accent' : ''
                                      }`}
                                    >
                                      <div className="font-medium">{event.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(new Date(event.date), 'MMM d, yyyy')} • {event.location}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                {eventSearchQuery ? `No events match "${eventSearchQuery}"` : 'No events found'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Show selected event */}
                      {selectedEventId && selectedEventId !== 'none' && (() => {
                        const selectedEvent = events.find(e => e.id.toString() === selectedEventId);
                        return selectedEvent ? (
                          <div className="p-3 border rounded-md bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{selectedEvent.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(selectedEvent.date), 'MMM d, yyyy')} • {selectedEvent.location}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEventId('')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

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
                  value={selectedPersonaForAction === 'all' ? 'all' : selectedPersonaForAction === 'random' ? 'random' : selectedPersonaForAction.toString()}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedPersonaForAction('all');
                    } else if (value === 'random') {
                      setSelectedPersonaForAction('random');
                    } else {
                      setSelectedPersonaForAction(parseInt(value));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ghost Users</SelectItem>
                    <SelectItem value="random">One Random User</SelectItem>
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

      {/* Edit Story Dialog */}
      <Dialog open={!!editingStory} onOpenChange={(open) => !open && setEditingStory(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ghost Story</DialogTitle>
            <DialogDescription>
              Edit the content, caption, and media for this ghost-created story
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-caption">Caption</Label>
              <Input
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Story caption..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Story content..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-media-url">Media URL</Label>
              <Input
                id="edit-media-url"
                value={editMediaUrl}
                onChange={(e) => setEditMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {editMediaUrl && (
                <div className="mt-2">
                  {editMediaType === 'video' ? (
                    <video src={editMediaUrl} className="max-w-full max-h-48 rounded-lg" controls />
                  ) : (
                    <img src={editMediaUrl} alt="Preview" className="max-w-full max-h-48 rounded-lg object-cover" />
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-media-type">Media Type</Label>
              <Select
                value={editMediaType}
                onValueChange={(value) => setEditMediaType(value as 'image' | 'video')}
              >
                <SelectTrigger id="edit-media-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStory(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingStory) return;
                
                setIsSaving(true);
                try {
                  await adminService.updateGhostStory(editingStory.id, {
                    content: editContent,
                    caption: editCaption,
                    media_url: editMediaUrl || undefined,
                    media_type: editMediaType,
                  });
                  
                  // Update local state
                  setGhostStories(ghostStories.map(s => 
                    s.id === editingStory.id 
                      ? { ...s, content: editContent, caption: editCaption, media_url: editMediaUrl || undefined, media_type: editMediaType }
                      : s
                  ));
                  
                  // Invalidate React Query cache to refresh Discover page
                  queryClient.invalidateQueries({ queryKey: ['allStories'] });
                  queryClient.invalidateQueries({ queryKey: ['stories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverRecentEventStories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverEventStories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverEventsByIds'] });
                  
                  setEditingStory(null);
                  toast.success('Story updated successfully');
                } catch (error) {
                  console.error('Error updating story:', error);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!storyToDelete} onOpenChange={(open) => !open && setStoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {storyToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-2">
                {storyToDelete.media_url && (
                  <div className="flex-shrink-0">
                    {storyToDelete.media_type === 'video' ? (
                      <video
                        src={storyToDelete.media_url}
                        className="w-16 h-16 object-cover rounded"
                        controls={false}
                      />
                    ) : (
                      <img
                        src={storyToDelete.media_url}
                        alt={storyToDelete.caption}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{storyToDelete.caption || 'Untitled story'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {storyToDelete.user_name}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStoryToDelete(null)}
              disabled={deletingStoryId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!storyToDelete) return;
                
                const storyId = storyToDelete.id;
                setDeletingStoryId(storyId);
                
                try {
                  await adminService.deleteGhostStory(storyId);
                  
                  // Remove from local state
                  setGhostStories(prev => prev.filter(s => s.id !== storyId));
                  
                  // Invalidate React Query cache to refresh Discover page
                  queryClient.invalidateQueries({ queryKey: ['allStories'] });
                  queryClient.invalidateQueries({ queryKey: ['stories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverRecentEventStories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverEventStories'] });
                  queryClient.invalidateQueries({ queryKey: ['discoverEventsByIds'] });
                  
                  toast.success('Story deleted successfully');
                  setStoryToDelete(null);
                } catch (error: any) {
                  console.error('Error deleting story:', error);
                  const errorMessage = error?.message || 'Failed to delete story';
                  toast.error(errorMessage);
                } finally {
                  setDeletingStoryId(null);
                }
              }}
              disabled={deletingStoryId !== null}
            >
              {deletingStoryId === storyToDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Story'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GhostManagement;
