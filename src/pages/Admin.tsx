
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, MessageSquare, ActivitySquare, FileText, BarChart3 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EventManagement from '@/components/admin/EventManagement';
import UserManagement from '@/components/admin/UserManagement';
import Analytics from '@/components/admin/Analytics';
import ContentModeration from '@/components/admin/ContentModeration';
import ProposalManagement from '@/components/admin/ProposalManagement';
import { toast } from 'sonner';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Show welcome toast when admin dashboard loads
    if (user && isAdmin && !loading) {
      toast.success(`Welcome to the admin dashboard, ${user.name}!`);
    }
  }, [user, isAdmin, loading]);

  // Check admin credentials again (double validation)
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('You do not have admin privileges');
      navigate('/admin-login');
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdmin) {
    toast.error('You do not have admin privileges');
    return <Navigate to="/admin-login" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        <div className="mt-2 flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Admin Access Granted
          </span>
        </div>
      </header>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="overflow-x-auto flex w-full py-2">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Event Management
          </TabsTrigger>
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="sponsor-analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sponsor Analytics
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Content Moderation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <EventManagement />
        </TabsContent>
        
        <TabsContent value="proposals" className="space-y-4">
          <ProposalManagement />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>

        <TabsContent value="sponsor-analytics" className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Sponsor Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Total Impressions</h3>
                <p className="text-3xl font-bold text-blue-600">24,751</p>
                <p className="text-sm text-gray-500">+12% from last month</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Total Interactions</h3>
                <p className="text-3xl font-bold text-green-600">8,432</p>
                <p className="text-sm text-gray-500">+8% from last month</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Story Mentions</h3>
                <p className="text-3xl font-bold text-purple-600">1,247</p>
                <p className="text-sm text-gray-500">+15% from last month</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Zone Check-ins</h3>
                <p className="text-3xl font-bold text-amber-600">5,921</p>
                <p className="text-sm text-gray-500">+22% from last month</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Poll & Quiz Results</h3>
                <div className="h-64 flex items-center justify-center border rounded p-4">
                  <p className="text-gray-500">Interactive chart showing poll and quiz engagement will display here</p>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Geo-data Engagement</h3>
                <div className="h-64 flex items-center justify-center border rounded p-4">
                  <p className="text-gray-500">Heat map showing user engagement by location will display here</p>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">Sponsor Zone Activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">EABL</td>
                        <td className="px-6 py-4 whitespace-nowrap">2,453</td>
                        <td className="px-6 py-4 whitespace-nowrap">4m 32s</td>
                        <td className="px-6 py-4 whitespace-nowrap">1,245</td>
                        <td className="px-6 py-4 whitespace-nowrap">12.4%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">SportPesa</td>
                        <td className="px-6 py-4 whitespace-nowrap">1,897</td>
                        <td className="px-6 py-4 whitespace-nowrap">3m 18s</td>
                        <td className="px-6 py-4 whitespace-nowrap">978</td>
                        <td className="px-6 py-4 whitespace-nowrap">9.7%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Red Bull</td>
                        <td className="px-6 py-4 whitespace-nowrap">2,124</td>
                        <td className="px-6 py-4 whitespace-nowrap">5m 47s</td>
                        <td className="px-6 py-4 whitespace-nowrap">1,532</td>
                        <td className="px-6 py-4 whitespace-nowrap">15.2%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <ContentModeration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
