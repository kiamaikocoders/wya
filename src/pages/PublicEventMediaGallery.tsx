import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Image as ImageIcon, LayoutGrid, Loader2, Video, User, Link2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { fetchPublicEventMediaGallery } from '@/lib/event-media-share';
import type { EventMediaItem } from '@/lib/admin-event-media-service';
import { GalleryVideo } from '@/components/event-media/GalleryVideo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type MediaFilter = 'all' | 'image' | 'video';

const glassPanel =
  'rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl';

const accentText = 'text-amber-400';

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

const PublicEventMediaGallery: React.FC = () => {
  const { token: tokenParam } = useParams<{ token: string }>();
  const token = tokenParam ? decodeURIComponent(tokenParam) : '';

  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-event-media-gallery', token],
    queryFn: () => fetchPublicEventMediaGallery(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const filteredItems = useMemo(() => {
    const items: EventMediaItem[] = data?.summary.items ?? [];
    if (mediaFilter === 'all') return items;
    return items.filter((i) => i.mediaType === mediaFilter);
  }, [data, mediaFilter]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-muted-foreground">
        Invalid link.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {data?.event?.title
            ? `${data.event.title} — shared media gallery`
            : 'Shared event media'}
        </title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050508] p-4 text-zinc-100 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(180,120,40,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(60,40,120,0.12), transparent 50%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                <Link2 className="h-3.5 w-3.5 text-amber-400/90" />
                Shared gallery
              </div>
              <h1 className="font-serif text-2xl font-light tracking-tight text-white md:text-3xl">
                {isLoading ? 'Loading…' : data?.event.title ?? 'Event media'}
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
                Photos and videos from stories and forum posts for this event. This page is only
                available to people with the link.
              </p>
            </div>
            {data?.event?.date ? (
              <p className="text-sm text-zinc-500">{formatEventDate(data.event.date)}</p>
            ) : null}
          </header>

          {isLoading && !data ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Loading shared gallery…</p>
            </div>
          ) : null}

          {error ? (
            <div className={cn('p-6 text-sm text-red-400', glassPanel)}>
              This link is invalid, expired, or no longer active.
            </div>
          ) : null}

          {!error && !isLoading && data ? (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total posts"
                  value={data.summary.total}
                  loading={false}
                  icon={<LayoutGrid className="h-5 w-5 text-amber-400/90" />}
                />
                <StatCard
                  label="Photos"
                  value={data.summary.photos}
                  loading={false}
                  icon={<ImageIcon className="h-5 w-5 text-amber-400/90" />}
                />
                <StatCard
                  label="Videos"
                  value={data.summary.videos}
                  loading={false}
                  icon={<Video className="h-5 w-5 text-amber-400/90" />}
                />
              </section>

              <div className={cn('p-4 md:p-5', glassPanel)}>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">Gallery</h2>
                    <p className="text-xs text-zinc-500">
                      Event ID{' '}
                      <span className={cn('font-mono', accentText)}>{data.event.id}</span>
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

                {filteredItems.length === 0 ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500">
                    No media for this filter yet.
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredItems.map((item) => (
                      <li
                        key={item.compositeId}
                        className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-black/40 shadow-lg transition-all duration-300 hover:border-amber-500/25"
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
          ) : null}
        </div>
      </div>
    </>
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
    <div className={cn('flex items-center gap-4 p-5', glassPanel)}>
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

export default PublicEventMediaGallery;
