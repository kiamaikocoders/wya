import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import AdminFeedbackPanel from '@/components/admin/AdminFeedbackPanel';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminFeedback: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="App feedback"
      subtitle="Messages from signed-in users (not event surveys)."
      icon={Inbox}
      actions={
        <AdminRefreshButton
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-app-feedback'] })}
        />
      }
    >
      <AdminFeedbackPanel hideTitle />
    </AdminPageShell>
  );
};

export default AdminFeedback;
