import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ActivitySquare } from 'lucide-react';
import Analytics from '@/components/admin/Analytics';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminAnalytics: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Analytics"
      subtitle="Growth, engagement, and revenue trends"
      icon={ActivitySquare}
      actions={
        <AdminRefreshButton
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
            queryClient.invalidateQueries({ queryKey: ['admin-analytics-tickets'] });
          }}
        />
      }
    >
      <Analytics />
    </AdminPageShell>
  );
};

export default AdminAnalytics;
