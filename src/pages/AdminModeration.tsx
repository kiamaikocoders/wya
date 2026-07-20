import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import ContentModeration from '@/components/admin/ContentModeration';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminModeration: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Moderation"
      subtitle="Reported posts, media, and AI assist"
      icon={MessageSquare}
      actions={
        <AdminRefreshButton
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] })}
        />
      }
    >
      <ContentModeration />
    </AdminPageShell>
  );
};

export default AdminModeration;
