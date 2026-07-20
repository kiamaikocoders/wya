import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
import { buildPublicEventMediaGalleryPath, createEventMediaShareLink } from '@/lib/event-media-share';
import { GalleryVideo } from '@/components/event-media/GalleryVideo';

const EventMediaGalleryDashboard: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [shareBusy, setShareBusy] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['admin-event-media-events'],
    queryFn: () => adminEventMediaService.listEvents(),
  });

  const mediaQuery = useQuery({
    queryKey: ['admin-event-media', selectedEventId],
    queryFn: () => adminEventMediaService.fetchMediaForEvent(Number(selectedEventId)),
    enabled: !!selectedEventId,
  });

  const filteredEvents = useMemo(() => {
    const list = eventsQuery.data || [];
    if (!eventSearch.trim()) return list;
    const q = eventSearch.toLowerCase();
    return list.filter((e) => e.title.toLowerCase().includes(q));
  }, [eventsQuery.data, eventSearch]);

  // Auto-select first event
  React.useEffect(() => {
    if (!selectedEventId && filteredEvents[0]) {
      setSelectedEventId(String(filteredEvents[0].id));
    }
  }, [filteredEvents, selectedEventId]);

  const summary = mediaQuery.data;
  const items = useMemo(() => {
    const all = summary?.items || [];
    if (mediaFilter === 'photos') return all.filter((i) => i.mediaType === 'image');
    if (mediaFilter === 'videos') return all.filter((i) => i.mediaType === 'video');
    return all;
  }, [summary, mediaFilter]);

  const handleCopyShareLink = async () => {
    if (!selectedEventId) return;
    setShareBusy(true);
    try {
      const { token, expiresAt } = await createEventMediaShareLink(Number(selectedEventId));
      const path = buildPublicEventMediaGalleryPath(token);
      const fullUrl = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Share link copied', {
        description: `Valid until ${format(new Date(expiresAt), 'MMM d, yyyy')}`,
      });
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
        <AdminOutlinePill onClick={() => void handleCopyShareLink()} disabled={shareBusy || !selectedEventId}>
          {shareBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
          Copy organizer share link
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
    </div>
  );
};

export default EventMediaGalleryDashboard;
