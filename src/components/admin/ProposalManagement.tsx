import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminFilterSelect,
  AdminListRow,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';

type ProposalRow = {
  id: number;
  title: string;
  category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  submitter_name?: string;
};

const ProposalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const proposalsQuery = useQuery({
    queryKey: ['admin-proposals-figma'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, category, status, submitted_by')
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

      return (data || []).map((p) => ({
        ...p,
        status: (p.status as ProposalRow['status']) || 'pending',
        submitter_name: p.submitted_by ? nameMap.get(p.submitted_by) : 'Unknown',
      })) as ProposalRow[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, next }: { id: number; next: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('proposals').update({ status: next }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.next === 'approved' ? 'Proposal approved' : 'Proposal rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-proposals-figma'] });
    },
    onError: (e: Error) => toast.error(e.message),
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
        (p.submitter_name || '').toLowerCase().includes(q)
      );
    });
  }, [proposalsQuery.data, search, status]);

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

      <AdminSectionPanel title="Pending proposals">
        {proposalsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No proposals found.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <AdminListRow
                key={p.id}
                title={p.title}
                meta={`${p.submitter_name || 'Organizer'} · ${p.category || 'Event'}`}
                trailing={
                  <>
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
                    {p.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                          onClick={() => statusMutation.mutate({ id: p.id, next: 'approved' })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                          onClick={() => statusMutation.mutate({ id: p.id, next: 'rejected' })}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </>
                }
              />
            ))}
          </div>
        )}
      </AdminSectionPanel>
    </div>
  );
};

export default ProposalManagement;
