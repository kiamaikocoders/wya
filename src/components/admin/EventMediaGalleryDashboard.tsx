import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminOutlinePill,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminEventMediaService } from '@/lib/admin-event-media-service';
import {
  buildPublicEventMediaGalleryPath,
  createEventMediaShareLink,
  fetchEventOrganizerHint,
} from '@/lib/event-media-share';
import { getPublicSiteOrigin } from '@/lib/site-origins';
import { GalleryVideo } from '@/components/event-media/GalleryVideo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const EventMediaGalleryDashboard: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [emailOrganizer, setEmailOrganizer] = useState(true);
  const [extraEmails, setExtraEmails] = useState('');
  const [expiresDays, setExpiresDays] = useState('30');
  const [message, setMessage] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['admin-event-media-events'],
    queryFn: () => adminEventMediaService.listEvents(),
  });

  const mediaQuery = useQuery({
    queryKey: ['admin-event-media', selectedEventId],
    queryFn: () => adminEventMediaService.fetchMediaForEvent(Number(selectedEventId)),
    enabled: !!selectedEventId,
  });

  const organizerQuery = useQuery({
    queryKey: ['admin-event-media-organizer', selectedEventId],
    queryFn: () => fetchEventOrganizerHint(Number(selectedEventId)),
    enabled: !!selectedEventId && shareOpen,
  });

  const filteredEvents = useMemo(() => {
    const list = eventsQuery.data || [];
    if (!eventSearch.trim()) return list;
    const q = eventSearch.toLowerCase();
    return list.filter((e) => e.title.toLowerCase().includes(q));
  }, [eventsQuery.data, eventSearch]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((e) => String(e.id) === selectedEventId) ?? null,
    [filteredEvents, selectedEventId]
  );

  // Auto-select first event
  React.useEffect(() => {
    if (!selectedEventId && filteredEvents[0]) {
      setSelectedEventId(String(filteredEvents[0].id));
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (!shareOpen) return;
    setExtraEmails('');
    setExpiresDays('30');
    setMessage('');
  }, [shareOpen, selectedEventId]);

  useEffect(() => {
    if (!shareOpen || organizerQuery.isLoading) return;
    setEmailOrganizer(Boolean(organizerQuery.data));
  }, [shareOpen, organizerQuery.isLoading, organizerQuery.data]);

  const summary = mediaQuery.data;
  const items = useMemo(() => {
    const all = summary?.items || [];
    if (mediaFilter === 'photos') return all.filter((i) => i.mediaType === 'image');
    if (mediaFilter === 'videos') return all.filter((i) => i.mediaType === 'video');
    return all;
  }, [summary, mediaFilter]);

  const mediaSummaryLabel = useMemo(() => {
    if (!summary) return '';
    const parts: string[] = [];
    if (summary.photos) parts.push(`${summary.photos} photo${summary.photos === 1 ? '' : 's'}`);
    if (summary.videos) parts.push(`${summary.videos} video${summary.videos === 1 ? '' : 's'}`);
    return parts.join(' · ') || `${summary.total} item${summary.total === 1 ? '' : 's'}`;
  }, [summary]);

  const openShare = () => {
    if (!selectedEventId) return;
    setShareOpen(true);
  };

  const handleEmailShare = async () => {
    if (!selectedEventId) return;
    const extras = extraEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!emailOrganizer && extras.length === 0) {
      toast.error('Add at least one recipient, or email the organizer.');
      return;
    }

    const days = Math.min(365, Math.max(1, Number.parseInt(expiresDays, 10) || 30));
    setShareBusy(true);
    try {
      const result = await createEventMediaShareLink(Number(selectedEventId), {
        expiresInDays: days,
        recipientEmails: extras,
        emailOrganizer,
        mediaSummary: mediaSummaryLabel || undefined,
        message: message.trim() || undefined,
      });

      if (result.emailsSent?.length) {
        toast.success('Gallery emailed', {
          description: `Sent to ${result.emailsSent.join(', ')}. Valid until ${format(
            new Date(result.expiresAt),
            'MMM d, yyyy'
          )}.`,
        });
      } else {
        toast.warning('Link created, but no email was sent', {
          description:
            result.emailErrors?.join('; ') ||
            'Check recipient email / Resend settings.',
        });
      }
      if (result.emailErrors?.length && result.emailsSent?.length) {
        toast.warning(`Some emails failed: ${result.emailErrors.join('; ')}`);
      }
      setShareOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not share gallery');
    } finally {
      setShareBusy(false);
    }
  };

  const handleCopyOnly = async () => {
    if (!selectedEventId) return;
    const days = Math.min(365, Math.max(1, Number.parseInt(expiresDays, 10) || 30));
    setShareBusy(true);
    try {
      const result = await createEventMediaShareLink(Number(selectedEventId), {
        expiresInDays: days,
      });
      const fullUrl =
        result.galleryUrl ||
        `${getPublicSiteOrigin()}${buildPublicEventMediaGalleryPath(result.token)}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Share link copied', {
        description: `Valid until ${format(new Date(result.expiresAt), 'MMM d, yyyy')}`,
      });
      setShareOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create link');
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <AdminKpiRow>
        <AdminKpiTile label="Total posts" value={(summary?.total ?? 0).toLocaleString()} />
        <AdminKpiTile label="Photos" value={(summary?.photos ?? 0).toLocaleString()} />
        <AdminKpiTile label="Videos" value={(summary?.videos ?? 0).toLocaleString()} />
        <AdminKpiTile
          label="Event"
          value={selectedEventId ? `#${selectedEventId}` : '—'}
          hint="Selected"
        />
      </AdminKpiRow>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <AdminSearchInput
          value={eventSearch}
          onChange={setEventSearch}
          placeholder="Search or choose an event…"
        />
        <AdminFilterSelect
          value={selectedEventId}
          onChange={setSelectedEventId}
          options={filteredEvents.map((e) => ({
            value: String(e.id),
            label: e.title,
          }))}
          className="min-w-[200px]"
        />
        <div className="flex flex-wrap gap-1.5">
          <AdminOutlinePill active={mediaFilter === 'all'} onClick={() => setMediaFilter('all')}>
            All
          </AdminOutlinePill>
          <AdminOutlinePill
            active={mediaFilter === 'photos'}
            onClick={() => setMediaFilter('photos')}
          >
            Photos
          </AdminOutlinePill>
          <AdminOutlinePill
            active={mediaFilter === 'videos'}
            onClick={() => setMediaFilter('videos')}
          >
            Videos
          </AdminOutlinePill>
        </div>
        <AdminOutlinePill onClick={openShare} disabled={!selectedEventId}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          Share with organizer
        </AdminOutlinePill>
      </div>

      <AdminSectionPanel title="Gallery">
        {mediaQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !items.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No media for this event yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.compositeId}
                className="overflow-hidden rounded-[14px] border border-border bg-card"
              >
                <div className="relative aspect-square bg-[hsl(var(--admin-surface))]">
                  {item.mediaType === 'video' ? (
                    <GalleryVideo url={item.mediaUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.label}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute left-2 top-2 flex gap-1">
                    <AdminStatusPill tone="primary">
                      {item.mediaType === 'video' ? 'Video' : 'Photo'}
                    </AdminStatusPill>
                    <AdminStatusPill tone="muted">
                      {item.source === 'story' ? 'Story' : 'Forum'}
                    </AdminStatusPill>
                  </div>
                </div>
                <div className="space-y-0.5 p-2.5">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {item.label || item.contributorName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.contributorName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSectionPanel>

      <Dialog open={shareOpen} onOpenChange={(open) => !shareBusy && setShareOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share event media</DialogTitle>
            <DialogDescription>
              Emails the media-share template with an embedded gallery link for{' '}
              <span className="font-medium text-foreground">
                {selectedEvent?.title || 'this event'}
              </span>
              {mediaSummaryLabel ? ` (${mediaSummaryLabel})` : ''}. No need to copy-paste the URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-[12px] border border-border bg-[hsl(var(--admin-surface))] px-3 py-2.5',
                !organizerQuery.data && 'opacity-70'
              )}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={emailOrganizer}
                disabled={!organizerQuery.data || shareBusy}
                onChange={(e) => setEmailOrganizer(e.target.checked)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-foreground">
                  Email assigned organizer
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {organizerQuery.isLoading
                    ? 'Looking up organizer…'
                    : organizerQuery.data
                      ? `${organizerQuery.data.name} (account email)`
                      : 'No organizer assigned on this event — add emails below.'}
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="media-share-emails" className="text-xs font-semibold">
                Additional emails
              </Label>
              <Input
                id="media-share-emails"
                type="text"
                value={extraEmails}
                onChange={(e) => setExtraEmails(e.target.value)}
                placeholder="partner@example.com, team@…"
                disabled={shareBusy}
              />
              <p className="text-[11px] text-muted-foreground">Comma-separated. Optional.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="media-share-days" className="text-xs font-semibold">
                Link expires in (days)
              </Label>
              <Input
                id="media-share-days"
                type="number"
                min={1}
                max={365}
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                disabled={shareBusy}
                className="w-28"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="media-share-note" className="text-xs font-semibold">
                Note in email (optional)
              </Label>
              <Textarea
                id="media-share-note"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Quick note for the organizer…"
                disabled={shareBusy}
                className="resize-y"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <button
              type="button"
              disabled={shareBusy}
              onClick={() => void handleEmailShare()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {shareBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email gallery link
            </button>
            <button
              type="button"
              disabled={shareBusy}
              onClick={() => void handleCopyOnly()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              Copy link only
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventMediaGalleryDashboard;
