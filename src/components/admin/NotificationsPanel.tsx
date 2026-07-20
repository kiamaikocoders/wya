import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  AdminPageShell,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { adminPlatformService } from '@/lib/admin-platform-service';

/**
 * Agribeta-style Notifications page: ops inbox + broadcast compose.
 * Push delivery uses OneSignal when configured (see System health).
 */
const NotificationsPanel: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'attendees' | 'organizers'>('all');
  const [sending, setSending] = useState(false);

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

  const pushStatus = healthQuery.data?.health.push ?? '—';
  const recent = (announcementsQuery.data ?? []).slice(0, 8);

  const sendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSending(true);
    try {
      const draft = await adminPlatformService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
      });
      await adminPlatformService.publishAnnouncement(draft.id);
      setTitle('');
      setBody('');
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
      subtitle="Push status · broadcast compose · recent platform notices"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            healthQuery.refetch();
            announcementsQuery.refetch();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminKpiTile
          label="Push"
          value={pushStatus}
          hint="OneSignal"
          tone={pushStatus === 'Healthy' ? 'green' : 'orange'}
        />
        <AdminKpiTile
          label="Announcements"
          value={String(announcementsQuery.data?.length ?? 0)}
          hint="Stored"
        />
        <AdminKpiTile
          label="Published"
          value={String(
            (announcementsQuery.data ?? []).filter((a) => a.status === 'published').length
          )}
          hint="Live"
        />
        <AdminKpiTile label="Channel" value="In-app + push" hint="When configured" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminSectionPanel
          title="Broadcast"
          description="Creates a platform announcement and publishes it to the chosen audience."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="attendees">Attendees</SelectItem>
                  <SelectItem value="organizers">Organizers</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="n-body">Body</Label>
              <Textarea
                id="n-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="What should people know?"
              />
            </div>
            <Button className="gap-2" disabled={sending} onClick={() => void sendBroadcast()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Publish notification
            </Button>
            <p className="text-xs text-muted-foreground">
              For richer announcement history, also use Communications. Templates stay there —
              same split as Agribeta staging.
            </p>
          </div>
        </AdminSectionPanel>

        <AdminSectionPanel title="Recent notices" description="Latest platform announcements.">
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
            <ul className="divide-y divide-border">
              {recent.map((row) => (
                <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {row.status} · {row.audience}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminSectionPanel>
      </div>
    </AdminPageShell>
  );
};

export default NotificationsPanel;
