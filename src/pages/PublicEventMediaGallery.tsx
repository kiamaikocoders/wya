import React, { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Search, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { fetchPublicEventMediaGallery, downloadPublicEventMediaZip } from '@/lib/event-media-share';
import type { EventMediaItem } from '@/lib/admin-event-media-service';
import { GalleryVideo } from '@/components/event-media/GalleryVideo';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { GetAppModal } from '@/components/marketing/GetAppModal';
import { SiteFooter } from '@/components/marketing/SiteFooter';

type MediaFilter = 'all' | 'image' | 'video';

function formatHeroDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'EEE d MMM yyyy');
  } catch {
    return '';
  }
}

function formatExpiry(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return '';
  }
}

function sourceLabel(source: EventMediaItem['source']): string {
  return source === 'story' ? 'Story' : 'Forum';
}

const PublicEventMediaGallery: React.FC = () => {
  const { token: tokenParam } = useParams<{ token: string }>();
  const token = tokenParam ? decodeURIComponent(tokenParam) : '';
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [navSearch, setNavSearch] = useState('');
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);

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

  const heroMeta = useMemo(() => {
    if (!data) return '';
    const parts = [
      formatHeroDate(data.event.date),
      data.event.location?.trim() || '',
      data.event.category?.trim() || '',
    ].filter(Boolean);
    return parts.join(' · ');
  }, [data]);

  const briefMeta = useMemo(() => {
    if (!data) return '';
    const parts = [
      formatHeroDate(data.event.date),
      data.event.location?.trim() || '',
    ].filter(Boolean);
    return parts.join(' · ');
  }, [data]);

  const heroUrl =
    data?.heroUrl ||
    data?.event.imageUrl ||
    data?.summary.items.find((i) => i.mediaType === 'image')?.mediaUrl ||
    null;

  const thumbUrl = data?.event.imageUrl || heroUrl;

  const pageBg = isDark ? 'bg-[#0d1117] text-white' : 'bg-[#f6f8fa] text-[#0d1117]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#656d76]';
  const heading = isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]';
  const navBorder = isDark ? 'border-[#21262d] bg-[#0d1117]' : 'border-[#d0d7de] bg-white';
  const searchBg = isDark
    ? 'border-[#21262d] bg-[#161b22] text-[#e6edf3] placeholder:text-[#8b949e]'
    : 'border-[#d0d7de] bg-white text-[#0d1117] placeholder:text-[#656d76]';
  const briefPanel = isDark
    ? 'border-[#333b47] bg-[#161b22]'
    : 'border-[#d0d7de] bg-white';
  const statsBox = isDark ? 'bg-[#0d1117] text-[#8b949e]' : 'bg-[#f6f8fa] text-[#656d76]';
  const contribRow = isDark
    ? 'border-[#333b47] bg-[#0d1117]'
    : 'border-[#d0d7de] bg-[#f6f8fa]';
  const cardBorder = isDark ? 'border-[#333b47]' : 'border-[#d0d7de]';
  const cardFooter = isDark ? 'bg-[#161b22] text-[#8b949e]' : 'bg-white text-[#656d76]';
  const pillIdle = isDark
    ? 'border-[#333b47] bg-[#161b22] text-[#e6edf3]'
    : 'border-[#d0d7de] bg-transparent text-[#0d1117]';
  const downloadBtn = isDark
    ? 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3]'
    : 'bg-[#f6f8fa] text-[#656d76] hover:text-[#0d1117]';

  const applyNavSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = navSearch.trim();
    navigate(q ? `/events?q=${encodeURIComponent(q)}` : '/events');
  };

  const onDownloadZip = async () => {
    if (!token || zipDownloading) return;
    if (!data?.summary.items.length) {
      toast.error('No media to download');
      return;
    }
    setZipDownloading(true);
    const toastId = toast.loading('Building zip…');
    try {
      await downloadPublicEventMediaZip(token, data.event.title);
      toast.success('Download started', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not download zip', {
        id: toastId,
      });
    } finally {
      setZipDownloading(false);
    }
  };

  if (!token) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center p-6', pageBg, muted)}>
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

      <div className={cn('flex min-h-screen flex-col', pageBg)}>
        <header
          className={cn(
            'sticky top-0 z-40 flex h-[66px] items-center justify-between border-b px-4 py-4 sm:px-8',
            navBorder
          )}
        >
          <div className="flex items-center gap-5 sm:gap-7">
            <Logo
              href="/"
              size="sm"
              className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0"
            />
            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/discover" className={cn('text-[13px] hover:text-[#ff6b35]', muted)}>
                Discover
              </Link>
              <Link to="/events" className="text-[13px] font-semibold text-[#ff6b35]">
                Events
              </Link>
              <Link to="/stories" className={cn('text-[13px] hover:text-[#ff6b35]', muted)}>
                Stories
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            <form onSubmit={applyNavSearch} className="relative hidden sm:block">
              <Search
                className={cn(
                  'pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2',
                  muted
                )}
              />
              <input
                type="search"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search events…"
                className={cn(
                  'h-[31px] w-[140px] rounded-full border pl-8 pr-3.5 text-xs outline-none focus:border-[#ff6b35] md:w-[180px]',
                  searchBg
                )}
              />
            </form>
            <ModeToggle />
            <button
              type="button"
              onClick={() => setAppModalOpen(true)}
              className="rounded-full bg-[#ff6b35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff6b35]/90"
            >
              Get the app
            </button>
          </div>
        </header>

        <main className="flex-1">
          <section className="relative h-[280px] w-full overflow-hidden sm:h-[340px] lg:h-[420px]">
            {heroUrl ? (
              <img
                src={heroUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 50% at 40% 40%, rgba(255,107,53,0.35), transparent 55%), #0d1117',
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(13,18,23,0.25)] via-[rgba(13,18,23,0.65)] to-[rgba(13,18,23,0.95)]" />
            <div className="relative z-10 flex h-full flex-col justify-end gap-2.5 px-4 pb-10 sm:px-8 lg:px-16">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[#ff6b35] px-2.5 py-1.5 text-[11px] font-semibold text-white">
                  Shared gallery · link only
                </span>
                {data?.expiresAt ? (
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isDark ? 'text-[#8b949e]' : 'text-[#d9e0e5]'
                    )}
                  >
                    Expires {formatExpiry(data.expiresAt)}
                  </span>
                ) : null}
              </div>
              <h1 className="max-w-[900px] text-[28px] font-bold leading-tight text-white sm:text-[36px] lg:text-[40px] lg:leading-[51px]">
                {isLoading ? 'Loading…' : data?.event.title ?? 'Event media'}
              </h1>
              {heroMeta ? (
                <p
                  className={cn(
                    'text-[15px] font-medium',
                    isDark ? 'text-[#8b949e]' : 'text-[#e5ebf0]'
                  )}
                >
                  {heroMeta}
                </p>
              ) : null}
              <p
                className={cn(
                  'max-w-xl text-sm',
                  isDark ? 'text-[#bfc7d1]' : 'text-[#e0e5eb]'
                )}
              >
                Your private media brief — stories & forum posts from this event.
              </p>
            </div>
          </section>

          {isLoading && !data ? (
            <div className={cn('flex min-h-[40vh] flex-col items-center justify-center gap-3', muted)}>
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Loading shared gallery…</p>
            </div>
          ) : null}

          {error ? (
            <div className="px-4 py-10 sm:px-8">
              <div
                className={cn(
                  'rounded-xl border p-6 text-sm text-red-400',
                  isDark ? 'border-[#333b47] bg-[#161b22]' : 'border-[#d0d7de] bg-white'
                )}
              >
                This link is invalid, expired, or no longer active.
              </div>
            </div>
          ) : null}

          {!error && data ? (
            <section className="flex flex-col lg:flex-row">
              <aside
                className={cn(
                  'flex w-full shrink-0 flex-col gap-4 border-b p-5 sm:p-7 lg:w-[400px] lg:border-b-0 lg:border-r',
                  briefPanel
                )}
              >
                <div className="relative h-[160px] w-full overflow-hidden rounded-xl sm:h-[180px]">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#21262d]" />
                  )}
                </div>

                <p className="text-[11px] font-semibold text-[#ff6b35]">Shared event media</p>
                <h2 className={cn('text-[22px] font-bold leading-[30px]', heading)}>
                  {data.event.title}
                </h2>
                {briefMeta ? <p className={cn('text-[13px]', muted)}>{briefMeta}</p> : null}
                <p className={cn('text-xs leading-4', muted)}>
                  Private link for organizers. Media from stories & forum posts tied to this event.
                </p>

                <div className={cn('flex flex-col gap-2 rounded-xl p-3 text-xs', statsBox)}>
                  <div className="flex gap-2">
                    <span className="flex-1 font-medium">Posts</span>
                    <span className="font-semibold tabular-nums">{data.summary.total}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-1 font-medium">Photos</span>
                    <span className="font-semibold tabular-nums">{data.summary.photos}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-1 font-medium">Videos</span>
                    <span className="font-semibold tabular-nums">{data.summary.videos}</span>
                  </div>
                </div>

                {(data.topContributors?.length ?? 0) > 0 ? (
                  <>
                    <p className={cn('text-xs font-semibold', heading)}>Top contributors</p>
                    <ul className="flex flex-col gap-2">
                      {data.topContributors!.map((c) => (
                        <li
                          key={c.userId}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-2',
                            contribRow
                          )}
                        >
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="size-7 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-full',
                                isDark ? 'bg-[#21262d]' : 'bg-[#e8ecf0]'
                              )}
                            >
                              <User className="size-3.5" />
                            </span>
                          )}
                          <span className={cn('min-w-0 flex-1 truncate text-xs font-medium', heading)}>
                            {c.name}
                          </span>
                          <span className={cn('shrink-0 text-[11px]', muted)}>
                            {c.postCount} {c.postCount === 1 ? 'post' : 'posts'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <div className="flex flex-col gap-1.5 rounded-[10px] border border-[rgba(255,107,53,0.4)] p-3 text-[11px]">
                  <p className="font-semibold text-[#ff6b35]">Media consent</p>
                  <p className={cn('leading-[15px]', muted)}>
                    Attendees opted in at signup. Do not republish outside WYA without permission.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void onDownloadZip()}
                  disabled={zipDownloading || data.summary.total === 0}
                  className={cn(
                    'inline-flex items-center gap-2 self-start rounded-[10px] px-4 py-3 text-[13px] font-semibold transition-colors disabled:opacity-60',
                    downloadBtn
                  )}
                >
                  {zipDownloading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {zipDownloading ? 'Building zip…' : 'Download zip'}
                </button>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className={cn('text-lg font-semibold', heading)}>All media</h2>
                  <div className="min-w-[12px] flex-1" />
                  {(
                    [
                      { key: 'all' as const, label: 'All' },
                      { key: 'image' as const, label: 'Photos' },
                      { key: 'video' as const, label: 'Videos' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMediaFilter(key)}
                      className={cn(
                        'rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
                        mediaFilter === key
                          ? 'bg-[#ff6b35] text-white'
                          : cn('border', pillIdle)
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredItems.length === 0 ? (
                  <div
                    className={cn(
                      'flex min-h-[200px] items-center justify-center rounded-xl border text-sm',
                      cardBorder,
                      muted
                    )}
                  >
                    No media for this filter yet.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredItems.map((item) => (
                      <li
                        key={item.compositeId}
                        className={cn(
                          'overflow-hidden rounded-xl border',
                          cardBorder
                        )}
                      >
                        <div className="relative aspect-[320/220] overflow-hidden bg-[#0d1117]">
                          {item.mediaType === 'video' ? (
                            <GalleryVideo url={item.mediaUrl} />
                          ) : (
                            <img
                              src={item.mediaUrl}
                              alt=""
                              className="absolute inset-0 size-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className={cn('flex flex-col gap-1 px-2.5 py-2', cardFooter)}>
                          <p className="line-clamp-1 text-[11px] font-medium">{item.label}</p>
                          <p className="text-[10px]">
                            {sourceLabel(item.source)} · {item.contributorName}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}
        </main>

        <SiteFooter />
      </div>

      <GetAppModal open={appModalOpen} onClose={() => setAppModalOpen(false)} />
    </>
  );
};

export default PublicEventMediaGallery;
