
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Area,
  AreaChart
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Calendar, MapPin, DollarSign } from 'lucide-react';

interface AnalyticsDashboardProps {
  eventId?: number;
  data: {
    ticketSales: any[];
    attendeeDemo: any[];
    engagementRate: any[];
    surveyResponses: any[];
    revenue: any[];
    geographicData: any[];
  };
  period: string;
}

const CHART_COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28", "#8884d8"];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ eventId, data, period }) => {
  // Calculate trends for KPIs
  const ticketSalesTrend = 12.5;
  const engagementTrend = 5.2;
  const revenueTrend = 15.8;
  const attendeeTrend = -3.2;
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Ticket Sales" 
          value="458" 
          trend={ticketSalesTrend} 
          description="Total tickets sold" 
          icon={<Calendar />} 
        />
        <KpiCard 
          title="Engagement" 
          value="75%" 
          trend={engagementTrend} 
          description="Platform interactions" 
          icon={<Users />} 
        />
        <KpiCard 
          title="Revenue" 
          value="KSh 265,500" 
          trend={revenueTrend}
          description="Total event revenue" 
          icon={<DollarSign />} 
        />
        <KpiCard 
          title="New Attendees" 
          value="126" 
          trend={attendeeTrend} 
          description="First-time visitors" 
          icon={<Users />} 
        />
      </div>
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Sales Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Sales Trend</CardTitle>
            <CardDescription>Ticket sales over time by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.ticketSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="regular" 
                    stackId="1"
                    stroke="#0088FE" 
                    fill="#0088FE" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vip" 
                    stackId="1"
                    stroke="#00C49F" 
                    fill="#00C49F" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earlyBird" 
                    stackId="1"
                    stroke="#FFBB28" 
                    fill="#FFBB28" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Attendee Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Attendee Demographics</CardTitle>
            <CardDescription>Age and gender distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attendeeDemo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" fill="#0088FE" />
                  <Bar dataKey="female" fill="#FF8042" />
                  <Bar dataKey="other" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate</CardTitle>
            <CardDescription>Platform interaction over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagementRate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Distribution by ticket type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.revenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendee Locations</CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={data.geographicData}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="location" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendees" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Survey Results */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Results</CardTitle>
          <CardDescription>Attendee feedback by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={data.surveyResponses}
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 5]} />
                  <YAxis dataKey="category" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Key Insights</h3>
              <div className="space-y-3">
                <InsightCard 
                  title="Content Quality" 
                  value="4.8/5" 
                  trend={8.5} 
                  description="Highest rated aspect" 
                />
                <InsightCard 
                  title="Venue Rating" 
                  value="4.2/5" 
                  trend={-2.3} 
                  description="Slight decrease from last event" 
                />
                <InsightCard 
                  title="Recommendation Rate" 
                  value="92%" 
                  trend={5.1} 
                  description="Would recommend to friends" 
                />
                <InsightCard 
                  title="Value Perception" 
                  value="4.5/5" 
                  trend={12.5} 
                  description="Strong improvement in perceived value" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// KPI Card Component
const KpiCard = ({ title, value, trend, description, icon }: any) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${trend >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">{description}</p>
        <Badge variant={trend >= 0 ? "outline" : "destructive"} className="flex items-center">
          {trend >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
          {Math.abs(trend)}%
        </Badge>
      </div>
    </CardContent>
  </Card>
);

// Insight Card Component
const InsightCard = ({ title, value, trend, description }: any) => (
  <div className="p-3 bg-muted rounded-lg">
    <div className="flex justify-between items-center">
      <h4 className="font-medium">{title}</h4>
      <Badge variant={trend >= 0 ? "outline" : "destructive"} className="flex items-center">
        {trend >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {Math.abs(trend)}%
      </Badge>
    </div>
    <div className="flex justify-between items-baseline mt-2">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default AnalyticsDashboard;
