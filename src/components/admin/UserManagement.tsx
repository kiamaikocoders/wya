
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "attendee",
    status: "active",
    joined: "2023-01-15",
    events_attended: 12,
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    id: 2,
    name: "Alice Smith",
    email: "alice@example.com",
    role: "organizer",
    status: "active",
    joined: "2023-02-20",
    events_created: 5,
    profile_picture: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    id: 3,
    name: "Robert Johnson",
    email: "robert@example.com",
    role: "attendee",
    status: "inactive",
    joined: "2023-03-10",
    events_attended: 3,
    profile_picture: "https://randomuser.me/api/portraits/men/3.jpg"
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@example.com",
    role: "organizer",
    status: "active",
    joined: "2023-04-05",
    events_created: 8,
    profile_picture: "https://randomuser.me/api/portraits/women/4.jpg"
  },
  {
    id: 5,
    name: "Michael Wilson",
    email: "michael@example.com",
    role: "attendee",
    status: "active",
    joined: "2023-05-12",
    events_attended: 7,
    profile_picture: "https://randomuser.me/api/portraits/men/5.jpg"
  }
];

// Chart data
const userRoleData = [
  { name: 'Attendees', value: 120 },
  { name: 'Organizers', value: 30 },
  { name: 'Admins', value: 5 },
];

const userActivityData = [
  { name: 'Jan', attendees: 40, organizers: 10 },
  { name: 'Feb', attendees: 45, organizers: 12 },
  { name: 'Mar', attendees: 50, organizers: 13 },
  { name: 'Apr', attendees: 55, organizers: 15 },
  { name: 'May', attendees: 60, organizers: 18 },
  { name: 'Jun', attendees: 70, organizers: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const UserManagement = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY || 'AIzaSyBRF6q949E70yC36OvT-BYsGBeP7Jfux9Y'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this user data and provide insights (growth trends, engagement patterns, retention opportunities):
                - Total users: 155
                - New users this month: 23
                - Attendees: 120
                - Organizers: 30
                - Admins: 5
                - Active users in last 30 days: 78
                - Average events attended per user: 4.5
                - Top user interests: Music (45%), Food (30%), Technology (25%)
                
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

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex justify-between items-center">
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
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <TabsContent value="all" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">155</div>
              <p className="text-sm text-muted-foreground mt-1">+23 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">78</div>
              <p className="text-sm text-muted-foreground mt-1">50.3% of total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Average Events</CardTitle>
              <CardDescription>Per user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4.5</div>
              <p className="text-sm text-muted-foreground mt-1">+0.8 from last month</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
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
          
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userActivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendees" fill="#0088FE" name="Attendees" />
                  <Bar dataKey="organizers" fill="#00C49F" name="Organizers" />
                </BarChart>
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
                AI User Insights
              </CardTitle>
              <CardDescription>AI-powered analysis of user trends and engagement</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAIAnalysis}
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
        
        <Table>
          <TableCaption>A list of all users on the platform.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'organizer' ? 'outline' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.joined}</TableCell>
                <TableCell>
                  {user.role === 'attendee' 
                    ? `${user.events_attended} events attended` 
                    : `${user.events_created} events created`}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      
      <TabsContent value="attendees">
        <Card>
          <CardHeader>
            <CardTitle>Attendees</CardTitle>
            <CardDescription>Manage attendee users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Attendee management tools and data will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="organizers">
        <Card>
          <CardHeader>
            <CardTitle>Organizers</CardTitle>
            <CardDescription>Manage event organizers.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Organizer management tools and data will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="inactive">
        <Card>
          <CardHeader>
            <CardTitle>Inactive Users</CardTitle>
            <CardDescription>Manage inactive accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Inactive user management tools and data will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default UserManagement;
