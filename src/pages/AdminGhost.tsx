import React from 'react';
import { Ghost } from 'lucide-react';
import GhostManagement from '@/components/admin/GhostManagement';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminGhost: React.FC = () => {
  return (
    <AdminPageShell
      title="Ghost User Management"
      subtitle="Manage ghost accounts and queue engagement actions"
      icon={Ghost}
      actions={<AdminRefreshButton onClick={() => window.location.reload()} />}
    >
      <GhostManagement />
    </AdminPageShell>
  );
};

export default AdminGhost;
