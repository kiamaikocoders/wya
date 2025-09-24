
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import { Calendar, Users, DollarSign, Ticket, TrendingUp, Map, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Sample data for charts
const eventsByMonth = [
  { month: 'Jan', events: 12, revenue: 24000 },
  { month: 'Feb', events: 15, revenue: 30000 },
  { month: 'Mar', events: 18, revenue: 36000 },
  { month: 'Apr', events: 20, revenue: 40000 },
  { month: 'May', events: 25, revenue: 50000 },
  { month: 'Jun', events: 22, revenue: 44000 },
];

const eventsByCategory = [
  { name: 'Music', value: 35 },
  { name: 'Culture', value: 20 },
  { name: 'Food', value: 15 },
  { name: 'Sports', value: 10 },
  { name: 'Technology', value: 20 },
];

const engagementData = [
  { metric: 'Tickets Sold', value: 1250 },
  { metric: 'Event Views', value: 8500 },
  { metric: 'User Posts', value: 357 },
  { metric: 'Comments', value: 824 },
  { metric: 'Likes', value: 2145 },
];

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

const Analytics = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const runPerformanceAnalysis = async () => {
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
                text: `Analyze this event platform performance data and provide 3 key insights with actionable recommendations:

                - Total events YTD: 112
                - Revenue YTD: $224,000
                - Top category: Music (35%)
                - Engagement metrics: 
                  * 1250 tickets sold
                  * 8500 event views
                  * 357 user posts
                  * 824 comments
                  * 2145 likes
                - Monthly growth: 15% average
                - User retention: 65%
                - Conversion rate (views to tickets): 14.7%
                
                Provide 3 clear insights with specific actionable recommendations to improve platform performance and growth.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      setAnalysisResult(data.candidates[0].content.parts[0].text);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error running AI performance analysis:', error);
      toast.error('Failed to complete analysis');
      setAnalysisResult('Failed to generate analysis. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
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
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">112</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
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
              <div className="text-2xl font-bold">1,325</div>
              <p className="text-xs text-muted-foreground">+5.2% from last month</p>
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
              <div className="text-2xl font-bold">$224,000</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
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
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">+18.4% from last month</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Events & Revenue</CardTitle>
              <CardDescription>Monthly events and revenue trends</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={eventsByMonth}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
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
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#FF8042" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Events by Category</CardTitle>
              <CardDescription>Distribution of events per category</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventsByCategory.map((entry, index) => (
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
        
        {/* AI Analysis Card */}
        <Card className="border-kenya-orange/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-kenya-orange" />
                AI Performance Insights
              </CardTitle>
              <CardDescription>AI-powered analysis of platform performance</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runPerformanceAnalysis}
              disabled={isAnalyzing}
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
                    <Loader2 className="h-8 w-8 animate-spin text-kenya-orange mb-2" />
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
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="events">
        <Card>
          <CardHeader>
            <CardTitle>Events Analytics</CardTitle>
            <CardDescription>Detailed events performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Detailed event analytics will be shown here.</p>
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
            <p>User engagement data will be shown here.</p>
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
            <p>Revenue and financial reports will be shown here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default Analytics;
