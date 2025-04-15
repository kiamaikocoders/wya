
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">User management tools and reports will appear here.</p>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
