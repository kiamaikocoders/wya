
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart, Award, Users, Zap, Calendar, LineChart } from 'lucide-react';
import { sponsor, sponsorService } from '@/lib/sponsor-service';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SponsorsAnalyticsProps {
  sponsorId?: number;
  eventId?: number;
}

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8', '#82ca9d'];

const SponsorsAnalytics: React.FC<SponsorsAnalyticsProps> = ({ 
  sponsorId, 
  eventId 
}) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['sponsorAnalytics', sponsorId, eventId, period],
    queryFn: () => sponsorService.getSponsorAnalytics(sponsorId || 0, eventId, period),
    enabled: !!sponsorId,
  });
  
  // Sample data for charts
  const impressionsData = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3800 },
    { name: 'Sun', value: 4300 },
  ];
  
  const interactionData = [
    { name: 'Polls', value: 400 },
    { name: 'Quizzes', value: 300 },
    { name: 'Giveaways', value: 300 },
    { name: 'Clicks', value: 200 },
    { name: 'Shares', value: 100 },
  ];
  
  const demographicsData = [
    { name: '18-24', male: 20, female: 30, other: 5 },
    { name: '25-34', male: 40, female: 35, other: 7 },
    { name: '35-44', male: 25, female: 20, other: 3 },
    { name: '45-54', male: 10, female: 12, other: 1 },
    { name: '55+', male: 5, female: 3, other: 0 },
  ];
  
  const engagementTrend = [
    { date: 'Week 1', impressions: 4000, interactions: 2400 },
    { date: 'Week 2', impressions: 3000, interactions: 1398 },
    { date: 'Week 3', impressions: 2000, interactions: 9800 },
    { date: 'Week 4', impressions: 2780, interactions: 3908 },
    { date: 'Week 5', impressions: 1890, interactions: 4800 },
    { date: 'Week 6', impressions: 2390, interactions: 3800 },
  ];
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Sponsor Analytics</h2>
        
        <Select value={period} onValueChange={(value: 'day' | 'week' | 'month' | 'year') => setPeriod(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Impressions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {analytics?.impressions || '2,547'}
              <Zap size={18} className="text-amber-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interactions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {analytics?.interactions || '842'}
              <Users size={18} className="text-blue-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Click-throughs</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {analytics?.clickThroughs || '386'}
              <Calendar size={18} className="text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Engagement Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {Math.round((analytics?.interactions || 842) / (analytics?.impressions || 2547) * 100)}%
              <Award size={18} className="text-purple-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Tabs & Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-1">
            <LineChart className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Interactions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={impressionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#FF8042" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={interactionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {interactionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line type="monotone" dataKey="interactions" stroke="#82ca9d" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>Demographic Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={demographicsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#8884d8" />
                    <Bar dataKey="female" fill="#82ca9d" />
                    <Bar dataKey="other" fill="#ffc658" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SponsorsAnalytics;
