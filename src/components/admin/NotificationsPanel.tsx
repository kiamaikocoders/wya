import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, Inbox, Loader2, Megaphone, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminKpiTile,
  AdminListRow,
  AdminOutlinePill,
  AdminPageShell,
  AdminPrimaryPill,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { useAdminSectionTab } from '@/components/admin/AdminSubnavLayout';
import {
  adminPlatformService,
  type AnnouncementAudience,
  type AnnouncementChannel,
} from '@/lib/admin-platform-service';
import { playNotificationSound } from '@/lib/sounds';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { BroadcastLocationPicker } from '@/components/admin/BroadcastLocationPicker';
import { draftNotificationBody } from '@/lib/admin-ai-analysis';
import { useAuth } from '@/contexts/AuthContext';
import {
  notificationService,
  notificationsQueryKey,
} from '@/lib/notification/notification-service';
import type { Notification } from '@/lib/notification/types';
import { cn } from '@/lib/utils';

const NOTIF_TABS = [
  { id: 'inbox' as const, label: 'Inbox' },
  { id: 'broadcast' as const, label: 'Broadcast' },
];

type NotifTab = (typeof NOTIF_TABS)[number]['id'];

function notificationMeta(n: Notification): string {
  const when = formatDistanceToNow(parseISO(n.created_at), { addSuffix: true });
  return `${n.type.replace(/_/g, ' ')} · ${when}`;
}

