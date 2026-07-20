import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import EventManagement from '@/components/admin/EventManagement';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminEvents: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Events"
      subtitle="Create, approve, and manage nightlife events"
      icon={Calendar}
      actions={
        <AdminRefreshButton
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
          }}
        />
      }
    >
      <EventManagement />
    </AdminPageShell>
  );
};

export default AdminEvents;
