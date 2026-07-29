import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import ProposalManagement from '@/components/admin/ProposalManagement';
import { AdminPageShell, AdminRefreshButton } from '@/components/admin/AdminPageShell';

const AdminProposals: React.FC = () => {
  const queryClient = useQueryClient();
  return (
    <AdminPageShell
      title="Proposals"
      subtitle="Open a proposal for the full pitch, submitter details, and decision emails"
      icon={FileText}
      actions={
        <AdminRefreshButton
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-proposals-figma'] })}
        />
      }
    >
      <ProposalManagement />
    </AdminPageShell>
  );
};

export default AdminProposals;