function NotificationsModuleTabs({
  active,
  onChange,
  unreadCount,
}: {
  active: NotifTab;
  onChange: (tab: NotifTab) => void;
  unreadCount: number;
}) {
  return (
    <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-[10px] bg-[hsl(var(--admin-surface))] p-1">
      {NOTIF_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors',
            active === tab.id
              ? 'border border-primary bg-[hsl(var(--admin-surface-2))] font-semibold text-primary'
              : 'border border-transparent font-medium text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.id === 'inbox' ? (
            <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {tab.label}
          {tab.id === 'inbox' && unreadCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Admin notifications: personal inbox (matches header bell) + platform broadcast compose.
 */
const NotificationsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useAdminSectionTab<NotifTab>(NOTIF_TABS, 'inbox');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [locations, setLocations] = useState<string[]>([]);
  const [channel, setChannel] = useState<AnnouncementChannel>('both');
  const [sending, setSending] = useState(false);

  const inboxQuery = useQuery({
    queryKey: notificationsQueryKey(user?.id),
    queryFn: () => (user ? notificationService.getUserNotifications(user.id) : []),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  const healthQuery = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminPlatformService.getSystemHealth(),
    retry: false,
  });

  const announcementsQuery = useQuery({
    queryKey: ['admin-announcements-lite'],
    queryFn: () => adminPlatformService.listAnnouncements(),
    retry: false,
  });

  const notifications = inboxQuery.data ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const pushStatus = healthQuery.data?.health.push ?? '—';
  const recent = (announcementsQuery.data ?? []).slice(0, 8);

  const invalidateInbox = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
  };

  const markOne = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      invalidateInbox();
    },
    onError: () => toast.error('Could not mark notification as read'),
  });

  const markAll = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Not signed in');
      return notificationService.markAllAsRead(user.id);
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      invalidateInbox();
    },
    onError: () => toast.error('Could not mark all as read'),
  });

  const openNotification = async (n: Notification) => {
    if (!n.read) {
      try {
        await markOne.mutateAsync(n.id);
      } catch {
        /* toast handled */
      }
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const sendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    if (audience === 'location' && locations.length === 0) {
      toast.error('Select at least one location');
      return;
    }
    setSending(true);
    try {
      const draft = await adminPlatformService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        audience_locations: audience === 'location' ? locations : [],
        channel,
      });
      await adminPlatformService.publishAnnouncement(draft.id);
      setTitle('');
      setBody('');
      setLocations([]);
      setAudience('all');
      setChannel('both');
      announcementsQuery.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPageShell
      title="Notifications"
      subtitle={
        tab === 'inbox'
          ? 'Your admin inbox · same count as the header bell'
          : 'Push status · broadcast compose · recent platform notices'
      }
      icon={Bell}
      subnav={
        <NotificationsModuleTabs
          active={tab}
          onChange={setTab}
          unreadCount={unreadCount}
        />
      }
      actions={
        <>
          {tab === 'inbox' && unreadCount > 0 ? (
            <AdminOutlinePill
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </AdminOutlinePill>
          ) : null}
          {tab === 'broadcast' ? (
            <AdminOutlinePill
              onClick={() => {
                playNotificationSound();
                toast.success('Playing notification chime');
              }}
            >
              Test chime
            </AdminOutlinePill>
          ) : null}
          <AdminRefreshButton
            onClick={() => {
              inboxQuery.refetch();
              healthQuery.refetch();
              announcementsQuery.refetch();
            }}
          />
        </>
      }
    >
      {tab === 'inbox' ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <AdminKpiTile label="Unread" value={String(unreadCount)} hint="In your inbox" />
            <AdminKpiTile
              label="Total"
              value={String(notifications.length)}
              hint="All time (loaded)"
            />
            <AdminKpiTile
              label="Push"
              value={pushStatus === 'Healthy' ? 'Ready' : pushStatus}
              hint="Delivery"
              tone={pushStatus === 'Healthy' ? 'green' : 'orange'}
            />
            <AdminKpiTile label="Channel" value="In-app + push" hint="Dual delivery" />
          </div>

          <AdminSectionPanel
            title="Inbox"
            description="Proposals, feedback, system actions, and anything addressed to your admin account."
          >
            {inboxQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : inboxQuery.isError ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Could not load notifications.{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => void inboxQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8" />
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <AdminListRow
                    key={n.id}
                    title={n.title}
                    meta={`${notificationMeta(n)}${n.message ? ` · ${n.message}` : ''}`}
                    onClick={() => void openNotification(n)}
                    trailing={
                      n.read ? (
                        <AdminStatusPill tone="muted">Read</AdminStatusPill>
                      ) : (
                        <AdminStatusPill tone="primary">Unread</AdminStatusPill>
                      )
                    }
                    className={!n.read ? 'border border-primary/30' : undefined}
                  />
                ))}
              </div>
            )}
          </AdminSectionPanel>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <AdminKpiTile
              label="Push"
              value={pushStatus === 'Healthy' ? 'Ready' : pushStatus}
              hint="FCM configured"
              tone={pushStatus === 'Healthy' ? 'green' : 'orange'}
            />
            <AdminKpiTile
              label="Announcements"
              value={String(announcementsQuery.data?.length ?? 0)}
              hint="All time"
            />
            <AdminKpiTile
              label="Published"
              value={String(
                (announcementsQuery.data ?? []).filter((a) => a.status === 'published').length
              )}
              hint="Visible now"
            />
            <AdminKpiTile
              label="Channel"
              value={channel === 'both' ? 'Email + in-app' : channel}
              hint="Push with in-app"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminSectionPanel
              title="Broadcast"
              description="In-app + email + push to the chosen audience (push when OneSignal is configured)."
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select
                      value={audience}
                      onValueChange={(v) => setAudience(v as AnnouncementAudience)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        <SelectItem value="attendees">Attendees</SelectItem>
                        <SelectItem value="organizers">Organizers</SelectItem>
                        <SelectItem value="location">Specific locations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={channel}
                      onValueChange={(v) => setChannel(v as AnnouncementChannel)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Email + in-app (+ push)</SelectItem>
                        <SelectItem value="in_app">In-app (+ push)</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {audience === 'location' ? (
                  <BroadcastLocationPicker value={locations} onChange={setLocations} />
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="n-title">Title</Label>
                  <Input
                    id="n-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short headline"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="n-body">Body</Label>
                    <AdminAiWriteButton
                      disabled={!title.trim()}
                      needHint="Enter a title first"
                      run={() =>
                        draftNotificationBody({
                          title: title.trim(),
                          audience,
                        })
                      }
                      onResult={setBody}
                    />
                  </div>
                  <Textarea
                    id="n-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="What should people know? or Write with AI"
                  />
                </div>
                <AdminPrimaryPill disabled={sending} onClick={() => void sendBroadcast()}>
                  {sending ? 'Publishing…' : 'Publish notification'}
                </AdminPrimaryPill>
              </div>
            </AdminSectionPanel>

            <AdminSectionPanel title="Recent notices">
              {announcementsQuery.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Volume2 className="h-8 w-8" />
                  No announcements yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((row) => (
                    <AdminListRow
                      key={row.id}
                      title={row.title}
                      meta={`${row.status} · ${row.audience}${
                        row.audience === 'location' && row.audience_locations?.length
                          ? ` (${row.audience_locations.slice(0, 3).join(', ')}${
                              row.audience_locations.length > 3 ? '…' : ''
                            })`
                          : ''
                      }`}
                      trailing={<AdminStatusPill tone="primary">{row.status}</AdminStatusPill>}
                    />
                  ))}
                </div>
              )}
            </AdminSectionPanel>
          </div>
        </>
      )}
    </AdminPageShell>
  );
};

export default NotificationsPanel;
