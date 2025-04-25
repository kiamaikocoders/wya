
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, MessageSquare, ActivitySquare, FileText } from 'lucide-react';
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
      </header>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
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

        <TabsContent value="moderation" className="space-y-4">
          <ContentModeration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
