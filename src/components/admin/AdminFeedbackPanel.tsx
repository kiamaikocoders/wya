import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, MessageSquarePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  feedbackService,
  FEEDBACK_STATUSES,
  type FeedbackStatus,
  type AppFeedbackWithProfile,
} from '@/lib/feedback-service';
function formatWhen(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function statusVariant(s: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (s === 'new') return 'default';
  if (s === 'read') return 'secondary';
  return 'outline';
}

const AdminFeedbackPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-app-feedback', filter],
    queryFn: () => feedbackService.listForAdmin(filter),
  });

  const sorted = useMemo(() => items, [items]);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">App feedback</h1>
          <p className="text-muted-foreground text-sm">
            Messages from signed-in users (not event surveys).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as FeedbackStatus | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {FEEDBACK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <MessageSquarePlus className="mx-auto h-10 w-10 text-muted-foreground" />
            <CardTitle>No feedback yet</CardTitle>
            <CardDescription>Submissions will show up here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-4">
          {sorted.map((row: AppFeedbackWithProfile) => {
            const p = row.profiles;
            const label = p?.full_name || p?.username || 'User';
            const initials =
              (p?.full_name || p?.username || '?')
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || '?';

            return (
              <li key={row.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={p?.avatar_url ?? undefined} alt="" />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-semibold">{label}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {p?.username ? `@${p.username} · ` : ''}
                            {formatWhen(row.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(row.status)} className="capitalize">
                          {row.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {row.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{row.message}</p>
                    {row.page_path && (
                      <p className="text-xs text-muted-foreground">
                        Page:{' '}
                        <span className="font-mono break-all">{row.page_path}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      <span className="text-sm text-muted-foreground self-center">Set status</span>
                      {FEEDBACK_STATUSES.map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={row.status === s ? 'default' : 'outline'}
                          disabled={updateMutation.isPending}
                          className="capitalize"
                          onClick={() => updateMutation.mutate({ id: row.id, status: s })}
                        >
                          {s}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm('Delete this feedback permanently?')) {
                            deleteMutation.mutate(row.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminFeedbackPanel;
