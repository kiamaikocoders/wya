import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Images } from 'lucide-react';
import EventMediaGalleryDashboard from '@/components/admin/EventMediaGalleryDashboard';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminMediaGallery: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Event media"
      subtitle="UGC photos and videos for organizer intelligence."
      icon={Images}
      actions={
        <AdminRefreshButton
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-event-media'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event-media-events'] });
          }}
        />
      }
    >
      <EventMediaGalleryDashboard />
    </AdminPageShell>
  );
};

export default AdminMediaGallery;
