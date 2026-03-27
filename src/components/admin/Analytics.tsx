import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Calendar, Users, DollarSign, Ticket, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/admin-service';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { runAdminInsightsAnalysis } from '@/lib/admin-ai-analysis';

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

const Analytics = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  
  // Fetch event stats
  const { data: eventStats, isLoading: isLoadingEventStats } = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user stats
  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch events by month for chart
  const { data: eventsByMonthData, isLoading: isLoadingEventsData } = useQuery({
    queryKey: ['admin-events-by-month', dateRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        case 'quarter':
          startDate = subMonths(now, 3);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = new Date(0); // All time
      }

      const { data: events } = await supabase
        .from('events')
        .select('id, created_at, date, price')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const { data: tickets } = await supabase
        .from('tickets')
        .select('event_id, purchase_date, price')
        .gte('purchase_date', startDate.toISOString());

      // Group by month
      const months = eachMonthOfInterval({
        start: startDate,
        end: now,
      });

      return months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthKey = format(month, 'MMM');
        
        const monthEvents = events?.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }) || [];

        const monthTickets = tickets?.filter(t => {
          const ticketDate = new Date(t.purchase_date);
          return ticketDate >= monthStart && ticketDate <= monthEnd;
        }) || [];

        const revenue = monthTickets.reduce((sum, t) => sum + (t.price || 0), 0);

        return {
          month: monthKey,
          events: monthEvents.length,
          revenue: revenue,
          tickets: monthTickets.length,
        };
      });
    },
    enabled: !!eventStats,
  });

  // Fetch events by category
  const { data: eventsByCategoryData, isLoading: isLoadingCategoryData } = useQuery({
    queryKey: ['admin-events-by-category'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('events')
        .select('category')
        .not('category', 'is', null);

      const categoryCounts = new Map<string, number>();
      events?.forEach(event => {
        if (event.category) {
          categoryCounts.set(event.category, (categoryCounts.get(event.category) || 0) + 1);
        }
      });

      return Array.from(categoryCounts.entries()).map(([name, value]) => ({ name, value }));
    },
  });

  // Fetch engagement metrics
  const { data: engagementData, isLoading: isLoadingEngagement } = useQuery({
    queryKey: ['admin-engagement-metrics'],
    queryFn: async () => {
      const [ticketsResult, postsResult, commentsResult, likesResult] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
        supabase.from('forum_comments').select('id', { count: 'exact', head: true }),
        supabase.from('post_likes').select('id', { count: 'exact', head: true }),
      ]);

      return [
        { metric: 'Tickets Sold', value: ticketsResult.count || 0 },
        { metric: 'User Posts', value: postsResult.count || 0 },
        { metric: 'Comments', value: commentsResult.count || 0 },
        { metric: 'Likes', value: likesResult.count || 0 },
      ];
    },
  });

  const runPerformanceAnalysis = async () => {
    if (!eventStats || !userStats) {
      toast.error('Statistics are still loading. Wait a moment, then try again.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const text = await runAdminInsightsAnalysis(
        `Analyze this event platform performance data and provide 3 key insights with actionable recommendations:

- Total events: ${eventStats.total_events}
- Revenue: KES ${eventStats.total_revenue.toLocaleString()}
- Active users: ${userStats.active_users}
- Total users: ${userStats.total_users}
- New users this month: ${userStats.new_users_this_month}
- Average events per user: ${userStats.average_events_per_user}
- Events this month: ${eventStats.events_this_month}

Provide 3 clear insights with specific actionable recommendations to improve platform performance and growth.`
      );
      setAnalysisResult(text);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error running AI performance analysis:', error);
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

  const isLoading = isLoadingEventStats || isLoadingUserStats || isLoadingEventsData || isLoadingCategoryData || isLoadingEngagement;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>
        
        <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <TabsContent value="overview" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gradient-orange-accent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventStats?.total_events || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {eventStats?.events_this_month || 0} this month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats?.active_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats?.new_users_this_month || 0} new this month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    KES {(eventStats?.total_revenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tickets Sold
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementData?.[0]?.value || 0}</div>
                  <p className="text-xs text-muted-foreground">Total tickets</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Events & Revenue</CardTitle>
                  <CardDescription>Monthly trends</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {eventsByMonthData && eventsByMonthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={eventsByMonthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="events"
                          stroke="#0088FE"
                          activeDot={{ r: 8 }}
                          name="Events"
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#FF8042" 
                          name="Revenue (KES)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Events by Category</CardTitle>
                  <CardDescription>Distribution of events</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {eventsByCategoryData && eventsByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventsByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {eventsByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* AI Analysis Card */}
            <Card className="border-kenya-orange/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gradient-orange-accent" />
                    AI Performance Insights
                  </CardTitle>
                  <CardDescription>AI-powered analysis of platform performance</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runPerformanceAnalysis}
                  disabled={isAnalyzing || !eventStats || !userStats}
                  className="border-kenya-orange/50 text-gradient-orange-accent hover:bg-gradient-accent/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
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
                        <Loader2 className="h-8 w-8 animate-spin text-gradient-orange-accent mb-2" />
                        <p>Analyzing platform performance...</p>
                      </div>
                    ) : (
                      <p>Click "Generate Insights" to create AI-powered analysis and recommendations.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>Key engagement statistics</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {engagementData && engagementData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={engagementData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 80,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="metric" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="events">
        <Card>
          <CardHeader>
            <CardTitle>Events Analytics</CardTitle>
            <CardDescription>Detailed events performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsByMonthData && eventsByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={eventsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="events" fill="#0088FE" name="Events" />
                  <Bar dataKey="tickets" fill="#00C49F" name="Tickets Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No event data available for the selected period.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="engagement">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>User behavior and interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {engagementData && engagementData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {engagementData.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{item.metric}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No engagement data available.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="revenue">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Reports</CardTitle>
            <CardDescription>Financial performance data</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsByMonthData && eventsByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={eventsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name="Revenue (KES)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No revenue data available for the selected period.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default Analytics;
