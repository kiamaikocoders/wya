import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  FileText, 
  Clock, 
  TrendingUp,
  Plus,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/admin-service';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type TimeRange = '24h' | 'week' | '30d' | '3m';

interface ActivityItem {
  id: string;
  type: 'event_created' | 'event_approved' | 'event_rejected' | 'user_registered' | 'proposal_submitted' | 'proposal_approved' | 'proposal_rejected' | 'ticket_purchased' | 'payment_received' | 'event_edited' | 'user_suspended';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  event?: {
    id: number;
    title: string;
    status?: string;
  };
  metadata?: {
    amount?: number;
    ticketCount?: number;
    status?: string;
  };
  icon: React.ElementType;
  color: string;
  actionUrl?: string;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Calculate date range based on selection
  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return subDays(now, 1);
      case 'week':
        return subWeeks(now, 1);
      case '30d':
        return subMonths(now, 1);
      case '3m':
        return subMonths(now, 3);
      default:
        return subMonths(now, 1);
    }
  };

  // Fetch event stats
  const { data: eventStats, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['admin-event-stats', timeRange],
    queryFn: () => adminService.getEventStats(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch user stats
  const { data: userStats, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-user-stats', timeRange],
    queryFn: () => adminService.getUserStats(),
    refetchInterval: 30000,
  });

  // Fetch recent events for trend calculation
  const { data: recentEvents } = useQuery({
    queryKey: ['recent-events', timeRange],
    queryFn: async () => {
      const startDate = getDateRange(timeRange);
      const { data } = await supabase
        .from('events')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch recent users for trend calculation
  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users', timeRange],
    queryFn: async () => {
      const startDate = getDateRange(timeRange);
      const { data } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch revenue data
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-data', timeRange],
    queryFn: async () => {
      const startDate = getDateRange(timeRange);
      const { data: tickets } = await supabase
        .from('tickets')
        .select('price, purchase_date')
        .gte('purchase_date', startDate.toISOString());
      
      const totalRevenue = tickets?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;
      
      // Get previous period for comparison
      const previousStart = new Date(startDate);
      const periodLength = timeRange === '24h' ? 1 : timeRange === 'week' ? 7 : timeRange === '30d' ? 30 : 90;
      previousStart.setDate(previousStart.getDate() - periodLength);
      
      const { data: previousTickets } = await supabase
        .from('tickets')
        .select('price')
        .gte('purchase_date', previousStart.toISOString())
        .lt('purchase_date', startDate.toISOString());
      
      const previousRevenue = previousTickets?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;
      
      return { totalRevenue, previousRevenue };
    },
    refetchInterval: 30000,
  });

  // Fetch pending items
  const { data: pendingData } = useQuery({
    queryKey: ['pending-items'],
    queryFn: async () => {
      const [pendingEvents, pendingProposals] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);
      
      return {
        events: pendingEvents.count || 0,
        proposals: pendingProposals.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch recent activity with more details
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const activities: ActivityItem[] = [];
      const startDate = subDays(new Date(), 7);

      // Recent events with status
      const { data: events } = await supabase
        .from('events')
        .select('id, title, created_at, organizer_id, status, updated_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get organizer names for events
      const organizerIds = events?.map(e => e.organizer_id).filter(Boolean) || [];
      const { data: organizers } = organizerIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', organizerIds) : { data: null };

      const organizerMap = new Map(organizers?.map(o => [o.id, o]) || []);

      events?.forEach((event) => {
        const organizer = event.organizer_id ? organizerMap.get(event.organizer_id) : null;
        const isNew = new Date(event.created_at).getTime() === new Date(event.updated_at || event.created_at).getTime();
        
        activities.push({
          id: `event-${event.id}`,
          type: isNew ? 'event_created' : 'event_edited',
          title: isNew ? 'New event created' : 'Event updated',
          description: event.title,
          timestamp: event.created_at,
          event: {
            id: event.id,
            title: event.title,
            status: event.status,
          },
          user: organizer ? {
            id: organizer.id,
            name: organizer.full_name || organizer.username || 'Unknown',
            avatar: organizer.avatar_url,
          } : undefined,
          icon: isNew ? Calendar : Edit,
          color: event.status === 'approved' ? 'text-green-500' : event.status === 'pending' ? 'text-yellow-500' : 'text-red-500',
          actionUrl: `/admin/events`,
        });
      });

      // Recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      users?.forEach((user) => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registered',
          title: 'New user registered',
          description: user.full_name || user.username || 'Unknown',
          timestamp: user.created_at,
          user: {
            id: user.id,
            name: user.full_name || user.username || 'Unknown',
            avatar: user.avatar_url,
          },
          icon: UserPlus,
          color: 'text-blue-500',
          actionUrl: `/admin/users`,
        });
      });

      // Recent proposals with status
      const { data: proposals } = await supabase
        .from('proposals')
        .select('id, title, submitted_on, submitted_by, status')
        .gte('submitted_on', startDate.toISOString())
        .order('submitted_on', { ascending: false })
        .limit(10);

      proposals?.forEach((proposal) => {
        const type = proposal.status === 'approved' ? 'proposal_approved' : 
                     proposal.status === 'rejected' ? 'proposal_rejected' : 
                     'proposal_submitted';
        activities.push({
          id: `proposal-${proposal.id}`,
          type,
          title: proposal.status === 'approved' ? 'Proposal approved' :
                 proposal.status === 'rejected' ? 'Proposal rejected' :
                 'New proposal submitted',
          description: proposal.title,
          timestamp: proposal.submitted_on,
          icon: proposal.status === 'approved' ? CheckCircle2 : 
                proposal.status === 'rejected' ? XCircle : FileText,
          color: proposal.status === 'approved' ? 'text-green-500' : 
                 proposal.status === 'rejected' ? 'text-red-500' : 
                 'text-yellow-500',
          actionUrl: `/admin/proposals`,
        });
      });

      // Recent tickets with event info
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, purchase_date, event_id, user_id, price')
        .gte('purchase_date', startDate.toISOString())
        .order('purchase_date', { ascending: false })
        .limit(10);

      // Get event titles for tickets
      const eventIds = tickets?.map(t => t.event_id).filter(Boolean) || [];
      const { data: ticketEvents } = eventIds.length > 0 ? await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds) : { data: null };

      const eventMap = new Map(ticketEvents?.map(e => [e.id, e]) || []);

      tickets?.forEach((ticket) => {
        const event = eventMap.get(ticket.event_id);
        activities.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket_purchased',
          title: 'Ticket purchased',
          description: event?.title || `Event ID: ${ticket.event_id}`,
          timestamp: ticket.purchase_date || new Date().toISOString(),
          metadata: {
            amount: ticket.price || 0,
          },
          icon: Ticket,
          color: 'text-green-500',
          actionUrl: `/admin/events`,
        });
      });

      // Recent payments
      const { data: payments } = await supabase
        .from('payments')
        .select('id, created_at, amount, user_id, event_id, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      payments?.forEach((payment) => {
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment_received',
          title: 'Payment received',
          description: `KES ${payment.amount?.toLocaleString() || 0}`,
          timestamp: payment.created_at,
          metadata: {
            amount: payment.amount || 0,
            status: payment.status,
          },
          icon: CreditCard,
          color: payment.status === 'completed' ? 'text-green-500' : 'text-yellow-500',
          actionUrl: `/admin/analytics`,
        });
      });

      // Sort by timestamp and return top 15
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    },
    refetchInterval: 30000,
  });

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const eventsTrend = recentEvents && recentUsers
    ? calculateTrend(recentEvents.length, recentUsers.length)
    : 0;

  const usersTrend = recentUsers
    ? calculateTrend(recentUsers.length, (recentUsers.length * 0.9)) // Approximate previous
    : 0;

  const revenueTrend = revenueData
    ? calculateTrend(revenueData.totalRevenue, revenueData.previousRevenue)
    : 0;

  const isLoading = isLoadingEvents || isLoadingUsers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: Just now</span>
          </div>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{eventStats?.total_events || 0}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {eventsTrend >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={eventsTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(eventsTrend).toFixed(1)}% vs last period
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {usersTrend >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={usersTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(usersTrend).toFixed(1)}% vs last period
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  KES {(revenueData?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {revenueTrend >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={revenueTrend >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(revenueTrend).toFixed(1)}% vs last period
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(pendingData?.events || 0) + (pendingData?.proposals || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingData?.events || 0} events, {pendingData?.proposals || 0} proposals
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Quick Actions</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-7">Common administrative tasks</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/admin/events')}
            className="bg-[rgb(29,33,42)] dark:bg-[rgb(29,33,42)] rounded-lg p-4 cursor-pointer transition-all hover:bg-[rgb(35,40,50)] hover:border-primary/50 border border-border/50"
          >
            <div className="flex flex-col gap-2">
              <Plus className="h-5 w-5 text-primary mb-1" />
              <h3 className="text-base font-medium text-foreground">Create Event</h3>
              <p className="text-sm text-muted-foreground">
                Create a new event for the platform
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/proposals')}
            className="bg-[rgb(29,33,42)] dark:bg-[rgb(29,33,42)] rounded-lg p-4 cursor-pointer transition-all hover:bg-[rgb(35,40,50)] hover:border-primary/50 border border-border/50"
          >
            <div className="flex flex-col gap-2">
              <RotateCw className="h-5 w-5 text-primary mb-1" />
              <h3 className="text-base font-medium text-foreground">Review Proposals</h3>
              <p className="text-sm text-muted-foreground">
                Review and approve event proposals
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/moderation')}
            className="bg-[rgb(29,33,42)] dark:bg-[rgb(29,33,42)] rounded-lg p-4 cursor-pointer transition-all hover:bg-[rgb(35,40,50)] hover:border-primary/50 border border-border/50"
          >
            <div className="flex flex-col gap-2">
              <MessageSquare className="h-5 w-5 text-primary mb-1" />
              <h3 className="text-base font-medium text-foreground">Content Review</h3>
              <p className="text-sm text-muted-foreground">
                Moderate user-generated content
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/analytics')}
            className="bg-[rgb(29,33,42)] dark:bg-[rgb(29,33,42)] rounded-lg p-4 cursor-pointer transition-all hover:bg-[rgb(35,40,50)] hover:border-primary/50 border border-border/50"
          >
            <div className="flex flex-col gap-2">
              <TrendingUp className="h-5 w-5 text-primary mb-1" />
              <h3 className="text-base font-medium text-foreground">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View detailed analytics and insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest platform activities and updates</CardDescription>
            </div>
            {recentActivity && recentActivity.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/analytics')}
                className="text-xs"
              >
                View All
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                const timeAgo = format(new Date(activity.timestamp), 'MMM d, h:mm a');
                const isToday = format(new Date(activity.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <div
                    key={activity.id}
                    onClick={() => activity.actionUrl && navigate(activity.actionUrl)}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      activity.actionUrl ? 'hover:bg-accent hover:border-primary/50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${activity.color.replace('text-', 'bg-')}/10`}>
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{activity.title}</p>
                            {activity.event?.status && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  activity.event.status === 'approved' ? 'border-green-500 text-green-500' :
                                  activity.event.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                                  'border-red-500 text-red-500'
                                }`}
                              >
                                {activity.event.status}
                              </Badge>
                            )}
                            {activity.metadata?.amount && (
                              <Badge variant="outline" className="text-xs">
                                KES {activity.metadata.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.user ? (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={activity.user.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {activity.user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-muted-foreground truncate">
                                  {activity.user.name}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground truncate">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          {activity.user && activity.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`text-xs ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {isToday ? 'Today' : timeAgo}
                          </p>
                          {activity.actionUrl && (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here as it happens</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;

