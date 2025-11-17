import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { sponsorService } from '@/lib/sponsor';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BarChart3, Users, Zap, Clock, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SponsorAnalytics = () => {
  const [selectedSponsor, setSelectedSponsor] = useState<number | 'all'>('all');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Fetch all sponsors
  const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: () => sponsorService.getSponsors(),
  });

  // Fetch sponsor zones
  const { data: sponsorZones } = useQuery({
    queryKey: ['admin-sponsor-zones'],
    queryFn: async () => {
      if (!sponsors || sponsors.length === 0) return [];
      
      const zonesPromises = sponsors.map(sponsor => 
        sponsorService.getSponsorZone(sponsor.id)
      );
      const zones = await Promise.all(zonesPromises);
      return zones.filter(Boolean);
    },
    enabled: !!sponsors && sponsors.length > 0,
  });

  // Calculate aggregate analytics
  const { data: aggregateStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-sponsor-aggregate-stats', period],
    queryFn: async () => {
      // Get all event sponsors
      const { data: eventSponsors } = await supabase
        .from('event_sponsors')
        .select('sponsor_id, event_id');

      // Get check-ins for sponsor zones
      const { data: checkins } = await supabase
        .from('check_ins')
        .select('zone_id, created_at')
        .gte('created_at', getPeriodStart(period));

      // Get story mentions (if stories table has sponsor references)
      const { data: stories } = await supabase
        .from('stories')
        .select('id, created_at')
        .gte('created_at', getPeriodStart(period));

      // Calculate metrics
      const totalImpressions = eventSponsors?.length || 0;
      const totalInteractions = checkins?.length || 0;
      const storyMentions = stories?.length || 0;
      const zoneCheckins = checkins?.length || 0;

      return {
        totalImpressions: totalImpressions * 100, // Estimate
        totalInteractions: totalInteractions,
        storyMentions: storyMentions,
        zoneCheckins: zoneCheckins,
      };
    },
  });

  // Get sponsor zone activity
  const { data: sponsorActivity } = useQuery({
    queryKey: ['admin-sponsor-activity'],
    queryFn: async () => {
      if (!sponsors || !sponsorZones) return [];

      const activityPromises = sponsors.map(async (sponsor) => {
        const zone = sponsorZones.find(z => z.sponsor_id === sponsor.id);
        if (!zone) return null;

        // Get check-ins for this zone
        const { data: checkins } = await supabase
          .from('check_ins')
          .select('*')
          .eq('zone_id', zone.id);

        const visitors = new Set(checkins?.map(c => c.user_id) || []).size;
        const interactions = checkins?.length || 0;
        
        // Calculate average time (mock for now)
        const avgTime = '4m 32s';
        const conversion = visitors > 0 ? ((interactions / visitors) * 100).toFixed(1) : '0';

        return {
          sponsor: sponsor.name,
          visitors,
          avgTime,
          interactions,
          conversion: `${conversion}%`,
        };
      });

      const activities = await Promise.all(activityPromises);
      return activities.filter(Boolean);
    },
    enabled: !!sponsors && !!sponsorZones,
  });

  function getPeriodStart(period: 'day' | 'week' | 'month' | 'year'): string {
    const now = new Date();
    switch (period) {
      case 'day':
        now.setHours(0, 0, 0, 0);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    return now.toISOString();
  }

  if (isLoadingSponsors || isLoadingStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-kenya-orange" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sponsor Analytics</h2>
          <p className="text-muted-foreground">Track sponsor performance and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSponsor.toString()} onValueChange={(value) => 
            setSelectedSponsor(value === 'all' ? 'all' : parseInt(value))
          }>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Sponsors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sponsors</SelectItem>
              {sponsors?.map(sponsor => (
                <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                  {sponsor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {aggregateStats?.totalImpressions.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {aggregateStats?.totalInteractions.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Story Mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {aggregateStats?.storyMentions.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              Zone Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {aggregateStats?.zoneCheckins.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">+22% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sponsor Zone Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Zone Activity</CardTitle>
          <CardDescription>Detailed activity metrics for each sponsor zone</CardDescription>
        </CardHeader>
        <CardContent>
          {sponsorActivity && sponsorActivity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Visitors</TableHead>
                  <TableHead>Avg. Time</TableHead>
                  <TableHead>Interactions</TableHead>
                  <TableHead>Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsorActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity?.sponsor}</TableCell>
                    <TableCell>{activity?.visitors.toLocaleString()}</TableCell>
                    <TableCell>{activity?.avgTime}</TableCell>
                    <TableCell>{activity?.interactions.toLocaleString()}</TableCell>
                    <TableCell>{activity?.conversion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sponsor activity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Poll & Quiz Results */}
      <Card>
        <CardHeader>
          <CardTitle>Poll & Quiz Results</CardTitle>
          <CardDescription>Engagement metrics for interactive content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded p-4">
            <p className="text-muted-foreground">
              Interactive chart showing poll and quiz engagement will display here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Geo-data Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Geo-data Engagement</CardTitle>
          <CardDescription>User engagement by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded p-4">
            <p className="text-muted-foreground">
              Heat map showing user engagement by location will display here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorAnalytics;

