
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, ArrowLeft, Download, Filter } from 'lucide-react';
import { 
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { eventService } from '@/lib/event-service';
import { surveyService } from '@/lib/survey-service';
import { ticketService } from '@/lib/ticket-service';
import { useAuth } from '@/contexts/AuthContext';

// Colors for charts
const CHART_COLORS = ["#FFBB28", "#FF8042", "#0088FE", "#00C49F", "#8884d8"];

const EventAnalytics = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  
  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventId ? eventService.getEventById(Number(eventId)) : Promise.reject('No event ID'),
    enabled: !!eventId,
  });
  
  // Fetch survey results for the event
  const { data: surveyResults } = useQuery({
    queryKey: ['eventSurveys', eventId],
    queryFn: () => eventId ? surveyService.getEventSurveys(Number(eventId)) : Promise.reject('No event ID'),
    enabled: !!eventId,
  });
  
  // Fetch ticket data
  const { data: ticketData } = useQuery({
    queryKey: ['eventTickets', eventId],
    queryFn: () => eventId ? ticketService.getEventTickets(Number(eventId)) : Promise.reject('No event ID'),
    enabled: !!eventId,
  });
  
  // Example data for visualizations
  const registrationData = [
    { name: 'Week 1', registrations: 20 },
    { name: 'Week 2', registrations: 35 },
    { name: 'Week 3', registrations: 28 },
    { name: 'Week 4', registrations: 45 },
  ];
  
  const ticketTypeData = [
    { name: 'General', value: 65 },
    { name: 'VIP', value: 25 },
    { name: 'Student', value: 10 },
  ];
  
  const demographicData = [
    { name: 'Age 18-24', value: 30 },
    { name: 'Age 25-34', value: 40 },
    { name: 'Age 35-44', value: 20 },
    { name: 'Age 45+', value: 10 },
  ];
  
  // Check if user is authorized to view analytics
  const isAuthorized = user?.user_type === 'organizer' && (!event || event.organizer_id === user.id);
  
  if (eventLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-2xl mb-4">Unauthorized Access</h2>
              <p className="mb-6">You don't have permission to view analytics for this event.</p>
              <Link to="/events">
                <Button>Back to Events</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link to={eventId ? `/events/${eventId}` : '/profile'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {event ? `${event.title} - Analytics` : 'Event Analytics'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Registrations</CardTitle>
            <CardDescription>All ticket types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ticketTypeData.reduce((acc, curr) => acc + curr.value, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Engagement Rate</CardTitle>
            <CardDescription>Social media & forum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground mt-1">+5% from previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Average Rating</CardTitle>
            <CardDescription>From post-event surveys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.7/5</div>
            <p className="text-xs text-muted-foreground mt-1">Based on 42 responses</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendees" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Attendees
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1">
            <LineChart className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Trend</CardTitle>
                <CardDescription>Ticket registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="#FF8042" 
                        activeDot={{ r: 8 }} 
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ticket Distribution</CardTitle>
                <CardDescription>By ticket type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={ticketTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {ticketTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="attendees">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
                <CardDescription>Age distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={demographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#0088FE" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Attendees by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Nairobi', value: 60 },
                          { name: 'Mombasa', value: 15 },
                          { name: 'Kisumu', value: 10 },
                          { name: 'Other', value: 15 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {ticketTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="feedback">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ratings Distribution</CardTitle>
                <CardDescription>Survey responses by rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={[
                      { rating: '1 Star', count: 2 },
                      { rating: '2 Stars', count: 3 },
                      { rating: '3 Stars', count: 8 },
                      { rating: '4 Stars', count: 15 },
                      { rating: '5 Stars', count: 22 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#00C49F" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Metrics</CardTitle>
                <CardDescription>Key satisfaction categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart 
                      layout="vertical" 
                      data={[
                        { category: 'Venue', score: 4.8 },
                        { category: 'Content', score: 4.6 },
                        { category: 'Speakers', score: 4.9 },
                        { category: 'Organization', score: 4.5 },
                        { category: 'Value', score: 4.3 },
                      ]}
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Survey Responses</CardTitle>
                <CardDescription>Latest feedback from attendees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Example survey comments */}
                  <div className="bg-accent/50 p-4 rounded-lg">
                    <p className="italic text-muted-foreground">
                      "Amazing event! The speakers were fantastic and the venue was perfect. Looking forward to next year!"
                    </p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Anonymous</span>
                      <span>5 Stars</span>
                    </div>
                  </div>
                  <div className="bg-accent/50 p-4 rounded-lg">
                    <p className="italic text-muted-foreground">
                      "Great content and networking opportunities. Would have preferred more breaks between sessions."
                    </p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Anonymous</span>
                      <span>4 Stars</span>
                    </div>
                  </div>
                  <div className="bg-accent/50 p-4 rounded-lg">
                    <p className="italic text-muted-foreground">
                      "The event was well organized. The only issue was limited parking at the venue."
                    </p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Anonymous</span>
                      <span>4 Stars</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventAnalytics;
