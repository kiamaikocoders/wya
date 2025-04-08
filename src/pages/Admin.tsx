
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Users, CreditCard } from 'lucide-react';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();

  // Redirect if not an admin
  if (!loading && (!user || !isAdmin)) {
    return <Navigate to="/admin-login" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kenya-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
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
            Events
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Events</h2>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New Event
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Event Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No pending event requests.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Published Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No events published yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management tools coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Consumer Key</h3>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    CstL0SgMf7ZXUAmhGGqcfRMHizmEUBZTzS8joyKEKwm7YrFj
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Consumer Secret</h3>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    QuTSinGBkkKbAkQpCHRavgrG4RnPOE0BL054ykqVmMu6P37osdoZLKmGAHHftRnh
                  </p>
                </div>
                <Button>Test M-Pesa Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
