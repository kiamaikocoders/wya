import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminListRow,
  AdminOutlinePill,
  AdminPagination,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { AdminAiInsightPanel, AdminAiInlineNote } from '@/components/admin/AdminAiAssist';
import { AdminFeedbackDetailDialog } from '@/components/admin/AdminFeedbackDetailDialog';
import { clusterFeedbackThemes, draftFeedbackReply } from '@/lib/admin-ai-analysis';
import {
  feedbackService,
  FEEDBACK_STATUSES,
  type AppFeedbackWithProfile,
  type FeedbackStatus,
} from '@/lib/feedback-service';
import { useListPagination } from '@/hooks/use-list-pagination';

const CATEGORY_SHORT: Record<string, string> = {
  bug: 'Bug',
  idea: 'Idea',
  general: 'General',
  other: 'Other',
};

const AdminFeedbackPanel: React.FC<{ hideTitle?: boolean }> = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  const [selected, setSelected] = useState<AppFeedbackWithProfile | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-app-feedback', filter],
    queryFn: () => feedbackService.listForAdmin(filter),
  });

  const {
    page,
    setPage,
    pageItems,
    totalPages,
    total,
    pageSize,
  } = useListPagination(items, { resetKey: filter });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      feedbackService.updateStatus(id, status),
    onSuccess: (_d, vars) => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback-new-count'] });
      setSelected((prev) => (prev && prev.id === vars.id ? { ...prev, status: vars.status } : prev));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.remove(id),
    onSuccess: () => {
      toast.success('Feedback removed');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback-new-count'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedLive = useMemo(() => {
    if (!selected) return null;
    return items.find((i) => i.id === selected.id) ?? selected;
  }, [items, selected]);

  const busy = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap gap-1.5">
        <AdminOutlinePill active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </AdminOutlinePill>
        {FEEDBACK_STATUSES.map((s) => (
          <AdminOutlinePill key={s} active={filter === s} onClick={() => setFilter(s)}>
            {s}
          </AdminOutlinePill>
        ))}
      </div>

      <AdminAiInsightPanel
        title="Feedback themes"
        description="Cluster current messages into themes and suggested actions."
        buttonLabel="Analyze themes"
        emptyHint={
          items.length
            ? 'Generate themes from the feedback in this filter.'
            : 'No feedback to analyze yet.'
        }
        run={async () => {
          if (!items.length) throw new Error('No feedback to analyze yet');
          return clusterFeedbackThemes(
            items.map((item) => ({
              category: item.category,
              message: item.message,
              status: item.status,
            }))
          );
        }}
      />

      <AdminSectionPanel
        title="Messages"
        description="Open a message to read the full feedback and update status."
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="space-y-2">
            {pageItems.map((item) => {
              const name =
                item.profiles?.full_name?.trim() ||
                item.profiles?.username?.trim() ||
                'User';
              let when = 'just now';
              try {
                when = formatDistanceToNow(parseISO(item.created_at), { addSuffix: false });
              } catch {
                // ignore
              }
              return (
                <div key={item.id} className="space-y-1.5">
                  <AdminListRow
                    title={name}
                    meta={`${item.message.slice(0, 120)}${item.message.length > 120 ? '…' : ''} · ${item.page_path || '/'} · ${when}`}
                    onClick={() => setSelected(item)}
                    trailing={
                      <>
                        <AdminStatusPill
                          tone={
                            item.status === 'new'
                              ? 'primary'
                              : item.status === 'read'
                                ? 'muted'
                                : 'success'
                          }
                        >
                          {item.status}
                        </AdminStatusPill>
                        <AdminStatusPill tone="muted">
                          {CATEGORY_SHORT[item.category] || item.category}
                        </AdminStatusPill>
                        <span className="hidden text-[11px] font-medium text-primary sm:inline">
                          View
                        </span>
                      </>
                    }
                  />
                  <div className="px-1">
                    <AdminAiInlineNote
                      label="Draft reply"
                      run={() =>
                        draftFeedbackReply({
                          message: item.message,
                          category: item.category,
                          name,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
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

      <AdminFeedbackDetailDialog
        feedback={selectedLive}
        open={!!selectedLive}
        onClose={() => !busy && setSelected(null)}
        busy={busy}
        onUpdateStatus={(id, status) => updateMutation.mutate({ id, status })}
        onDelete={(id) => {
          if (window.confirm('Delete this feedback permanently?')) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
};

export default AdminFeedbackPanel;
