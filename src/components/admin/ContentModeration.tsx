import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminListRow,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import {
  contentModerationService,
  type MediaModerationItem,
  type TextModerationPost,
} from '@/lib/content-moderation-service';

const ContentModeration: React.FC = () => {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState<string>('');

  const eventsQuery = useQuery({
    queryKey: ['admin-moderation-events'],
    queryFn: () => contentModerationService.listEvents(),
  });

  useEffect(() => {
    if (!eventId && eventsQuery.data?.[0]) {
      setEventId(String(eventsQuery.data[0].id));
    }
  }, [eventsQuery.data, eventId]);

  const queueQuery = useQuery({
    queryKey: ['admin-moderation-queue', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const id = Number(eventId);
      const [text, media] = await Promise.all([
        contentModerationService.fetchTextModerationQueue(id),
        contentModerationService.fetchMediaModerationQueue(id),
      ]);
      return { text, media };
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      kind,
      id,
      status,
    }: {
      kind: 'story' | 'forum_post';
      id: number;
      status: 'verified' | 'archived';
    }) => {
      if (kind === 'story') {
        await contentModerationService.setStoryModerationStatus(id, status);
      } else {
        await contentModerationService.setForumPostModerationStatus(id, status);
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === 'verified' ? 'Approved' : 'Removed');
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const text = queueQuery.data?.text ?? [];
    const media = queueQuery.data?.media ?? [];
    const mappedText = text.map((p: TextModerationPost) => {
      let ago = 'recently';
      try {
        ago = formatDistanceToNow(parseISO(p.created_at), { addSuffix: true });
      } catch {
        // ignore
      }
      return {
        key: `text-${p.id}`,
        kind: 'forum_post' as const,
        sourceId: p.id,
        title: (p.title || p.content || 'Forum post').slice(0, 90),
        meta: `Reported by ${p.user_name} · ${ago}`,
      };
    });
    const mappedMedia = media.map((m: MediaModerationItem) => {
      let ago = 'recently';
      try {
        ago = formatDistanceToNow(parseISO(m.createdAt), { addSuffix: true });
      } catch {
        // ignore
      }
      return {
        key: m.compositeId,
        kind: m.source,
        sourceId: m.sourceId,
        title: m.label.slice(0, 90),
        meta: `Reported by ${m.userName} · ${ago}`,
      };
    });
    return [...mappedText, ...mappedMedia];
  }, [queueQuery.data]);

  const eventOptions = useMemo(
    () =>
      (eventsQuery.data || []).map((e) => ({
        value: String(e.id),
        label: e.title,
      })),
    [eventsQuery.data]
  );

  return (
    <div className="space-y-3.5">
      <AdminFilterSelect
        value={eventId}
        onChange={setEventId}
        options={eventOptions.length ? eventOptions : [{ value: '', label: 'Loading events…' }]}
        className="max-w-xs"
      />

      <AdminSectionPanel title="Flagged posts">
        {queueQuery.isLoading || eventsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !rows.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No flagged content awaiting review.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((item) => (
              <AdminListRow
                key={item.key}
                title={item.title}
                meta={item.meta}
                trailing={
                  <>
                    <AdminStatusPill tone="warning">Reported</AdminStatusPill>
                    <button
                      type="button"
                      className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                      onClick={() =>
                        actionMutation.mutate({
                          kind: item.kind,
                          id: item.sourceId,
                          status: 'verified',
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                      onClick={() =>
                        actionMutation.mutate({
                          kind: item.kind,
                          id: item.sourceId,
                          status: 'archived',
                        })
                      }
                    >
                      Remove
                    </button>
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

export default ContentModeration;
