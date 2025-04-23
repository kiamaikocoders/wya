
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Filter, BarChart, PieChart, Activity, Calendar, Handshake } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { eventService } from '@/lib/event-service';
import { useAuth } from '@/contexts/AuthContext';
import SponsorsAnalytics from '@/components/sponsors/SponsorsAnalytics';

// Sample analytics data
const SAMPLE_ANALYTICS_DATA = {
  ticketSales: [
    { date: 'Jan', regular: 20, vip: 5, earlyBird: 40 },
    { date: 'Feb', regular: 30, vip: 8, earlyBird: 25 },
    { date: 'Mar', regular: 45, vip: 12, earlyBird: 15 },
    { date: 'Apr', regular: 60, vip: 18, earlyBird: 10 },
    { date: 'May', regular: 75, vip: 25, earlyBird: 5 },
    { date: 'Jun', regular: 90, vip: 30, earlyBird: 0 },
  ],
  attendeeDemo: [
    { ageGroup: '18-24', male: 25, female: 30, other: 5 },
    { ageGroup: '25-34', male: 45, female: 50, other: 8 },
    { ageGroup: '35-44', male: 30, female: 32, other: 3 },
    { ageGroup: '45-54', male: 15, female: 18, other: 2 },
    { ageGroup: '55+', male: 10, female: 12, other: 1 },
  ],
  engagementRate: [
    { date: 'Week 1', rate: 45 },
    { date: 'Week 2', rate: 52 },
    { date: 'Week 3', rate: 68 },
    { date: 'Week 4', rate: 75 },
    { date: 'Week 5', rate: 80 },
    { date: 'Week 6', rate: 78 },
  ],
  surveyResponses: [
    { category: 'Content', score: 4.8 },
    { category: 'Venue', score: 4.2 },
    { category: 'Organization', score: 4.5 },
    { category: 'Value', score: 4.5 },
    { category: 'Staff', score: 4.7 },
    { category: 'Food & Drinks', score: 4.1 },
  ],
  revenue: [
    { name: 'Regular', value: 45 },
    { name: 'VIP', value: 30 },
    { name: 'Early Bird', value: 20 },
    { name: 'Sponsors', value: 5 },
  ],
  geographicData: [
    { location: 'Nairobi', attendees: 250 },
    { location: 'Mombasa', attendees: 80 },
    { location: 'Kisumu', attendees: 45 },
    { location: 'Nakuru', attendees: 35 },
    { location: 'Eldoret', attendees: 25 },
    { location: 'Other', attendees: 23 },
  ],
};

const AnalyticsDashboardPage: React.FC = () => {
  const { eventId } = useParams();
  const { user, isAdmin } = useAuth();
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Query to fetch event details if an eventId is provided
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventId ? eventService.getEventById(Number(eventId)) : Promise.resolve(null),
    enabled: !!eventId,
  });
  
  // Query to fetch all events for an admin overview
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAllEvents,
    enabled: isAdmin && !eventId,
  });
  
  const isOrganizer = event && user?.user_type === 'organizer' && event.organizer_id === user.id;
  const isAuthorized = isAdmin || isOrganizer;
  
  if ((eventLoading || eventsLoading) && (eventId || isAdmin)) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  // If there's an eventId but the user is not authorized to view it
  if (eventId && !isAuthorized) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-2xl mb-4">Unauthorized Access</h2>
              <p className="mb-6">You don't have permission to view analytics for this event.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate some platform stats for admin view
  const platformStats = {
    totalEvents: events?.length || 0,
    upcomingEvents: events?.filter(e => new Date(e.date) > new Date()).length || 0,
    totalUsers: 862, // Mock data
    newUsers: 126, // Mock data
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {eventId 
            ? `Analytics: ${event?.title || 'Loading...'}`
            : 'Platform Analytics'
          }
        </h1>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          {/* New Sponsors Tab */}
          <TabsTrigger value="sponsors" className="flex items-center gap-1">
            <Handshake className="h-4 w-4" />
            Sponsors
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AnalyticsDashboard 
            eventId={eventId ? Number(eventId) : undefined}
            data={SAMPLE_ANALYTICS_DATA}
            period={period}
          />
        </TabsContent>
        
        <TabsContent value="engagement">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Engagement Analytics</h2>
            <p className="text-muted-foreground">
              Detailed engagement metrics are being developed. Check back soon for more insights!
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Revenue Analytics</h2>
            <p className="text-muted-foreground">
              Detailed revenue metrics are being developed. Check back soon for more insights!
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="events">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Events Analytics</h2>
            <p className="text-muted-foreground">
              Detailed event metrics are being developed. Check back soon for more insights!
            </p>
          </Card>
        </TabsContent>
        
        {/* New Sponsors Tab Content */}
        <TabsContent value="sponsors">
          <SponsorsAnalytics eventId={eventId ? Number(eventId) : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboardPage;
