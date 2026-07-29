import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminFilterSelect,
  AdminListRow,
  AdminPagination,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { AdminAiInlineNote } from '@/components/admin/AdminAiAssist';
import {
  AdminProposalDetailDialog,
  type AdminProposalDetail,
} from '@/components/admin/AdminProposalDetailDialog';
import { analyzeProposal } from '@/lib/admin-ai-analysis';
import { useListPagination } from '@/hooks/use-list-pagination';

type ProposalRow = AdminProposalDetail;

const ProposalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected] = useState<ProposalRow | null>(null);

  const proposalsQuery = useQuery({
    queryKey: ['admin-proposals-figma'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(
          'id, title, category, description, location, status, submitted_by, submitted_on, contact_email, contact_phone, estimated_date, expected_attendees, budget, sponsor_needs, image_url, admin_notes'
        )
        .order('id', { ascending: false });
      if (error) throw error;

      const ids = [...new Set((data || []).map((p) => p.submitted_by).filter(Boolean))] as string[];
      let nameMap = new Map<string, string>();
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', ids);
        nameMap = new Map(
          (profiles || []).map((p) => [p.id, p.full_name?.trim() || p.username || 'Organizer'])
        );
      }

      return (data || []).map((p) => {
        const isRegistered = Boolean(p.submitted_by);
        return {
          ...p,
          status: (p.status as ProposalRow['status']) || 'pending',
          is_registered: isRegistered,
          submitter_name: isRegistered
            ? nameMap.get(p.submitted_by!) || p.contact_email || 'Registered user'
            : p.contact_email || 'Guest',
        };
      }) as ProposalRow[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      next,
      reason,
    }: {
      id: number;
      next: 'approved' | 'rejected';
      reason?: string;
    }) => {
      const note = reason?.trim() || null;
      const { error } = await supabase
        .from('proposals')
        .update({
          status: next,
          ...(note ? { admin_notes: note } : {}),
        })
        .eq('id', id);
      if (error) throw error;

      const { data, error: notifyError } = await supabase.functions.invoke('submit-proposal', {
        body: {
          action: 'notify_decision',
          proposal_id: id,
          decision: next,
          reason: note || undefined,
        },
      });

      if (notifyError) {
        throw new Error(
          notifyError.message ||
            'Decision saved, but the notification email failed to send.'
        );
      }

      const payload = data as {
        error?: string;
        emails_sent?: string[];
        email_errors?: string[];
      } | null;

      if (payload?.error) {
        throw new Error(payload.error);
      }

      return {
        next,
        emailsSent: payload?.emails_sent ?? [],
        emailErrors: payload?.email_errors ?? [],
      };
    },
    onSuccess: (result) => {
      const emailed =
        result.emailsSent.length > 0
          ? ` Email sent to ${result.emailsSent.join(', ')}.`
          : '';
      toast.success(
        `${result.next === 'approved' ? 'Proposal approved' : 'Proposal rejected'}.${emailed}`
      );
      if (result.emailErrors.length) {
        toast.warning(`Email issue: ${result.emailErrors.join('; ')}`);
      }
      if (!result.emailsSent.length && !result.emailErrors.length) {
        toast.warning('Decision saved, but no decision email was sent. Check contact email / Resend.');
      }
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['admin-proposals-figma'] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      queryClient.invalidateQueries({ queryKey: ['admin-proposals-figma'] });
    },
  });

  const rows = useMemo(() => {
    const all = proposalsQuery.data ?? [];
    return all.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.submitter_name || '').toLowerCase().includes(q) ||
        (p.contact_email || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    });
  }, [proposalsQuery.data, search, status]);

  const { page, setPage, pageItems, totalPages, total, pageSize } = useListPagination(rows, {
    resetKey: `${search}|${status}`,
  });

  const selectedLive =
    selected && proposalsQuery.data
      ? proposalsQuery.data.find((p) => p.id === selected.id) ?? selected
      : selected;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search proposals…" />
        <AdminFilterSelect
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            { value: 'all', label: 'Status: All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      <AdminSectionPanel
        title="Event proposals"
        description="Open a proposal to review the full pitch, who submitted it, and send a decision with feedback."
      >
        {proposalsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No proposals found.</p>
        ) : (
          <div className="space-y-2">
            {pageItems.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <AdminListRow
                  title={p.title}
                  meta={`${p.submitter_name || 'Organizer'} · ${p.category || 'Event'}${
                    p.contact_email ? ` · ${p.contact_email}` : ''
                  }${p.location ? ` · ${p.location}` : ''}`}
                  onClick={() => setSelected(p)}
                  trailing={
                    <>
                      <AdminStatusPill tone={p.is_registered ? 'success' : 'warning'}>
                        {p.is_registered ? 'Registered' : 'Unregistered'}
                      </AdminStatusPill>
                      <AdminStatusPill
                        tone={
                          p.status === 'approved'
                            ? 'success'
                            : p.status === 'pending'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {p.status === 'approved'
                          ? '✓ Approved'
                          : p.status === 'pending'
                            ? 'Pending'
                            : 'Rejected'}
                      </AdminStatusPill>
                      <span className="hidden text-[11px] font-medium text-primary sm:inline">
                        View
                      </span>
                    </>
                  }
                />
                <div className="px-1">
                  <AdminAiInlineNote
                    label="AI review"
                    run={() =>
                      analyzeProposal({
                        title: p.title,
                        category: p.category,
                        description: p.description,
                        location: p.location,
                        submitter: p.submitter_name,
                        status: p.status,
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <AdminPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </AdminSectionPanel>

      <AdminProposalDetailDialog
        proposal={selectedLive}
        open={!!selectedLive}
        onClose={() => !statusMutation.isPending && setSelected(null)}
        busy={statusMutation.isPending}
        onApprove={(id, note) =>
          statusMutation.mutate({ id, next: 'approved', reason: note })
        }
        onReject={(id, reason) =>
          statusMutation.mutate({ id, next: 'rejected', reason })
        }
      />
    </div>
  );
};

export default ProposalManagement;
