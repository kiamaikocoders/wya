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
import { adminService, AdminUser } from '@/lib/admin-service';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminService.suspendUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Bulk update roles mutation
  const bulkUpdateRolesMutation = useMutation({
    mutationFn: ({ userIds, role }: { userIds: string[]; role: 'attendee' | 'organizer' | 'admin' }) =>
      adminService.bulkUpdateUserRoles(userIds, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      setSelectedUsers([]);
    },
  });

  // Calculate filtered stats based on active tab
  const filteredStats = useMemo(() => {
    if (!usersData?.data || !userStats) return null;
    
    const filtered = usersData.data;
    const total = filtered.length;
    const active = filtered.filter(u => u.status === 'active').length;
    
    // Calculate role distribution from filtered data
    const attendees = filtered.filter(u => u.role === 'attendee').length;
    const organizers = filtered.filter(u => u.role === 'organizer').length;
    const admins = filtered.filter(u => u.role === 'admin').length;
    
    return {
      total,
      active,
      attendees,
      organizers,
      admins,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }, [usersData, userStats]);

  // Chart data from filtered stats
  const userRoleData = useMemo(() => {
    if (!filteredStats) return [];
    return [
      { name: 'Attendees', value: filteredStats.attendees },
      { name: 'Organizers', value: filteredStats.organizers },
      { name: 'Admins', value: filteredStats.admins },
    ].filter(item => item.value > 0);
  }, [filteredStats]);

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
    if (!userStats) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY || 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this user data and provide insights (growth trends, engagement patterns, retention opportunities):
                - Total users: ${userStats.total_users}
                - New users this month: ${userStats.new_users_this_month}
                - Attendees: ${userStats.attendees}
                - Organizers: ${userStats.organizers}
                - Admins: ${userStats.admins}
                - Active users in last 30 days: ${userStats.active_users}
                - Average events attended per user: ${userStats.average_events_per_user}
                
                Keep the analysis concise (3-4 bullet points) and actionable for an event platform admin.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      setAnalysisResult(data.candidates[0].content.parts[0].text);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast.error('Failed to complete analysis');
      setAnalysisResult('Failed to generate analysis. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'attendee' | 'organizer' | 'admin') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleSuspend = (userId: string) => {
    if (confirm('Are you sure you want to suspend this user?')) {
      suspendUserMutation.mutate({ userId });
    }
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
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
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
              <CardTitle>Total Users</CardTitle>
              <CardDescription>
                {activeTab === 'all' ? 'All registered users' :
                 activeTab === 'attendees' ? 'Total attendees' :
                 activeTab === 'organizers' ? 'Total organizers' :
                 'Inactive users'}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{filteredStats?.total || usersData?.total || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === 'all' && `+${userStats?.new_users_this_month || 0} this month`}
                  {activeTab !== 'all' && `${filteredStats?.total || 0} ${activeTab}`}
                </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{filteredStats?.active || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredStats?.total 
                    ? `${filteredStats.activePercentage}% of total`
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
                {activeTab === 'all' ? 'Distribution of all users' :
                 activeTab === 'attendees' ? 'Attendee distribution' :
                 activeTab === 'organizers' ? 'Organizer distribution' :
                 'Inactive user distribution'}
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
              <div className="bg-muted p-4 rounded-lg">
                <div className="prose dark:prose-invert">
                  {analysisResult.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
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
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
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
                            <DropdownMenuItem 
                              onClick={() => handleSuspend(user.id)}
                              className="text-destructive"
                            >
                              Suspend User
                            </DropdownMenuItem>
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
                    <Badge variant={viewingUser.status === 'active' ? 'default' : 'destructive'}>
                      {viewingUser.status}
                    </Badge>
                  </div>
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
    </Tabs>
  );
};

export default UserManagement;
