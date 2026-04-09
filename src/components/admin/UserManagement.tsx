import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Filter, 
  Download, 
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminUser, type ProfileAccountStatus } from '@/lib/admin-service';
import { runAdminInsightsAnalysis } from '@/lib/admin-ai-analysis';
import { toDisplayParagraphs } from '@/lib/ai-plain-text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [roleFilter, setRoleFilter] = useState<'all' | 'attendee' | 'organizer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [emailDebugInfo, setEmailDebugInfo] = useState<string | null>(null);
  const [accountActionOpen, setAccountActionOpen] = useState(false);
  const [accountActionKind, setAccountActionKind] = useState<'suspend' | 'ban' | 'delete' | null>(null);
  const [accountActionUserId, setAccountActionUserId] = useState<string | null>(null);
  const [accountActionReason, setAccountActionReason] = useState('');

  // Fetch user stats
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users with pagination
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users', page, pageSize, searchQuery, roleFilter, statusFilter, activeTab],
    queryFn: () => {
      const role = activeTab === 'all' ? roleFilter : 
                   activeTab === 'attendees' ? 'attendee' :
                   activeTab === 'organizers' ? 'organizer' : 
                   activeTab === 'inactive' ? 'all' : 'all';
      
      const status = activeTab === 'inactive' ? 'inactive' : statusFilter;
      
      return adminService.getUsers({
        page,
        pageSize,
        search: searchQuery,
        role,
        status,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    },
    keepPreviousData: true,
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'attendee' | 'organizer' | 'admin' }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User role updated');
    },
    onError: (error: any) => {
      console.error('Failed to update user role:', error);
      toast.error(error?.message || 'Failed to update user role');
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User suspended');
    },
    onError: (error: any) => {
      console.error('Failed to suspend user:', error);
      toast.error(error?.message || 'Failed to suspend user');
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Access revoked');
    },
    onError: (error: any) => {
      console.error('Failed to ban user:', error);
      toast.error(error?.message || 'Failed to revoke access');
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.restoreUserAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Account restored to active');
    },
    onError: (error: any) => {
      console.error('Failed to restore user:', error);
      toast.error(error?.message || 'Failed to restore account');
    },
  });

  const softDeleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.softDeleteUserAccount(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Account removed and profile anonymized');
    },
    onError: (error: any) => {
      console.error('Failed to remove account:', error);
      toast.error(error?.message || 'Failed to remove account');
    },
  });

  const closeAccountActionDialog = () => {
    setAccountActionOpen(false);
    setAccountActionKind(null);
    setAccountActionUserId(null);
    setAccountActionReason('');
  };

  const openAccountAction = (userId: string, kind: 'suspend' | 'ban' | 'delete') => {
    setAccountActionUserId(userId);
    setAccountActionKind(kind);
    setAccountActionReason('');
    setAccountActionOpen(true);
  };

  const submitAccountAction = () => {
    if (!accountActionUserId || !accountActionKind) return;
    const reason = accountActionReason.trim() || undefined;
    const onDone = {
      onSuccess: () => closeAccountActionDialog(),
    };
    if (accountActionKind === 'suspend') {
      suspendUserMutation.mutate({ userId: accountActionUserId, reason }, onDone);
    } else if (accountActionKind === 'ban') {
      banUserMutation.mutate({ userId: accountActionUserId, reason }, onDone);
    } else {
      softDeleteUserMutation.mutate({ userId: accountActionUserId, reason }, onDone);
    }
  };

  const accountStatusLabel = (u: AdminUser): string => {
    const raw = u.account_status as ProfileAccountStatus | undefined;
    if (raw === 'suspended') return 'Suspended';
    if (raw === 'banned') return 'Revoked';
    if (raw === 'deleted') return 'Removed';
    return 'Active';
  };

  // Bulk update roles mutation
  const bulkUpdateRolesMutation = useMutation({
    mutationFn: ({ userIds, role }: { userIds: string[]; role: 'attendee' | 'organizer' | 'admin' }) =>
      adminService.bulkUpdateUserRoles(userIds, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      setSelectedUsers([]);
      toast.success('User roles updated');
    },
    onError: (error: any) => {
      console.error('Failed to bulk update roles:', error);
      toast.error(error?.message || 'Failed to update user roles');
    },
  });

  const activeUsersGlobalPercentage =
    userStats && userStats.total_users > 0
      ? Math.round((userStats.active_users / userStats.total_users) * 100)
      : 0;

  const listHasFilters =
    Boolean(searchQuery.trim()) ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    activeTab !== 'all';

  // Role distribution from aggregate stats (not current page — avoids capping at pageSize)
  const userRoleData = useMemo(() => {
    if (!userStats) return [];
    return [
      { name: 'Attendees', value: userStats.attendees },
      { name: 'Organizers', value: userStats.organizers },
      { name: 'Admins', value: userStats.admins },
    ].filter((item) => item.value > 0);
  }, [userStats]);

  // Export to CSV
  const handleExport = async () => {
    try {
      if (!usersData?.data) return;
      
      const csv = await adminService.exportUsersToCSV(usersData.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  // AI Analysis
  const runAIAnalysis = async () => {
    if (!userStats) {
      toast.error('Statistics are still loading. Wait a moment, then try again.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const text = await runAdminInsightsAnalysis(
        `Analyze this user data and provide insights (growth trends, engagement patterns, retention opportunities):
- Total users: ${userStats.total_users}
- New users this month: ${userStats.new_users_this_month}
- Attendees: ${userStats.attendees}
- Organizers: ${userStats.organizers}
- Admins: ${userStats.admins}
- Active users in last 30 days: ${userStats.active_users}
- Average events attended per user: ${userStats.average_events_per_user}

Keep the analysis concise (3-4 bullet points) and actionable for an event platform admin.`
      );
      setAnalysisResult(text);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error running AI analysis:', error);
      const msg =
        error instanceof Error ? error.message : 'Failed to complete analysis';
      toast.error(msg);
      setAnalysisResult(
        `Could not generate insights.\n\n${msg}\n\nTips: use npm run dev locally (with VERCEL_AI_API_KEY in .env), or deploy to Vercel with that env var. Static preview (vite preview) has no /api/ai route.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'attendee' | 'organizer' | 'admin') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  // Test email RPC on mount to help debug email issues
  useEffect(() => {
    const testEmailRPC = async () => {
      try {
        const result = await adminService.testEmailRPC();
        if (!result.success) {
          setEmailDebugInfo(`Email RPC Issue: ${result.message}`);
          console.error('Email RPC Test Failed:', result);
        } else {
          setEmailDebugInfo(null);
          console.log('Email RPC Test Passed:', result);
        }
      } catch (error) {
        console.error('Error testing email RPC:', error);
        setEmailDebugInfo('Error testing email RPC - check console');
      }
    };
    testEmailRPC();
  }, []);

  // Real-time updates for users
  useEffect(() => {
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="attendees" className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            Attendees
          </TabsTrigger>
          <TabsTrigger value="organizers" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            Organizers
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-1">
            <UserX className="h-4 w-4" />
            Inactive
          </TabsTrigger>
        </TabsList>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleExport}
            disabled={!usersData?.data || usersData.data.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={async () => {
              if (!usersData?.data) return;
              try {
                await adminService.exportUsersToPDF(usersData.data);
                toast.success('PDF exported successfully');
              } catch (error) {
                console.error('Error exporting PDF:', error);
                toast.error('Failed to export PDF');
              }
            }}
            disabled={!usersData?.data || usersData.data.length === 0}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      
      {/* Email Debug Info */}
      {emailDebugInfo && (
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-semibold text-orange-800 dark:text-orange-200">Email Fetching Issue Detected</p>
                <p className="text-orange-700 dark:text-orange-300 mt-1">{emailDebugInfo}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Check browser console for detailed error logs. Emails should exist if users verified their email during signup.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await adminService.testEmailRPC();
                  if (result.success) {
                    setEmailDebugInfo(null);
                    toast.success('Email RPC is now working!');
                    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                  } else {
                    setEmailDebugInfo(`Email RPC Issue: ${result.message}`);
                    toast.error(`Email RPC still failing: ${result.message}`);
                  }
                }}
              >
                Retry Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users by name, email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(value: any) => {
          setRoleFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="attendee">Attendees</SelectItem>
            <SelectItem value="organizer">Organizers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value: any) => {
          setStatusFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Not active (suspended / revoked / removed)</SelectItem>
            <SelectItem value="suspended">Suspended only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <TabsContent value={activeTab} className="space-y-4">
        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Registered users</CardTitle>
              <CardDescription>
                {activeTab === 'all' ? 'All profiles (real + ghost)' :
                 activeTab === 'attendees' ? 'Real-user attendees (below); totals are platform-wide' :
                 activeTab === 'organizers' ? 'Real-user organizers (below); totals are platform-wide' :
                 'Inactive real users (below); totals are platform-wide'}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{userStats?.total_registered_profiles ?? 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{userStats?.total_users ?? 0}</span>
                  {' '}real
                  <span className="mx-1.5 text-muted-foreground/70">·</span>
                  <span className="font-medium text-foreground">{userStats?.ghost_users ?? 0}</span>
                  {' '}ghost
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  +{userStats?.new_users_this_month ?? 0} new real users this month
                  {listHasFilters && (
                    <>
                      {' · '}
                      {usersData?.total ?? 0} match current table filters
                    </>
                  )}
                </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Last 30 days (non-ghost)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{userStats?.active_users ?? 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {userStats?.total_users
                    ? `${activeUsersGlobalPercentage}% of total`
                    : '0% of total'}
                </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Average Events</CardTitle>
              <CardDescription>Per user</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{userStats?.average_events_per_user || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">Events per user</p>
            </CardContent>
          </Card>
        </div>
        )}
        
        {/* Charts */}
        {userRoleData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>
                {activeTab === 'all' ? 'Real users only (ghost accounts excluded)' :
                 activeTab === 'attendees' ? 'Real-user roles (ghost excluded)' :
                 activeTab === 'organizers' ? 'Real-user roles (ghost excluded)' :
                 'Real-user roles (ghost excluded)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        )}
        
        {/* AI Analysis Card */}
        <Card className="border-kenya-orange/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-kenya-orange" />
                AI User Insights
              </CardTitle>
              <CardDescription>AI-powered analysis of user trends and engagement</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAIAnalysis}
              disabled={isAnalyzing || !userStats}
              className="border-kenya-orange/50 text-kenya-orange hover:bg-kenya-orange/10"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {toDisplayParagraphs(analysisResult).map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-kenya-orange mb-2" />
                    <p>Analyzing user data...</p>
                  </div>
                ) : (
                  <p>Click "Run Analysis" to generate AI-powered insights about your user base.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {selectedUsers.length} user(s) selected
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkUpdateRolesMutation.mutate({ userIds: selectedUsers, role: 'attendee' })}
                        disabled={bulkUpdateRolesMutation.isPending}
                      >
                        Set as Attendees
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkUpdateRolesMutation.mutate({ userIds: selectedUsers, role: 'organizer' })}
                        disabled={bulkUpdateRolesMutation.isPending}
                      >
                        Set as Organizers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
        {isLoadingUsers ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-kenya-orange" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
        <Table>
              <TableCaption>
                Showing {usersData?.data.length || 0} of {usersData?.total || 0} users
              </TableCaption>
          <TableHeader>
            <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === usersData?.data.length && usersData.data.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(usersData?.data.map(u => u.id) || []);
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {usersData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersData?.data.map((user) => (
              <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </TableCell>
                <TableCell className="font-medium">
                  <Link 
                    to={`/users/${user.id}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold hover:underline">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email ? (
                                <span>{user.email}</span>
                              ) : (
                                <span className="italic text-orange-500">No email (check console for details)</span>
                              )}
                            </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                        <Badge variant={user.role === 'organizer' ? 'outline' : user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.account_status === 'active' || !user.account_status ? 'default' : 'destructive'
                    }
                  >
                    {accountStatusLabel(user)}
                  </Badge>
                </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                <TableCell>
                  {user.role === 'attendee' 
                          ? `${user.events_attended || 0} events attended` 
                          : `${user.events_created || 0} events created`}
                </TableCell>
                <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                  </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingUser(user)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'attendee')}>
                              Set as Attendee
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'organizer')}>
                              Set as Organizer
                            </DropdownMenuItem>
                            {user.role !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                Set as Admin
                              </DropdownMenuItem>
                            )}
                            {user.role !== 'admin' &&
                              user.account_status !== 'active' &&
                              user.account_status !== 'deleted' && (
                                <DropdownMenuItem
                                  onClick={() => restoreUserMutation.mutate(user.id)}
                                  disabled={restoreUserMutation.isPending}
                                >
                                  Restore account (active)
                                </DropdownMenuItem>
                              )}
                            {user.role !== 'admin' && user.account_status === 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => openAccountAction(user.id, 'suspend')}>
                                  Suspend account…
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAccountAction(user.id, 'ban')}>
                                  Revoke access (ban)…
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openAccountAction(user.id, 'delete')}
                                  className="text-destructive"
                                >
                                  Remove account…
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                </TableCell>
              </TableRow>
                  ))
                )}
          </TableBody>
        </Table>

            {/* Pagination */}
            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {usersData.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(usersData.totalPages, p + 1))}
                    disabled={page === usersData.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* User Details Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 pb-4 border-b">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewingUser.profile_picture} alt={viewingUser.name} />
                  <AvatarFallback className="text-2xl">{viewingUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{viewingUser.name}</h3>
                  {viewingUser.username && (
                    <p className="text-muted-foreground">@{viewingUser.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={viewingUser.role === 'organizer' ? 'outline' : viewingUser.role === 'admin' ? 'default' : 'secondary'}>
                      {viewingUser.role}
                    </Badge>
                    <Badge
                      variant={
                        viewingUser.account_status === 'active' || !viewingUser.account_status
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {accountStatusLabel(viewingUser)}
                    </Badge>
                  </div>
                  {viewingUser.account_status_reason ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Reason: {viewingUser.account_status_reason}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{viewingUser.email || <span className="text-muted-foreground italic">No email available</span>}</p>
                  </div>
                  {viewingUser.location && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{viewingUser.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {viewingUser.bio && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Bio</h4>
                  <p className="text-muted-foreground">{viewingUser.bio}</p>
                </div>
              )}

              {/* Activity Statistics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Activity Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Events Attended</p>
                    <p className="text-2xl font-bold">{viewingUser.events_attended || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Events Created</p>
                    <p className="text-2xl font-bold">{viewingUser.events_created || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Followers</p>
                    <p className="text-2xl font-bold">{viewingUser.followers_count || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Following</p>
                    <p className="text-2xl font-bold">{viewingUser.following_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-lg">Account Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">User ID</p>
                    <p className="font-mono text-xs break-all">{viewingUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Joined</p>
                    <p className="font-medium">{new Date(viewingUser.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={accountActionOpen} onOpenChange={(open) => !open && closeAccountActionDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accountActionKind === 'suspend' && 'Suspend account'}
              {accountActionKind === 'ban' && 'Revoke access (ban)'}
              {accountActionKind === 'delete' && 'Remove account'}
            </DialogTitle>
            <DialogDescription>
              {accountActionKind === 'suspend' &&
                'User cannot post, buy tickets, or edit their profile until restored. They can be reinstated later.'}
              {accountActionKind === 'ban' &&
                'Permanent policy action: same lock as suspend. Use for malicious abuse after investigation.'}
              {accountActionKind === 'delete' &&
                'Soft-delete: profile is anonymized and hidden from normal use. The auth record may still exist—delete the user in Supabase Auth if you need full removal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium" htmlFor="account-action-reason">
              Internal note (optional)
            </label>
            <Textarea
              id="account-action-reason"
              placeholder="e.g. Reported spam, terms violation reference…"
              value={accountActionReason}
              onChange={(e) => setAccountActionReason(e.target.value)}
              className="min-h-[88px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeAccountActionDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={accountActionKind === 'delete' ? 'destructive' : 'default'}
              disabled={
                suspendUserMutation.isPending ||
                banUserMutation.isPending ||
                softDeleteUserMutation.isPending
              }
              onClick={submitAccountAction}
            >
              {(suspendUserMutation.isPending ||
                banUserMutation.isPending ||
                softDeleteUserMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default UserManagement;
