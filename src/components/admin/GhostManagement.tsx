import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { ghostService, type GhostActionQueue, type GhostPersonaGroup, type GhostUser } from '@/lib/ghost-service';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GhostManagement: React.FC = () => {
  const [ghostUsers, setGhostUsers] = useState<GhostUser[]>([]);
  const [personaGroups, setPersonaGroups] = useState<GhostPersonaGroup[]>([]);
  const [queuedActions, setQueuedActions] = useState<GhostActionQueue[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersonaGroup, setSelectedPersonaGroup] = useState<number | 'all'>('all');
  
  // Action creation form state
  const [actionType, setActionType] = useState<GhostActionQueue['action_type']>('like_story');
  const [targetType, setTargetType] = useState<GhostActionQueue['target_type']>('story');
  const [targetId, setTargetId] = useState<string>('');
  const [selectedPersonaForAction, setSelectedPersonaForAction] = useState<number | 'all'>('all');
  const [actionMetadata, setActionMetadata] = useState<string>('');

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

  const handleCreateAction = async () => {
    if (!targetId && actionType !== 'create_story' && actionType !== 'create_post') {
      toast.error('Please enter a target ID');
      return;
    }

    try {
      const metadata = actionMetadata ? JSON.parse(actionMetadata) : {};
      
      const params = {
        action_type: actionType,
        target_type: targetType,
        target_id: targetId ? parseInt(targetId) : undefined,
        persona_group_id: selectedPersonaForAction === 'all' ? undefined : selectedPersonaForAction as number,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      const result = await ghostService.createGhostAction(params);
      if (result) {
        // Reset form
        setTargetId('');
        setActionMetadata('');
        // Reload actions
        loadData();
      }
    } catch (error: any) {
      if (error.message?.includes('JSON')) {
        toast.error('Invalid JSON in metadata field');
      }
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
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      cancelled: { variant: 'outline', icon: X }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
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
              <CardTitle>Queued Actions</CardTitle>
              <CardDescription>
                Monitor and manage queued ghost actions
              </CardDescription>
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
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{action.action_type}</span>
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
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => setActionType(value as GhostActionQueue['action_type'])}
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

              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select
                  value={targetType}
                  onValueChange={(value) => setTargetType(value as GhostActionQueue['target_type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="forum_post">Forum Post</SelectItem>
                    <SelectItem value="community_post">Community Post</SelectItem>
                    <SelectItem value="event">Event (for stories/posts)</SelectItem>
                    <SelectItem value="user">User (for follows)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(actionType !== 'create_story' && actionType !== 'create_post' && actionType !== 'create_community_post') && (
                <div className="space-y-2">
                  <Label>Target ID</Label>
                  <Input
                    type="number"
                    placeholder="Enter target ID (e.g., story ID, post ID)"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                  />
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

              {(actionType === 'create_story' || actionType === 'create_post' || actionType === 'create_community_post') && (
                <div className="space-y-2">
                  <Label>Content Metadata (JSON)</Label>
                  <Textarea
                    placeholder='{"content": "Story content here", "media_url": "optional"}'
                    value={actionMetadata}
                    onChange={(e) => setActionMetadata(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    For content creation actions, include content, title (for posts), category (for community posts), and optional media_url
                  </p>
                </div>
              )}

              <Button onClick={handleCreateAction} className="w-full">
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
