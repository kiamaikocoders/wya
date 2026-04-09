import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Sparkles,
  Video,
  Calendar,
  User,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { GalleryVideo } from '@/components/event-media/GalleryVideo';
import { adminEventMediaService } from '@/lib/admin-event-media-service';
import { buildPublicEventMediaGalleryPath, createEventMediaShareLink } from '@/lib/event-media-share';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

type MediaFilter = 'all' | 'image' | 'video';

const glassPanel =
  'rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl';

const accentText = 'text-amber-400';
const accentBorder = 'border-amber-500/35';
const accentGlow = 'shadow-[0_0_24px_rgba(251,191,36,0.12)]';

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateStr;
  }
}

const EventMediaGalleryDashboard: React.FC = () => {
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [shareBusy, setShareBusy] = useState(false);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-event-media-events'],
    queryFn: () => adminEventMediaService.listEvents(),
    staleTime: 60_000,
  });

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const {
    data: summary,
    isLoading: mediaLoading,
    isFetching: mediaFetching,
    error: mediaError,
  } = useQuery({
    queryKey: ['admin-event-media', selectedEventId],
    queryFn: () => adminEventMediaService.fetchMediaForEvent(selectedEventId!),
    enabled: selectedEventId != null,
    staleTime: 30_000,
  });

  const filteredItems = useMemo(() => {
    if (!summary?.items) return [];
    if (mediaFilter === 'all') return summary.items;
    return summary.items.filter((i) => i.mediaType === mediaFilter);
  }, [summary, mediaFilter]);

  const handleCopyShareLink = async () => {
    if (selectedEventId == null) return;
    setShareBusy(true);
    try {
      const { token, expiresAt } = await createEventMediaShareLink(selectedEventId, 30);
      const path = buildPublicEventMediaGalleryPath(token);
      const fullUrl = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Share link copied', {
        description: `Valid until ${formatDateTime(expiresAt)}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create link';
      toast.error(msg);
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-white/[0.06] bg-[#050508] p-6 text-zinc-100 md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(180,120,40,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(60,40,120,0.12), transparent 50%), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(40,80,120,0.1), transparent 45%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-400/90" />
              Organizer intelligence
            </div>
            <h1 className="font-serif text-3xl font-light tracking-tight text-white md:text-4xl">
              Event media <span className={accentText}>gallery</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              User-generated photos and videos tied to each event ID—stories and forum posts with
              media—so you can see real engagement in one place.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[340px] lg:items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedEventId == null || shareBusy}
              onClick={() => void handleCopyShareLink()}
              className={cn(
                'h-10 w-full gap-2 border-amber-500/35 bg-black/30 text-zinc-100 hover:bg-white/[0.06] hover:text-white lg:w-auto',
                accentBorder
              )}
            >
              {shareBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 text-amber-400/90" />
              )}
              Copy organizer share link
            </Button>
            <p className="px-1 text-center text-[11px] leading-snug text-zinc-500 lg:text-right">
              Creates a new 30-day link and invalidates any previous link for this event.
            </p>
            <div className={cn('flex w-full flex-col gap-2 p-1', glassPanel, accentGlow)}>
            <span className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Filter by event
            </span>
            <Popover open={eventPickerOpen} onOpenChange={setEventPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={eventPickerOpen}
                  disabled={eventsLoading}
                  className={cn(
                    'h-12 w-full min-w-[min(100vw-3rem,320px)] justify-between border-white/10 bg-black/30 text-left font-normal text-zinc-100 hover:bg-white/[0.06] hover:text-white lg:min-w-[340px]',
                    accentBorder
                  )}
                >
                  {eventsLoading ? (
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading events…
                    </span>
                  ) : selectedEvent ? (
                    <span className="truncate">
                      <span className="text-white">{selectedEvent.title}</span>
                      {formatEventDate(selectedEvent.date) ? (
                        <span className="ml-2 text-zinc-500">
                          · {formatEventDate(selectedEvent.date)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Search or choose an event…</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(100vw-2rem,380px)] border-white/10 bg-[#0a0a0f]/95 p-0 text-zinc-100 backdrop-blur-xl"
                align="end"
              >
                <Command className="bg-transparent text-zinc-100">
                  <CommandInput
                    placeholder="Search events…"
                    className="h-11 border-white/10 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
                  />
                  <CommandList className="max-h-72">
                    <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                      No event matches.
                    </CommandEmpty>
                    <CommandGroup heading="Events" className="text-zinc-500 [&_[cmdk-group-heading]]:text-zinc-600">
                      {events.map((ev) => (
                        <CommandItem
                          key={ev.id}
                          value={`${ev.title} ${ev.id}`}
                          onSelect={() => {
                            setSelectedEventId(ev.id);
                            setEventPickerOpen(false);
                          }}
                          className="cursor-pointer aria-selected:bg-amber-500/15 aria-selected:text-amber-100"
                        >
                          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                            <span className="truncate font-medium text-zinc-100">{ev.title}</span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Calendar className="h-3 w-3" />
                              {formatEventDate(ev.date) || `ID ${ev.id}`}
                            </span>
                          </div>
                          {selectedEventId === ev.id ? (
                            <Check className="h-4 w-4 shrink-0 text-amber-400" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            </div>
          </div>
        </header>

        {!selectedEventId ? (
          <div
            className={cn(
              'flex min-h-[200px] flex-col items-center justify-center gap-3 p-10 text-center',
              glassPanel
            )}
          >
            <LayoutGrid className="h-10 w-10 text-zinc-600" />
            <p className="max-w-md text-sm text-zinc-400">
              Select an event to load its gallery. Every item is scoped to that event&apos;s ID in
              the database.
            </p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total posts"
                value={summary?.total ?? 0}
                loading={mediaLoading}
                icon={<LayoutGrid className="h-5 w-5 text-amber-400/90" />}
              />
              <StatCard
                label="Photos"
                value={summary?.photos ?? 0}
                loading={mediaLoading}
                icon={<ImageIcon className="h-5 w-5 text-amber-400/90" />}
              />
              <StatCard
                label="Videos"
                value={summary?.videos ?? 0}
                loading={mediaLoading}
                icon={<Video className="h-5 w-5 text-amber-400/90" />}
              />
            </section>

            {mediaError ? (
              <div className={cn('p-6 text-sm text-red-400', glassPanel)}>
                Could not load media for this event. Check your connection and permissions.
              </div>
            ) : null}

            <div className={cn('p-4 md:p-5', glassPanel)}>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">Gallery</h2>
                  <p className="text-xs text-zinc-500">
                    Event ID <span className={cn('font-mono', accentText)}>{selectedEventId}</span>
                    {mediaFetching && !mediaLoading ? (
                      <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-zinc-500" />
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: 'all' as const, label: 'All' },
                      { key: 'image' as const, label: 'Photos' },
                      { key: 'video' as const, label: 'Videos' },
                    ] as const
                  ).map(({ key, label }) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setMediaFilter(key)}
                      className={cn(
                        'rounded-full border border-transparent px-4 text-xs font-medium',
                        mediaFilter === key
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                          : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300'
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {mediaLoading ? (
                <div className="flex min-h-[240px] items-center justify-center gap-2 text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading gallery…
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500">
                  No media for this filter yet.
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredItems.map((item) => (
                    <li
                      key={item.compositeId}
                      className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/40 shadow-lg transition-all duration-300 hover:border-amber-500/25 hover:shadow-[0_0_32px_rgba(251,191,36,0.08)]"
                    >
                      <div className="relative aspect-square overflow-hidden bg-zinc-900">
                        {item.mediaType === 'video' ? (
                          <GalleryVideo url={item.mediaUrl} />
                        ) : (
                          <img
                            src={item.mediaUrl}
                            alt=""
                            className="absolute inset-0 z-[1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                        <Badge
                          className={cn(
                            'absolute left-2 top-2 border-0 text-[10px] font-semibold uppercase tracking-wide',
                            item.source === 'story'
                              ? 'bg-violet-500/25 text-violet-200'
                              : 'bg-sky-500/20 text-sky-200'
                          )}
                        >
                          {item.source === 'story' ? 'Story' : 'Forum'}
                        </Badge>
                        <Badge className="absolute right-2 top-2 border-0 bg-black/55 text-[10px] font-medium text-zinc-200">
                          {item.mediaType === 'video' ? 'Video' : 'Photo'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 p-3">
                        <p className="line-clamp-2 text-xs leading-snug text-zinc-300">{item.label}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.contributorName}</span>
                        </div>
                        <p className="text-[10px] text-zinc-600">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  loading,
  icon,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-center gap-4 p-5', glassPanel, accentGlow)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/35">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        {loading ? (
          <Loader2 className="mt-1 h-6 w-6 animate-spin text-zinc-500" />
        ) : (
          <p className="mt-0.5 font-serif text-3xl font-light tabular-nums text-white">{value}</p>
        )}
      </div>
    </div>
  );
}

export default EventMediaGalleryDashboard;
