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
import {
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminOutlinePill,
  AdminPagination,
  AdminPrimaryPill,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { useListPagination } from '@/hooks/use-list-pagination';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { draftGhostStoryCaption } from '@/lib/admin-ai-analysis';

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
  const [storiesLoadError, setStoriesLoadError] = useState<string | null>(null);
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
  const [contentSearch, setContentSearch] = useState('');
  const [contentEventFilter, setContentEventFilter] = useState<'all' | string>('all');

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

  const emptyStats = {
    total_ghost_users: 0,
    total_queued_actions: 0,
    pending_actions: 0,
    completed_actions: 0,
    failed_actions: 0,
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, groupsRes, actionsRes, statsRes] = await Promise.allSettled([
        selectedPersonaGroup === 'all'
          ? ghostService.getGhostUsers()
          : ghostService.getGhostUsersByPersona(selectedPersonaGroup as number),
        ghostService.getPersonaGroups(),
        ghostService.getQueuedActions(),
        ghostService.getStatistics(),
      ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const groups = groupsRes.status === 'fulfilled' ? groupsRes.value : [];
      const actions = actionsRes.status === 'fulfilled' ? actionsRes.value : [];
      const stats =
        statsRes.status === 'fulfilled' && statsRes.value
          ? { ...emptyStats, ...statsRes.value }
          : { ...emptyStats };

      if (selectedPersonaGroup !== 'all') {
        (stats as { filtered_ghost_users?: number }).filtered_ghost_users = users.length;
      }

      setGhostUsers(users);
      setPersonaGroups(groups);
      setQueuedActions(actions);
      setStatistics(stats);

      if (
        usersRes.status === 'rejected' &&
        groupsRes.status === 'rejected' &&
        actionsRes.status === 'rejected' &&
        statsRes.status === 'rejected'
      ) {
        toast.error('Failed to load ghost management data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setStatistics({ ...emptyStats });
      toast.error('Failed to load ghost management data');
    } finally {
      setLoading(false);
    }
  };

  const loadGhostStories = async () => {
    setLoadingStories(true);
    setStoriesLoadError(null);
    try {
      const stories = await adminService.getGhostStories();
      setGhostStories(stories);
      if (stories.length > 0) {
        toast.success(`Loaded ${stories.length} ghost stories`);
      }
    } catch (error: unknown) {
      console.error('Error loading ghost stories:', error);
      setGhostStories([]);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: unknown }).message ?? '')
            : 'Failed to load ghost stories';
      setStoriesLoadError(message || 'Failed to load ghost stories');
      toast.error('Could not load ghost stories');
    } finally {
      setLoadingStories(false);
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

  const stats = statistics ?? emptyStats;

  const filteredGhostStories = useMemo(() => {
    const q = contentSearch.trim().toLowerCase();
    return ghostStories.filter((story) => {
      if (contentEventFilter !== 'all' && String(story.event_id ?? '') !== contentEventFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (story.user_name || '').toLowerCase().includes(q) ||
        (story.event_title || '').toLowerCase().includes(q) ||
        (story.caption || '').toLowerCase().includes(q) ||
        (story.content || '').toLowerCase().includes(q)
      );
    });
  }, [ghostStories, contentSearch, contentEventFilter]);

  const queuePaging = useListPagination(queuedActions);
  const usersPaging = useListPagination(ghostUsers, {
    resetKey: selectedPersonaGroup === 'all' ? 'all' : selectedPersonaGroup,
  });
  const storiesPaging = useListPagination(filteredGhostStories, {
    resetKey: `${contentSearch}|${contentEventFilter}`,
  });

  const contentEventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of ghostStories) {
      if (s.event_id != null && s.event_title) {
        map.set(String(s.event_id), s.event_title);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [ghostStories]);

  const resetCreateActionForm = () => {
    setTargetId('');
    setContentTitle('');
    setContentText('');
    setMediaUrl('');
    setMediaPreview(null);
    setSelectedEventId('');
    setLikeTotalTarget(30);
    setPreferMediaFirstLikes(false);
    setSelectedStoryIdsForLike([]);
    setTargetSearchQuery('');
    setEventSearchQuery('');
  };

  const queueActionTitle = (action: GhostActionQueue) => {
    const meta = action.metadata && typeof action.metadata === 'object' ? action.metadata : {};
    const targetName =
      (meta as { event_title?: string; target_label?: string; story_label?: string; user_name?: string })
        .event_title ||
      (meta as { target_label?: string }).target_label ||
      (meta as { story_label?: string }).story_label ||
      (meta as { user_name?: string }).user_name ||
      (action.target_id != null ? `${action.target_type} #${action.target_id}` : 'target');
    return `${action.action_type} → ${targetName}`;
  };

  const queueActionMeta = (action: GhostActionQueue) => {
    const persona =
      personaGroups.find((g) => g.id === action.persona_group_id)?.name ||
      (action.persona_group_id ? `persona #${action.persona_group_id}` : 'persona');
    const when = action.error_message
      ? action.error_message
      : `scheduled ${format(new Date(action.scheduled_at), 'PPp')}`;
    return `${persona} · ${when}`;
  };

  const queueStatusTone = (
    status: GhostActionQueue['status']
  ): 'success' | 'warning' | 'error' | 'muted' | 'primary' => {
    if (status === 'pending' || status === 'completed') return 'success';
    if (status === 'processing') return 'warning';
    if (status === 'failed') return 'error';
    return 'muted';
  };

  return (
    <div className="space-y-3.5">
      <AdminKpiRow className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <AdminKpiTile
          label="Ghost users"
          value={loading ? '—' : (stats.total_ghost_users ?? 0).toLocaleString()}
          hint="Personas"
        />
        <AdminKpiTile
          label="Queued"
          value={loading ? '—' : (stats.total_queued_actions ?? 0).toLocaleString()}
          hint="Actions"
        />
        <AdminKpiTile
          label="Pending"
          value={loading ? '—' : (stats.pending_actions ?? 0).toLocaleString()}
          hint="Waiting"
        />
        <AdminKpiTile
          label="Completed"
          value={loading ? '—' : (stats.completed_actions ?? 0).toLocaleString()}
          hint="All time"
        />
        <AdminKpiTile
          label="Failed"
          value={loading ? '—' : (stats.failed_actions ?? 0).toLocaleString()}
          hint="Needs retry"
        />
      </AdminKpiRow>

      <Tabs 
        defaultValue="queue" 
        className="space-y-3.5"
        onValueChange={(value) => {
          if (value === 'content' && ghostStories.length === 0 && !loadingStories && !storiesLoadError) {
            void loadGhostStories();
          }
        }}
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {(
            [
              ['queue', 'Action Queue'],
              ['users', 'Ghost Users'],
              ['content', 'Ghost Content'],
              ['create', 'Create Action'],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-full border-0 bg-[hsl(var(--admin-surface))] px-3 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Action Queue Tab — Figma: card with surface rows, outline Delete */}
        <TabsContent value="queue" className="mt-0 space-y-0">
          <div className="rounded-[14px] border border-border bg-card p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-foreground">Queued actions</h2>
              <div className="flex flex-wrap gap-1.5">
                <AdminOutlinePill
                  onClick={async () => {
                    try {
                      const result = await ghostService.resetStuckActions();
                      if (result.reset_count > 0) {
                        loadData();
                      }
                    } catch (error) {
                      console.error('Error resetting stuck actions:', error);
                    }
                  }}
                >
                  Reset Stuck
                </AdminOutlinePill>
                <AdminPrimaryPill onClick={handleProcessActions} disabled={isProcessing}>
                  {isProcessing ? 'Processing…' : 'Process Now'}
                </AdminPrimaryPill>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : queuedActions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No actions in queue</p>
            ) : (
              <div className="space-y-2">
                {queuePaging.pageItems.map((action) => (
                  <AdminListRow
                    key={action.id}
                    title={queueActionTitle(action)}
                    meta={queueActionMeta(action)}
                    trailing={
                      <>
                        <AdminStatusPill tone={queueStatusTone(action.status)}>
                          {action.status}
                        </AdminStatusPill>
                        <AdminOutlinePill onClick={() => handleDeleteAction(action.id)}>
                          Delete
                        </AdminOutlinePill>
                      </>
                    }
                  />
                ))}
                <AdminPagination
                  page={queuePaging.page}
                  totalPages={queuePaging.totalPages}
                  total={queuePaging.total}
                  pageSize={queuePaging.pageSize}
                  onPageChange={queuePaging.setPage}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ghost Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <AdminSectionPanel
            title="Ghost users"
            description={
              statistics && ghostUsers.length !== statistics.total_ghost_users
                ? `Showing ${ghostUsers.length} of ${statistics.total_ghost_users} total`
                : `${ghostUsers.length} accounts`
            }
            action={
              <Select
                value={selectedPersonaGroup === 'all' ? 'all' : selectedPersonaGroup.toString()}
                onValueChange={(value) =>
                  setSelectedPersonaGroup(value === 'all' ? 'all' : parseInt(value))
                }
              >
                <SelectTrigger className="h-9 w-[180px] rounded-full border-border bg-[hsl(var(--admin-surface))] text-xs">
                  <SelectValue placeholder="Persona group" />
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
            }
          >
            {ghostUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No ghost users found</p>
            ) : (
              <div className="space-y-2">
                {usersPaging.pageItems.map((user) => (
                  <Link
                    key={user.id}
                    to={`/users/${user.id}`}
                    className="flex w-full items-center gap-2.5 rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5 transition-colors hover:bg-[hsl(var(--admin-surface-2))]"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {user.full_name || user.username}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        @{user.username} · {user.location || 'No location'}
                      </div>
                    </div>
                    <AdminStatusPill tone="muted">Ghost</AdminStatusPill>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                <AdminPagination
                  page={usersPaging.page}
                  totalPages={usersPaging.totalPages}
                  total={usersPaging.total}
                  pageSize={usersPaging.pageSize}
                  onPageChange={usersPaging.setPage}
                />
              </div>
            )}
          </AdminSectionPanel>
        </TabsContent>

        {/* Ghost Content Tab — Figma 465:2 */}
        <TabsContent value="content" className="mt-0 space-y-0">
          <div className="rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Ghost content</h2>
                <p className="text-xs text-muted-foreground">
                  Stories created by ghost accounts · edit or remove
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={contentEventFilter}
                  onChange={(e) => setContentEventFilter(e.target.value)}
                  className="h-10 rounded-[10px] border border-border bg-background px-3 text-[13px] font-semibold text-foreground"
                >
                  <option value="all">All events</option>
                  {contentEventOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-10 w-[160px] rounded-[10px] border-border bg-background text-[13px]"
                />
                <AdminOutlinePill
                  onClick={() => void loadGhostStories()}
                  disabled={loadingStories}
                  className="rounded-[10px]"
                >
                  {loadingStories ? 'Loading…' : 'Refresh'}
                </AdminOutlinePill>
              </div>
            </div>

            {loadingStories ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : storiesLoadError ? (
              <div className="py-8 text-center text-sm text-destructive">
                <p className="mb-2">{storiesLoadError}</p>
                <p className="text-muted-foreground">Click Refresh to try again.</p>
              </div>
            ) : filteredGhostStories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No ghost stories found.
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_72px_140px] gap-3 rounded-lg bg-[hsl(var(--admin-surface-2))] px-3 py-2 text-[11px] font-semibold text-muted-foreground md:grid">
                  <span>Story</span>
                  <span>Event</span>
                  <span>Engagement</span>
                  <span>Posted</span>
                  <span className="text-right">Actions</span>
                </div>
                {storiesPaging.pageItems.map((story) => (
                  <div
                    key={story.id}
                    className="grid grid-cols-1 items-center gap-3 rounded-[10px] border border-border p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_72px_140px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-[hsl(var(--admin-surface-2))]">
                        {story.media_url ? (
                          story.media_type === 'video' ? (
                            <video src={story.media_url} className="size-full object-cover" muted />
                          ) : (
                            <img
                              src={story.media_url}
                              alt=""
                              className="size-full object-cover"
                            />
                          )
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          @{story.user_name || 'ghost'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Story · ghost persona</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {story.event_title || '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Event</p>
                    </div>
                    <p className="whitespace-pre text-xs text-muted-foreground">
                      ♥ {story.likes_count}  💬 {story.comments_count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(story.created_at), 'MMM d')}
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-[10px] border border-border px-3.5 py-2.5 text-[13px] font-semibold text-foreground hover:bg-[hsl(var(--admin-surface-2))]"
                        onClick={() => {
                          setEditingStory(story);
                          setEditContent(story.content);
                          setEditCaption(story.caption);
                          setEditMediaUrl(story.media_url || '');
                          setEditMediaType(story.media_type);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingStoryId === story.id}
                        className="rounded-[10px] bg-[hsl(var(--admin-error))] px-3.5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                        onClick={() => setStoryToDelete(story)}
                      >
                        {deletingStoryId === story.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                <AdminPagination
                  page={storiesPaging.page}
                  totalPages={storiesPaging.totalPages}
                  total={storiesPaging.total}
                  pageSize={storiesPaging.pageSize}
                  onPageChange={storiesPaging.setPage}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Action Tab — Figma 465:296 */}
        <TabsContent value="create" className="mt-0">
          <div className="flex w-full justify-center">
            <div className="w-full max-w-[640px] rounded-2xl border border-border bg-[hsl(var(--admin-surface))] px-7 py-6">
              <h2 className="text-xl font-bold text-foreground">Create ghost action</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Pick an action type, choose a target, and select which personas should run it.
              </p>

              <p className="mb-2 mt-4 text-xs font-semibold text-foreground">Action type</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(
                  [
                    ['like_story', 'Like story'],
                    ['create_story', 'Create story'],
                    ['follow_user', 'Follow user'],
                  ] as const
                ).map(([value, label]) => {
                  const active = actionType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setActionType(value);
                        resetCreateActionForm();
                      }}
                      className={cn(
                        'rounded-[10px] px-3.5 py-2.5 text-[13px] transition-colors',
                        active
                          ? 'border-[1.5px] border-primary bg-primary/15 font-semibold text-primary'
                          : 'border border-border bg-[hsl(var(--admin-surface-2))] font-medium text-muted-foreground',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {needsTargetId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {getTargetTypeForAction() === 'event' ? 'Target event' : 'Target user'}
                    </Label>
                    <Input
                      placeholder={
                        getTargetTypeForAction() === 'event'
                          ? 'Search events by title, location…'
                          : 'Search users by name or username…'
                      }
                      value={targetSearchQuery}
                      onChange={(e) => setTargetSearchQuery(e.target.value)}
                      className="h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]"
                    />
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger className="h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]">
                        <SelectValue placeholder="Select target…" />
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
                                {targetSearchQuery ? 'No users found' : 'Start typing to search users…'}
                              </div>
                            ) : (
                              filteredUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name || user.username || 'Unknown User'}{' '}
                                  {user.username && `(@${user.username})`}
                                </SelectItem>
                              ))
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionType === 'like_story' && targetId && (
                  <div className="space-y-3 rounded-[10px] border border-border bg-[hsl(var(--admin-surface-2))] p-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="like-total" className="text-xs font-semibold">
                        Max personas / total likes
                      </Label>
                      <Input
                        id="like-total"
                        type="number"
                        min={1}
                        max={100000}
                        value={likeTotalTarget}
                        onChange={(e) => setLikeTotalTarget(parseInt(e.target.value, 10) || 1)}
                        className="h-11 rounded-[10px] border-border bg-background text-[13px]"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prefer-media-likes"
                        checked={preferMediaFirstLikes}
                        onCheckedChange={(v) => setPreferMediaFirstLikes(v === true)}
                      />
                      <label htmlFor="prefer-media-likes" className="cursor-pointer text-sm">
                        Prioritize stories with photo/video
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs font-semibold">Stories to include (optional)</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedStoryIdsForLike(storiesInSelectedLikeEvent.map((s) => s.id))
                            }
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
                      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                        {storiesInSelectedLikeEvent.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No stories for this event</p>
                        ) : (
                          storiesInSelectedLikeEvent.map((s) => (
                            <label key={s.id} className="flex cursor-pointer items-center gap-2 text-xs">
                              <Checkbox
                                checked={selectedStoryIdsForLike.includes(s.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedStoryIdsForLike((prev) =>
                                    checked === true
                                      ? [...prev, s.id]
                                      : prev.filter((id) => id !== s.id),
                                  );
                                }}
                              />
                              <span className="truncate">{s.caption || s.content || `Story #${s.id}`}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {actionType === 'create_story' && (
                  <div className="space-y-3 rounded-[10px] border border-border bg-[hsl(var(--admin-surface-2))] p-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold">Content (optional)</Label>
                        <AdminAiWriteButton
                          label="Write with AI"
                          run={() =>
                            draftGhostStoryCaption({
                              hint: contentTitle || contentText || undefined,
                              eventTitle: events.find((e) => String(e.id) === selectedEventId)?.title,
                              existing: contentText,
                            })
                          }
                          onResult={setContentText}
                        />
                      </div>
                      <Textarea
                        placeholder="Enter content… or Write with AI"
                        value={contentText}
                        onChange={(e) => setContentText(e.target.value)}
                        rows={3}
                        className="rounded-[10px] border-border bg-background text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Link to event (optional)</Label>
                      <Input
                        placeholder="Search events by title, location…"
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="h-11 rounded-[10px] border-border bg-background text-[13px]"
                      />
                      {eventSearchQuery ? (
                        <div className="max-h-40 overflow-y-auto rounded-[10px] border border-border bg-background">
                          {filteredEventsForStory.length === 0 ? (
                            <p className="p-3 text-xs text-muted-foreground">No events found</p>
                          ) : (
                            filteredEventsForStory.map((event) => (
                              <button
                                key={event.id}
                                type="button"
                                className={cn(
                                  'block w-full px-3 py-2 text-left text-sm hover:bg-[hsl(var(--admin-surface-2))]',
                                  selectedEventId === event.id.toString() && 'bg-[hsl(var(--admin-surface-2))]',
                                )}
                                onClick={() => {
                                  setSelectedEventId(event.id.toString());
                                  setEventSearchQuery('');
                                }}
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(event.date), 'MMM d, yyyy')} • {event.location}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                      {selectedEventId ? (
                        <p className="text-xs text-muted-foreground">
                          Selected event #{selectedEventId}{' '}
                          <button
                            type="button"
                            className="text-primary"
                            onClick={() => setSelectedEventId('')}
                          >
                            Clear
                          </button>
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Media (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Media URL"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          className="h-11 flex-1 rounded-[10px] border-border bg-background text-[13px]"
                        />
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
                          className="rounded-[10px]"
                          onClick={() => document.getElementById('media-upload')?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                      </div>
                      {mediaPreview ? (
                        <img src={mediaPreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Persona group</Label>
                  <Select
                    value={
                      selectedPersonaForAction === 'all'
                        ? 'all'
                        : selectedPersonaForAction === 'random'
                          ? 'random'
                          : selectedPersonaForAction.toString()
                    }
                    onValueChange={(value) => {
                      if (value === 'all') setSelectedPersonaForAction('all');
                      else if (value === 'random') setSelectedPersonaForAction('random');
                      else setSelectedPersonaForAction(parseInt(value, 10));
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ghost users</SelectItem>
                      <SelectItem value="random">One random user</SelectItem>
                      {personaGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Run at</Label>
                    <Input
                      value="Immediately"
                      readOnly
                      className="h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max personas</Label>
                    <Input
                      type="number"
                      min={1}
                      value={likeTotalTarget}
                      onChange={(e) => setLikeTotalTarget(parseInt(e.target.value, 10) || 1)}
                      className="h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]"
                      disabled={actionType !== 'like_story'}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={resetCreateActionForm}
                    className="rounded-[10px] border border-border px-3.5 py-2.5 text-[13px] font-semibold text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateAction()}
                    className="rounded-[10px] bg-primary px-3.5 py-2.5 text-[13px] font-bold text-primary-foreground"
                  >
                    + Queue action
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <AdminAiWriteButton
                  label="Write with AI"
                  run={() =>
                    draftGhostStoryCaption({
                      existing: editCaption || editContent,
                      hint: editingStory?.event_id
                        ? events.find((e) => e.id === editingStory.event_id)?.title
                        : undefined,
                    })
                  }
                  onResult={setEditCaption}
                />
              </div>
              <Input
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Story caption..."
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="edit-content">Content</Label>
                <AdminAiWriteButton
                  label="Write with AI"
                  run={() =>
                    draftGhostStoryCaption({
                      existing: editContent || editCaption,
                      hint: 'Slightly longer story body for a ghost post',
                    })
                  }
                  onResult={setEditContent}
                />
              </div>
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
