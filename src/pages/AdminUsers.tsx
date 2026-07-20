import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Users"
      subtitle="Roles, status, and bulk access controls"
      icon={Users}
      actions={
        <AdminRefreshButton
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users-figma'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
          }}
        />
      }
    >
      <UserManagement />
    </AdminPageShell>
  );
};

export default AdminUsers;
