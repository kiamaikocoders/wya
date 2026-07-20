import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminListRow,
  AdminOutlinePill,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import {
  feedbackService,
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from '@/lib/feedback-service';

const AdminFeedbackPanel: React.FC<{ hideTitle?: boolean }> = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-app-feedback', filter],
    queryFn: () => feedbackService.listForAdmin(filter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      feedbackService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.remove(id),
    onSuccess: () => {
      toast.success('Feedback removed');
      queryClient.invalidateQueries({ queryKey: ['admin-app-feedback'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

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

      <AdminSectionPanel title="Messages">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
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
                <AdminListRow
                  key={item.id}
                  title={name}
                  meta={`${item.message.slice(0, 120)}${item.message.length > 120 ? '…' : ''} · ${item.page_path || '/'} · ${when}`}
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
                      <AdminStatusPill tone="muted">{item.category}</AdminStatusPill>
                      {item.status === 'new' ? (
                        <button
                          type="button"
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium"
                          onClick={() => updateMutation.mutate({ id: item.id, status: 'read' })}
                        >
                          Mark read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        Delete
                      </button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </AdminSectionPanel>
    </div>
  );
};

export default AdminFeedbackPanel;
