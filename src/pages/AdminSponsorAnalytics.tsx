import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import SponsorAnalytics from '@/components/admin/SponsorAnalytics';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminSponsorAnalytics: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Sponsor Analytics"
      subtitle="Track sponsor performance and engagement"
      icon={BarChart3}
      actions={
        <AdminRefreshButton
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
            queryClient.invalidateQueries({ queryKey: ['admin-sponsor-aggregate-stats'] });
            queryClient.invalidateQueries({ queryKey: ['admin-sponsor-activity'] });
          }}
        />
      }
    >
      <SponsorAnalytics />
    </AdminPageShell>
  );
};

export default AdminSponsorAnalytics;
