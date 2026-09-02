import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Ticket, Users, X, Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { eventService } from '@/lib/event-service';
import { sponsorService } from '@/lib/sponsor';
import { userService } from '@/lib/user-service';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getSeededEvent, type SeededEvent } from '@/pages/events/figmaSeededEvents';
import { formatEventPrice, resolveCategoryImage } from '@/pages/events/conceptDUtils';
import { publicHostLabel } from '@/lib/display-name';
import MapView from '@/components/ui/MapView';
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from '@/lib/location-service';

type EventDetailPopupProps = {
  eventId: number | null;
  open: boolean;
  onClose: () => void;
};

/** Figma 15 — Event Detail Popup. Prefers live DB events; seeded is fallback only. */
export function EventDetailPopup({ eventId, open, onClose }: EventDetailPopupProps) {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === 'dark';
  const [saved, setSaved] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const seeded = eventId != null ? getSeededEvent(eventId) : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open, onClose]);

  useEffect(() => {
    setSaved(false);
    setShowMap(false);
  }, [eventId]);

  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(Number(eventId)),
    enabled: open && !!eventId,
    retry: false,
  });

  const liveEvent = eventQuery.data;
  const useSeeded = !liveEvent && !!seeded && !eventQuery.isLoading;

  const sponsorsQuery = useQuery({
    queryKey: ['eventSponsors', eventId],
    queryFn: () => sponsorService.getEventSponsors(Number(eventId)),
    enabled: open && !!eventId && !!liveEvent,
    retry: false,
  });

  const organizerQuery = useQuery({
    queryKey: ['organizer-profile', liveEvent?.organizer_id],
    queryFn: () =>
      liveEvent?.organizer_id ? userService.getUserProfile(liveEvent.organizer_id) : null,
    enabled: open && !!liveEvent?.organizer_id,
    retry: false,
  });

  const view = useMemo(() => {
    if (liveEvent) {
      const place = liveEvent.location?.split(',')[0]?.trim() || liveEvent.location || 'Kenya';
      const priceLabel = formatEventPrice(liveEvent.price);
      const apiSponsors = (sponsorsQuery.data ?? [])
        .filter((es) => es.sponsor)
        .map((es) => ({
          id: es.sponsor!.id,
          name: es.sponsor!.name,
          type: String(es.sponsorship_type || es.sponsor!.partnership_level || 'partner'),
          logo: es.sponsor!.logo_url as string | undefined,
          websiteUrl: es.sponsor!.website_url as string | undefined,
          cardClass: undefined as string | undefined,
          nameClass: undefined as string | undefined,
          typeClass: undefined as string | undefined,
          logoClass: undefined as string | undefined,
        }))
        .slice(0, 3);
      return {
        title: liveEvent.title,
        subtitle: `${place} · ${liveEvent.category || 'Live event'} · Ages 18+`,
        category: liveEvent.category,
        featured: Boolean(liveEvent.featured || liveEvent.is_featured),
        cover: liveEvent.image_url || resolveCategoryImage(liveEvent.category),
        dateTime: liveEvent.date,
        venue: liveEvent.location || 'Venue TBA',
        tickets: priceLabel === 'Free' ? 'Free entry' : `From ${priceLabel}`,
        attendance: liveEvent.capacity
          ? `Capacity ${liveEvent.capacity.toLocaleString()}`
          : 'Join the night',
        about: liveEvent.description || '',
        expect: (liveEvent.tags || []).slice(0, 4),
        tags: liveEvent.tags || [],
        organizerName: publicHostLabel(liveEvent.location, 'WYA'),
        organizerMeta: 'Venue host',
        organizerAvatar: organizerQuery.data?.avatar_url,
        sponsors: apiSponsors,
        priceLabel,
        ticketLink: (liveEvent as { ticket_link?: string }).ticket_link,
        latitude: liveEvent.latitude ?? null,
        longitude: liveEvent.longitude ?? null,
        location_url: liveEvent.location_url ?? null,
      };
    }
    if (useSeeded && seeded) {
      return {
        ...mapSeeded(seeded),
        latitude: seeded.latitude ?? null,
        longitude: seeded.longitude ?? null,
        location_url: seeded.location_url ?? null,
      };
    }
    return null;
  }, [liveEvent, useSeeded, seeded, sponsorsQuery.data, organizerQuery.data]);

  if (!open) return null;

  const loading = eventQuery.isLoading && !seeded;
  const card = isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#e8ecf0] bg-[#f6f8fa]';
  const inset = isDark ? 'bg-[#1c2333]' : 'bg-[#eef1f4]';
  const heading = isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#5c6570]';
  const modalBg = isDark ? 'bg-[#0d1117] border-[#21262d]' : 'bg-white border-[#e8ecf0]';

  const hasCoords =
    view?.latitude != null &&
    view?.longitude != null &&
    Number.isFinite(view.latitude) &&
    Number.isFinite(view.longitude);

  const mapsHref = hasCoords
    ? view!.location_url || googleMapsDirectionsUrl(view!.latitude!, view!.longitude!, view!.venue)
    : view?.location_url || null;

  const handleGetTickets = () => {
    if (view?.ticketLink) {
      window.open(view.ticketLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!isAuthenticated) {
      toast.message('Sign in to get tickets');
      return;
    }
    toast.info('Ticket purchase coming soon');
  };

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      {/* Full-viewport scrim — never scrolls with modal content */}
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)] backdrop-blur-[2px]"
        aria-label="Close event details"
        onClick={onClose}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
          className={cn(
            'pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-3rem)]',
            modalBg,
          )}
        >
          {loading || !view ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-[#ff6b35]" />
            </div>
          ) : (
            <>
              <div className="relative h-[180px] w-full shrink-0 overflow-hidden sm:h-[220px]">
                <img src={view.cover} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(13,18,23,0.55)]" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
                  <div className="flex gap-2">
                    {view.featured && (
                      <span className="rounded-full bg-[#ff6b35] px-2.5 py-1 text-[11px] font-semibold text-white">
                        Featured
                      </span>
                    )}
                    {view.category && (
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                          isDark
                            ? 'border-[#21262d] bg-[#1c2333] text-[#8b949e]'
                            : 'border-[#d0d7de] bg-white/90 text-[#5c6570]',
                        )}
                      >
                        {view.category}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex size-9 items-center justify-center rounded-full bg-black/45 text-white"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-7">
                <div className="flex flex-col gap-4 pb-4">
                  <div className="space-y-1.5">
                    <h2 id="event-detail-title" className={cn('text-[26px] font-extrabold', heading)}>
                      {view.title}
                    </h2>
                    <p className={cn('text-[13px]', muted)}>{view.subtitle}</p>
                  </div>

                  <div className={cn('space-y-2.5 rounded-[14px] border px-3.5 py-3', card)}>
                    <MetaRow
                      icon={<Calendar className="size-3.5 text-[#ff6b35]" />}
                      label="Date & time"
                      value={view.dateTime}
                      inset={inset}
                      heading={heading}
                      muted={muted}
                    />
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 text-left"
                      onClick={() => {
                        if (hasCoords || mapsHref) setShowMap((v) => !v);
                        else toast.message('No map pin for this venue yet');
                      }}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg',
                          inset,
                        )}
                      >
                        <MapPin className="size-3.5 text-[#ff6b35]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-[10px] font-semibold uppercase tracking-wider',
                            muted,
                          )}
                        >
                          Venue
                        </span>
                        <span className={cn('block text-sm font-medium', heading)}>{view.venue}</span>
                        {(hasCoords || mapsHref) && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#ff6b35]">
                            {showMap ? 'Hide map' : 'Show map'}
                            <ChevronDown
                              className={cn('size-3 transition-transform', showMap && 'rotate-180')}
                            />
                          </span>
                        )}
                      </span>
                    </button>
                    {showMap && hasCoords && (
                      <div className="overflow-hidden rounded-xl">
                        <MapView
                          latitude={view.latitude!}
                          longitude={view.longitude!}
                          location={view.venue}
                        />
                        <div className="mt-2 flex gap-2">
                          <a
                            href={mapsHref || googleMapsSearchUrl(view.latitude!, view.longitude!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff6b35]"
                          >
                            Open in Maps <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    {showMap && !hasCoords && mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff6b35]"
                      >
                        Open venue link <ExternalLink className="size-3" />
                      </a>
                    )}
                    <MetaRow
                      icon={<Ticket className="size-3.5 text-[#ff6b35]" />}
                      label="Tickets"
                      value={view.tickets}
                      inset={inset}
                      heading={heading}
                      muted={muted}
                    />
                    <MetaRow
                      icon={<Users className="size-3.5 text-[#ff6b35]" />}
                      label="Attendance"
                      value={view.attendance}
                      inset={inset}
                      heading={heading}
                      muted={muted}
                    />
                  </div>

                  {view.about && (
                    <div className="space-y-2">
                      <p className={cn('text-[11px] font-semibold tracking-[1.2px]', muted)}>
                        ABOUT THIS EVENT
                      </p>
                      <p className={cn('text-[13px] leading-5', heading)}>{view.about}</p>
                    </div>
                  )}

                  {view.expect.length > 0 && (
                    <div className="space-y-2">
                      <p className={cn('text-[11px] font-semibold tracking-[1.2px]', muted)}>
                        WHAT TO EXPECT
                      </p>
                      <div
                        className={cn(
                          'space-y-1 rounded-xl border px-3.5 py-2.5 text-xs leading-[18px]',
                          card,
                          heading,
                        )}
                      >
                        {view.expect.map((item) => (
                          <p key={item}>• {item}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-3', card)}>
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-[#ff6b35]',
                        inset,
                      )}
                    >
                      {view.organizerAvatar ? (
                        <img src={view.organizerAvatar} alt="" className="size-full object-cover" />
                      ) : (
                        view.organizerName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[10px] font-semibold tracking-[1px]', muted)}>
                        ORGANIZED BY
                      </p>
                      <p className={cn('truncate text-sm font-semibold', heading)}>
                        {view.organizerName}
                      </p>
                      <p className={cn('text-[11px]', muted)}>{view.organizerMeta}</p>
                    </div>
                  </div>

                  {view.sponsors.length > 0 && (
                    <div className="space-y-2.5">
                      <p className={cn('text-[11px] font-semibold tracking-[1.2px]', muted)}>
                        SPONSORS
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {view.sponsors.map((s) => {
                          const branded = Boolean(s.cardClass);
                          const Wrapper = s.websiteUrl ? 'a' : 'div';
                          const wrapperProps = s.websiteUrl
                            ? {
                                href: s.websiteUrl,
                                target: '_blank' as const,
                                rel: 'noopener noreferrer',
                              }
                            : {};
                          return (
                            <Wrapper
                              key={s.name}
                              {...wrapperProps}
                              className={cn(
                                'flex min-h-[124px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl px-2 py-3',
                                branded ? s.cardClass : cn('border', card),
                                s.websiteUrl && 'cursor-pointer transition-opacity hover:opacity-90',
                              )}
                            >
                              {s.logo ? (
                                <img
                                  src={s.logo}
                                  alt={s.name}
                                  className={s.logoClass || 'size-[52px] rounded-xl object-contain'}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'flex size-[52px] items-center justify-center rounded-xl text-lg font-bold text-[#ff6b35]',
                                    inset,
                                  )}
                                >
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p
                                className={cn(
                                  'text-center text-xs font-semibold',
                                  s.nameClass || heading,
                                )}
                              >
                                {s.name}
                              </p>
                              <p className={cn('text-center text-[10px]', s.typeClass || muted)}>
                                {s.type}
                              </p>
                            </Wrapper>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {view.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {view.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                            isDark
                              ? 'border-[#21262d] bg-[#1c2333] text-[#8b949e]'
                              : 'border-[#d0d7de] bg-[#eef1f4] text-[#5c6570]',
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  'flex shrink-0 gap-2.5 border-t px-5 py-4 sm:px-7',
                  isDark ? 'border-[#21262d]' : 'border-[#e8ecf0]',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.message('Sign in to save events');
                      return;
                    }
                    setSaved((s) => !s);
                    toast.success(saved ? 'Removed from saved' : 'Event saved');
                  }}
                  className={cn(
                    'flex-1 rounded-[10px] border-[1.5px] py-3 text-[13px] font-semibold',
                    isDark ? 'border-[#21262d] text-[#e6edf3]' : 'border-[#d0d7de] text-[#0d1117]',
                  )}
                >
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleGetTickets}
                  className="flex-[1.4] rounded-[10px] bg-[#ff6b35] py-3 text-[13px] font-bold text-white"
                >
                  Get tickets
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MetaRow({
  icon,
  label,
  value,
  inset,
  heading,
  muted,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  inset: string;
  heading: string;
  muted: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', inset)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={cn('text-[10px] font-semibold uppercase tracking-wider', muted)}>{label}</p>
        <p className={cn('truncate text-sm font-medium', heading)}>{value}</p>
      </div>
    </div>
  );
}

function mapSeeded(seeded: SeededEvent) {
  return {
    title: seeded.title,
    subtitle: seeded.subtitle || `${seeded.location.split(',')[0]} · ${seeded.category}`,
    category: seeded.category,
    featured: Boolean(seeded.featured),
    cover: seeded.image_url || resolveCategoryImage(seeded.category),
    dateTime: seeded.timeLabel || seeded.dateLabel,
    venue: seeded.location,
    tickets: seeded.ticketLabel,
    attendance:
      seeded.going != null ? `${seeded.going.toLocaleString()} going` : 'Join the night',
    about: seeded.description || '',
    expect: seeded.expect || (seeded.tags || []).slice(0, 4),
    tags: seeded.tags || [],
        organizerName: seeded.organizerName || publicHostLabel(seeded.location, 'WYA'),
    organizerMeta: seeded.organizerMeta || 'Verified organizer',
    organizerAvatar: undefined as string | undefined,
    sponsors: (seeded.sponsors || []).map((s) => ({
      name: s.name,
      type: s.type,
      logo: s.logo,
      cardClass: s.cardClass,
      nameClass: s.nameClass,
      typeClass: s.typeClass,
      logoClass: s.logoClass,
    })),
    priceLabel: seeded.ticketLabel,
    ticketLink: undefined as string | undefined,
  };
}
