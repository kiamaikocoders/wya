import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, History, Loader2, Megaphone, PenLine, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminPanelHeader,
  AdminSectionLayout,
  useAdminSectionTab,
  type AdminSubnavItem,
} from '@/components/admin/AdminSubnavLayout';
import {
  adminPlatformService,
  type AnnouncementAudience,
  type PlatformAnnouncement,
} from '@/lib/admin-platform-service';

type CommsTab = 'compose' | 'history';

const COMMS_NAV: AdminSubnavItem[] = [
  { id: 'compose', label: 'Compose', icon: PenLine },
  { id: 'history', label: 'History', icon: History },
];

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /platform_announcements|does not exist|schema cache/i.test(msg);
}

const CommunicationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [active, setActive] = useAdminSectionTab<CommsTab>(
    COMMS_NAV as { id: CommsTab }[],
    'compose'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [link, setLink] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminPlatformService.listAnnouncements(),
    retry: false,
    enabled: active === 'history',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminPlatformService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        link: link.trim() || undefined,
      }),
    onSuccess: () => {
      setTitle('');
      setBody('');
      setLink('');
      setAudience('all');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setActive('history');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => adminPlatformService.publishAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => adminPlatformService.archiveAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const items: PlatformAnnouncement[] = listQuery.data ?? [];
  const schemaMissing = isSchemaMissing(listQuery.error);

  return (
    <AdminSectionLayout
      title="Communications"
      subtitle="Compose a broadcast or review announcement history"
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
      items={COMMS_NAV}
      active={active}
      onChange={(id) => setActive(id as CommsTab)}
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Announcements table missing</AlertTitle>
          <AlertDescription>
            Apply <code>admin_superadmin_platform</code> after the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {active === 'compose' && (
        <>
          <AdminPanelHeader
            title="Compose"
            description="Saved as draft first — publish from History when ready."
          />
          <div className="max-w-2xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekend maintenance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-body">Message</Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="What should users know?"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="attendees">Attendees</SelectItem>
                    <SelectItem value="organizers">Organizers</SelectItem>
                    <SelectItem value="admins">Admins only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-link">Optional link</Label>
                <Input
                  id="ann-link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/events"
                />
              </div>
            </div>
            <Button
              className="gap-2"
              disabled={
                schemaMissing || createMutation.isPending || !title.trim() || !body.trim()
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Megaphone className="h-4 w-4" />
              )}
              Save draft
            </Button>
          </div>
        </>
      )}

      {active === 'history' && (
        <>
          <AdminPanelHeader
            title="History"
            description="Draft, publish, and archive platform announcements."
          />
          {listQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No announcements yet</CardTitle>
                <CardDescription>
                  <Button variant="link" className="px-0" onClick={() => setActive('compose')}>
                    Compose one
                  </Button>
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {items.map((row) => (
                <li key={row.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base">{row.title}</CardTitle>
                          <CardDescription>
                            {formatWhen(row.created_at)} · {row.audience}
                            {row.published_at ? ` · published ${formatWhen(row.published_at)}` : ''}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {row.status}
                          </Badge>
                          {row.status === 'draft' ? (
                            <Button
                              size="sm"
                              disabled={publishMutation.isPending}
                              onClick={() => {
                                if (window.confirm('Publish and notify users now?')) {
                                  publishMutation.mutate(row.id);
                                }
                              }}
                            >
                              Publish
                            </Button>
                          ) : null}
                          {row.status !== 'archived' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={archiveMutation.isPending}
                              onClick={() => archiveMutation.mutate(row.id)}
                            >
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {row.body}
                      {row.link ? (
                        <div className="mt-2 font-mono text-xs">Link: {row.link}</div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AdminSectionLayout>
  );
};

export default CommunicationsPanel;
