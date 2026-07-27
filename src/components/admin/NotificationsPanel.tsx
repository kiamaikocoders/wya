import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Loader2, Volume2 } from 'lucide-react';
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
  AdminListRow,
  AdminOutlinePill,
  AdminPageShell,
  AdminPrimaryPill,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminPlatformService } from '@/lib/admin-platform-service';
import { playNotificationSound } from '@/lib/sounds';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { draftNotificationBody } from '@/lib/admin-ai-analysis';

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
      icon={Bell}
      actions={
        <>
          <AdminOutlinePill
            onClick={() => {
              playNotificationSound();
              toast.success('Playing notification chime');
            }}
          >
            Test chime
          </AdminOutlinePill>
          <AdminRefreshButton
            onClick={() => {
              healthQuery.refetch();
              announcementsQuery.refetch();
            }}
          />
        </>
      }
    >
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
        <AdminKpiTile label="Channel" value="In-app + push" hint="Dual delivery" />
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
                  meta={`${row.status} · ${row.audience}`}
                  trailing={<AdminStatusPill tone="primary">{row.status}</AdminStatusPill>}
                />
              ))}
            </div>
          )}
        </AdminSectionPanel>
      </div>
    </AdminPageShell>
  );
};

export default NotificationsPanel;
