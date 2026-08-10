import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Eye,
  History,
  Loader2,
  Mail,
  Megaphone,
  Pencil,
  Send,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminField,
  AdminKpiRow,
  AdminKpiTile,
  AdminOutlinePill,
  AdminPageShell,
  AdminPagination,
  AdminPrimaryPill,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminTextArea,
  AdminTextInput,
} from '@/components/admin/AdminPageShell';
import EmailSettingsPanel from '@/components/admin/EmailSettingsPanel';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { BroadcastLocationPicker } from '@/components/admin/BroadcastLocationPicker';
import {
  draftAnnouncementBody,
  improveEmailTemplateSubject,
} from '@/lib/admin-ai-analysis';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminPlatformService,
  getCommunicationTemplatesFromBundle,
  type AnnouncementAudience,
  type AnnouncementChannel,
  type CommunicationTemplate,
  type PlatformAnnouncement,
} from '@/lib/admin-platform-service';
import { useListPagination } from '@/hooks/use-list-pagination';
import { cn } from '@/lib/utils';
import { getPublicSiteOrigin } from '@/lib/site-origins';

type CommsTab = 'broadcast' | 'templates' | 'delivery' | 'provider';

const TABS: { id: CommsTab; label: string }[] = [
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'templates', label: 'Email templates' },
  { id: 'delivery', label: 'Delivery log' },
  { id: 'provider', label: 'Provider' },
];

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function channelLabel(ch?: string) {
  if (ch === 'email') return 'Email';
  if (ch === 'in_app') return 'In-app + push';
  return 'Email + in-app + push';
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /platform_announcements|communication_templates|email_send_log|does not exist|schema cache/i.test(
    msg
  );
}

const CommunicationsPanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CommsTab>('broadcast');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [locations, setLocations] = useState<string[]>([]);
  const [channel, setChannel] = useState<AnnouncementChannel>('both');
  const [link, setLink] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [templateCategory, setTemplateCategory] = useState<
    'all' | 'auth' | 'transactional' | 'marketing'
  >('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editTpl, setEditTpl] = useState<CommunicationTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTpl, setPreviewTpl] = useState<CommunicationTemplate | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testTemplateId, setTestTemplateId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminPlatformService.listAnnouncements(),
    retry: false,
  });

  const templatesQuery = useQuery({
    queryKey: ['admin-comm-templates'],
    queryFn: () => adminPlatformService.listCommunicationTemplates(),
    retry: false,
    enabled: tab === 'templates' || tab === 'broadcast',
  });

  const logQuery = useQuery({
    queryKey: ['admin-email-send-log'],
    queryFn: () => adminPlatformService.listEmailSendLog(100),
    retry: false,
    enabled: tab === 'delivery',
  });

  const items: PlatformAnnouncement[] = listQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const logs = logQuery.data ?? [];
  const schemaMissing = isSchemaMissing(listQuery.error);
  const templatesFromBundle =
    Boolean(templatesQuery.data?.length) && getCommunicationTemplatesFromBundle();

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'all') return templates;
    return templates.filter((t) => t.category === templateCategory);
  }, [templates, templateCategory]);

  const announcementsPaging = useListPagination(items);
  const templatesPaging = useListPagination(filteredTemplates, {
    resetKey: templateCategory,
  });
  const logsPaging = useListPagination(logs);

  const kpis = useMemo(() => {
    const sent = items.filter((r) => r.status === 'published').length;
    const drafts = items.filter((r) => r.status === 'draft').length;
    const recipients = items.reduce((n, r) => n + (r.recipient_count || 0), 0);
    const delivered = logs.filter((e) => e.status === 'sent').length;
    return {
      sent,
      drafts,
      recipients,
      templates: templates.length,
      delivered: tab === 'delivery' ? delivered : logs.length || delivered,
    };
  }, [items, templates.length, logs, tab]);

  const resetComposer = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setAudience('all');
    setLocations([]);
    setChannel('both');
    setLink('');
  };

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error('Subject and body are required');
      if (audience === 'location' && locations.length === 0) {
        throw new Error('Select at least one location');
      }
      if (editingId) {
        await adminPlatformService.updateAnnouncement(editingId, {
          title: title.trim(),
          body: body.trim(),
          audience,
          audience_locations: audience === 'location' ? locations : [],
          channel,
          link: link.trim() || undefined,
        });
        return editingId;
      }
      const row = await adminPlatformService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        audience_locations: audience === 'location' ? locations : [],
        channel,
        link: link.trim() || undefined,
      });
      return row.id;
    },
    onSuccess: () => {
      resetComposer();
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error('Subject and body are required');
      if (audience === 'location' && locations.length === 0) {
        throw new Error('Select at least one location');
      }
      let id = editingId;
      if (id) {
        await adminPlatformService.updateAnnouncement(id, {
          title: title.trim(),
          body: body.trim(),
          audience,
          audience_locations: audience === 'location' ? locations : [],
          channel,
          link: link.trim() || undefined,
        });
      } else {
        const row = await adminPlatformService.createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          audience,
          audience_locations: audience === 'location' ? locations : [],
          channel,
          link: link.trim() || undefined,
        });
        id = row.id;
      }
      await adminPlatformService.publishAnnouncement(id);
      return id;
    },
    onSuccess: () => {
      resetComposer();
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-send-log'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishRowMutation = useMutation({
    mutationFn: (id: number) => adminPlatformService.publishAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-send-log'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => adminPlatformService.archiveAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveTplMutation = useMutation({
    mutationFn: () => {
      if (!editTpl) throw new Error('No template');
      if (getCommunicationTemplatesFromBundle()) {
        throw new Error(
          'Save needs the communication_templates table. Run docs/sql/apply-communications-hub.sql in Supabase SQL Editor first.'
        );
      }
      return adminPlatformService.saveCommunicationTemplate({
        id: editTpl.id,
        subject: editSubject,
        html: editHtml,
      });
    },
    onSuccess: () => {
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-comm-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testTplMutation = useMutation({
    mutationFn: () => {
      if (!testTemplateId) throw new Error('No template');
      if (getCommunicationTemplatesFromBundle()) {
        throw new Error(
          'Test send needs the communication_templates table. Run docs/sql/apply-communications-hub.sql in Supabase SQL Editor first.'
        );
      }
      return adminPlatformService.testCommunicationTemplate({
        templateId: testTemplateId,
        to: testTo.trim(),
      });
    },
    onSuccess: () => {
      setTestOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-email-send-log'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEditAnnouncement = (row: PlatformAnnouncement) => {
    setEditingId(row.id);
    setTitle(row.title);
    setBody(row.body);
    setAudience(row.audience);
    setLocations(
      Array.isArray(row.audience_locations) ? [...row.audience_locations] : []
    );
    setChannel(row.channel || 'both');
    setLink(row.link || '');
    setTab('broadcast');
    toast.message('Loaded into editor');
  };

  const openTemplateEditor = (tpl: CommunicationTemplate) => {
    setEditTpl(tpl);
    setEditSubject(tpl.subject);
    setEditHtml(tpl.html);
    setEditOpen(true);
  };

  const withPreviewVars = (html: string) => {
    const site = getPublicSiteOrigin();
    const email = user?.email || 'you@example.com';
    // Dead / wrong production hosts baked into older templates — rewrite so
    // logo + hero images load from the public site during admin preview.
    let out = html
      .replace(/https?:\/\/(?:www\.)?whereyouat\.ke/gi, site)
      .replace(/https?:\/\/admin\.wya254\.com/gi, site)
      .replace(/https?:\/\/(?:www\.)?wya254\.com/gi, site);
    const pairs: Array<[RegExp, string]> = [
      [/\{\{\s*\.ConfirmationURL\s*\}\}/g, `${site}/auth/confirm?token=preview`],
      [/\{\{\s*\.SiteURL\s*\}\}/g, site],
      [/\{\{\s*\.Email\s*\}\}/g, email],
      [/\{\{\s*eventTitle\s*\}\}/g, 'Afrobeats Night'],
      [/\{\{\s*eventWhen\s*\}\}/g, 'Sat 8:00 PM'],
      [/\{\{\s*eventWhere\s*\}\}/g, 'Nairobi'],
      [/\{\{\s*ticketSummary\s*\}\}/g, '2× General'],
      [/\{\{\s*amountPaid\s*\}\}/g, 'KES 2,000'],
      [/\{\{\s*orderId\s*\}\}/g, 'ORD-PREVIEW'],
      [/\{\{\s*wasLabel\s*\}\}/g, 'Fri 7:00 PM'],
      [/\{\{\s*nowLabel\s*\}\}/g, 'Sat 8:00 PM'],
      [/\{\{\s*refundLabel\s*\}\}/g, 'Full refund · 3–5 days'],
      [/\{\{\s*link\s*\}\}/g, `${site}/events`],
      [/\{\{\s*userName\s*\}\}/g, 'there'],
      [/\{\{\s*whenLabel\s*\}\}/g, 'is tomorrow'],
      [/\{\{\s*title\s*\}\}/g, 'Announcement'],
      [/\{\{\s*message\s*\}\}/g, 'Preview message body.'],
    ];
    return pairs.reduce((acc, [re, v]) => acc.replace(re, v), out);
  };

  const busy = saveDraftMutation.isPending || broadcastMutation.isPending;

  return (
    <AdminPageShell
      title="Communications"
      subtitle="Broadcasts · email templates · delivery log"
      icon={Megaphone}
      actions={
        <>
          <AdminRefreshButton
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
              queryClient.invalidateQueries({ queryKey: ['admin-comm-templates'] });
              queryClient.invalidateQueries({ queryKey: ['admin-email-send-log'] });
            }}
          />
          {tab === 'broadcast' ? (
            <>
              <AdminOutlinePill disabled={busy || schemaMissing} onClick={() => saveDraftMutation.mutate()}>
                {saveDraftMutation.isPending ? 'Saving…' : 'Draft'}
              </AdminOutlinePill>
              <AdminPrimaryPill
                disabled={busy || schemaMissing}
                onClick={() => {
                  if (window.confirm('Broadcast now to the selected audience/channel?')) {
                    broadcastMutation.mutate();
                  }
                }}
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Broadcast'
                )}
              </AdminPrimaryPill>
            </>
          ) : null}
        </>
      }
    >
      <div className="mb-4 flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AdminKpiRow className="mb-4">
        <AdminKpiTile label="Sent" value={String(kpis.sent)} hint="Published broadcasts" />
        <AdminKpiTile label="Recipients" value={String(kpis.recipients)} hint="In-app reach" />
        <AdminKpiTile label="Drafts" value={String(kpis.drafts)} hint="Ready to send" />
        <AdminKpiTile
          label="Templates"
          value={String(kpis.templates)}
          hint={
            templatesFromBundle
              ? 'Bundled (DB pending)'
              : tab === 'delivery'
                ? `${kpis.delivered} logged`
                : 'Auth + product'
          }
        />
      </AdminKpiRow>

      {schemaMissing && tab === 'broadcast' ? (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Announcements schema missing</AlertTitle>
          <AlertDescription>
            Apply <code>communications_hub</code> / <code>admin_superadmin_platform</code> migrations.
          </AlertDescription>
        </Alert>
      ) : null}

      {tab === 'broadcast' && (
        <div className="space-y-4">
          <AdminSectionPanel title={editingId ? 'Edit announcement' : 'New announcement'}>
            <div className="max-w-3xl space-y-3.5">
              <div className="grid gap-3.5 md:grid-cols-2">
                <AdminField label="Audience">
                  <Select
                    value={audience}
                    onValueChange={(v) => setAudience(v as AnnouncementAudience)}
                  >
                    <SelectTrigger className="h-11 rounded-[14px] border-border bg-[hsl(var(--admin-surface))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="attendees">Attendees</SelectItem>
                      <SelectItem value="organizers">Organizers</SelectItem>
                      <SelectItem value="admins">Admins only</SelectItem>
                      <SelectItem value="location">Specific locations</SelectItem>
                    </SelectContent>
                  </Select>
                </AdminField>
                <AdminField label="Channel">
                  <Select
                    value={channel}
                    onValueChange={(v) => setChannel(v as AnnouncementChannel)}
                  >
                    <SelectTrigger className="h-11 rounded-[14px] border-border bg-[hsl(var(--admin-surface))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email only</SelectItem>
                      <SelectItem value="in_app">In-app (+ push)</SelectItem>
                      <SelectItem value="both">Email + in-app (+ push)</SelectItem>
                    </SelectContent>
                  </Select>
                </AdminField>
              </div>
              {audience === 'location' ? (
                <BroadcastLocationPicker value={locations} onChange={setLocations} />
              ) : null}
              <AdminField label="Subject">
                <AdminTextInput
                  value={title}
                  onChange={setTitle}
                  placeholder="Weekend lineup drop"
                />
              </AdminField>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Body</span>
                  <AdminAiWriteButton
                    disabled={!title.trim()}
                    needHint="Enter a subject first"
                    run={() =>
                      draftAnnouncementBody({
                        subject: title.trim(),
                        audience,
                        channel,
                        link: link.trim() || undefined,
                      })
                    }
                    onResult={setBody}
                  />
                </div>
                <AdminTextArea
                  value={body}
                  onChange={setBody}
                  rows={5}
                  placeholder="Short message body for email + in-app… or Write with AI"
                />
              </div>
              <AdminField label="Optional link">
                <AdminTextInput
                  value={link}
                  onChange={setLink}
                  placeholder="https://www.wya254.com/events/…"
                />
              </AdminField>
              {editingId ? (
                <Button type="button" variant="ghost" className="text-xs" onClick={resetComposer}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </AdminSectionPanel>

          <AdminSectionPanel title="Announcement history">
            {listQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No announcements yet. Draft or broadcast one above.
              </p>
            ) : (
              <div className="-mx-1 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-[11px] font-semibold text-muted-foreground">
                      <th className="px-3 py-2.5">ID</th>
                      <th className="px-3 py-2.5">Subject</th>
                      <th className="px-3 py-2.5">Audience</th>
                      <th className="px-3 py-2.5">Channel</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcementsPaging.pageItems.map((r) => (
                      <tr key={r.id} className="border-b border-border">
                        <td className="px-3 py-3 font-semibold">ANN-{String(r.id).padStart(2, '0')}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{r.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatWhen(r.created_at)}
                          </div>
                        </td>
                        <td className="px-3 py-3 capitalize text-muted-foreground">
                          {r.audience}
                          {r.audience === 'location' && r.audience_locations?.length
                            ? ` · ${r.audience_locations.slice(0, 2).join(', ')}${
                                r.audience_locations.length > 2 ? '…' : ''
                              }`
                            : ''}
                        </td>
                        <td className="px-3 py-3">{channelLabel(r.channel)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                              r.status === 'published' &&
                                'bg-[hsl(var(--admin-success)/0.15)] text-[hsl(var(--admin-success))]',
                              r.status === 'draft' &&
                                'bg-[hsl(var(--admin-warning)/0.15)] text-[hsl(var(--admin-warning))]',
                              r.status === 'archived' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {r.status === 'published' ? 'sent' : r.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openEditAnnouncement(r)}>
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            {r.status === 'draft' ? (
                              <Button
                                size="sm"
                                disabled={publishRowMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Publish this draft now?')) {
                                    publishRowMutation.mutate(r.id);
                                  }
                                }}
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Send
                              </Button>
                            ) : null}
                            {r.status !== 'archived' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={archiveMutation.isPending}
                                onClick={() => archiveMutation.mutate(r.id)}
                              >
                                Archive
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <AdminPagination
                  page={announcementsPaging.page}
                  totalPages={announcementsPaging.totalPages}
                  total={announcementsPaging.total}
                  pageSize={announcementsPaging.pageSize}
                  onPageChange={announcementsPaging.setPage}
                  className="mt-3 px-1"
                />
              </div>
            )}
          </AdminSectionPanel>
        </div>
      )}

      {tab === 'templates' && (
        <AdminSectionPanel
          title="Email templates"
          description="Edit Auth + transactional HTML. Auth templates still need a one-time paste into Supabase Auth for production delivery."
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', 'auth', 'transactional', 'marketing'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTemplateCategory(c)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  templateCategory === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {templatesFromBundle && templates.length > 0 ? (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Showing bundled templates</AlertTitle>
              <AlertDescription>
                The <code>communication_templates</code> table is not on your database yet.
                Preview works from the Figma catalog; apply{' '}
                <code>docs/sql/apply-communications-hub.sql</code> in the Supabase SQL Editor to
                enable save &amp; test from this page.
              </AlertDescription>
            </Alert>
          ) : null}

          {templatesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templatesQuery.isError ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Templates unavailable</AlertTitle>
              <AlertDescription>
                Apply the <code>communications_hub</code> migration to create{' '}
                <code>communication_templates</code>.
              </AlertDescription>
            </Alert>
          ) : filteredTemplates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No templates in this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-[11px] font-semibold text-muted-foreground">
                    <th className="w-[24%] px-3 py-2.5">Name</th>
                    <th className="w-[14%] px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Subject</th>
                    <th className="w-[280px] px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templatesPaging.pageItems.map((tpl) => (
                    <tr key={tpl.id} className="border-b border-border">
                      <td className="px-3 py-3 align-middle">
                        <div className="truncate font-medium">{tpl.name}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {tpl.id}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle capitalize text-muted-foreground">
                        {tpl.category}
                      </td>
                      <td className="px-3 py-3 align-middle text-muted-foreground">
                        <div className="truncate">{tpl.subject}</div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex flex-nowrap justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openTemplateEditor(tpl)}>
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewTpl(tpl);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setTestTemplateId(tpl.id);
                              setTestTo(user?.email || '');
                              setTestOpen(true);
                            }}
                          >
                            <Mail className="mr-1 h-3 w-3" />
                            Test
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AdminPagination
                page={templatesPaging.page}
                totalPages={templatesPaging.totalPages}
                total={templatesPaging.total}
                pageSize={templatesPaging.pageSize}
                onPageChange={templatesPaging.setPage}
                className="mt-3"
              />
            </div>
          )}
        </AdminSectionPanel>
      )}

      {tab === 'delivery' && (
        <AdminSectionPanel
          title="Delivery log"
          description="Recent Resend sends from email_send_log (tests, broadcasts, transactional)."
        >
          {logQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logQuery.isError ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Delivery log unavailable</AlertTitle>
              <AlertDescription>
                Apply the <code>email_transactional_system</code> migration for{' '}
                <code>email_send_log</code>.
              </AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sends logged yet. Run a template test or broadcast with email channel.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-[11px] font-semibold text-muted-foreground">
                    <th className="px-3 py-2.5">When</th>
                    <th className="px-3 py-2.5">Template</th>
                    <th className="px-3 py-2.5">Recipient</th>
                    <th className="px-3 py-2.5">Subject</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logsPaging.pageItems.map((row) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatWhen(row.created_at)}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{row.template_id}</td>
                      <td className="px-3 py-3">{row.to_email}</td>
                      <td className="px-3 py-3 text-muted-foreground">{row.subject}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            row.status === 'sent' &&
                              'bg-[hsl(var(--admin-success)/0.15)] text-[hsl(var(--admin-success))]',
                            row.status === 'error' && 'bg-destructive/15 text-destructive',
                            row.status === 'skipped' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {row.status}
                        </span>
                        {row.error ? (
                          <div className="mt-1 max-w-[220px] truncate text-[10px] text-destructive">
                            {row.error}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AdminPagination
                page={logsPaging.page}
                totalPages={logsPaging.totalPages}
                total={logsPaging.total}
                pageSize={logsPaging.pageSize}
                onPageChange={logsPaging.setPage}
                className="mt-3"
              />
            </div>
          )}
        </AdminSectionPanel>
      )}

      {tab === 'provider' && (
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            Resend provider settings (merged from Email)
          </div>
          <EmailSettingsPanel embedded />
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit template — {editTpl?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-muted-foreground">Subject</label>
                <AdminAiWriteButton
                  label="Improve subject"
                  disabled={!editSubject.trim()}
                  needHint="Enter a subject first"
                  run={() =>
                    improveEmailTemplateSubject({
                      name: editTpl?.name || 'Email',
                      currentSubject: editSubject,
                      description: editTpl?.description,
                    })
                  }
                  onResult={setEditSubject}
                />
              </div>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">HTML</label>
              <Textarea
                className="min-h-[280px] font-mono text-xs"
                value={editHtml}
                onChange={(e) => setEditHtml(e.target.value)}
              />
            </div>
            {editTpl?.description ? (
              <p className="text-xs text-muted-foreground">{editTpl.description}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saveTplMutation.isPending} onClick={() => saveTplMutation.mutate()}>
              {saveTplMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview — {previewTpl?.name}</DialogTitle>
          </DialogHeader>
          <iframe
            title="template-preview"
            className="h-[420px] w-full rounded-lg border border-border bg-white"
            srcDoc={previewTpl ? withPreviewVars(previewTpl.html) : ''}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send test
              {testTemplateId ? ` — ${templates.find((t) => t.id === testTemplateId)?.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Recipient email
            </label>
            <Input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={testTplMutation.isPending || !testTo.includes('@')}
              onClick={() => testTplMutation.mutate()}
            >
              {testTplMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send test'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
};

export default CommunicationsPanel;
