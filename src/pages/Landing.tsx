import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { GetAppModal } from '@/components/marketing/GetAppModal';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const METRICS = [
  { value: '12K+', label: 'Attendees' },
  { value: '350+', label: 'Organizers' },
  { value: '20+', label: 'Cities' },
  { value: 'Tonight', label: 'Live events' },
] as const;

const FEATURES = [
  {
    title: 'Discover Events',
    body: 'Curated music, culture, sports, and tech nights across Kenya.',
    image: '/landing/feat-discover.jpg',
  },
  {
    title: 'Request Experiences',
    body: 'Launch an idea, gauge interest, and collaborate with organizers.',
    image: '/landing/feat-request.jpg',
  },
  {
    title: 'AI Assistance',
    body: 'Recommendations, planning tips, and vibe-matched alerts in real time.',
    image: '/landing/feat-ai.jpg',
  },
] as const;

const STORIES = [
  {
    tag: 'FRIENDS',
    quote: '“Found my crew for Rooftop Fridays in under ten minutes.”',
    by: 'Amina · Westlands',
    image: '/landing/story-1.jpg',
  },
  {
    tag: 'LIVE MUSIC',
    quote: '“The DJ set I almost skipped became the night of the month.”',
    by: 'Leo · Kilimani',
    image: '/landing/story-2.jpg',
  },
  {
    tag: 'NIGHTS OUT',
    quote: '“WYA made ‘where you at?’ mean something again.”',
    by: 'Priya · Lavington',
    image: '/landing/story-3.jpg',
  },
] as const;

const REVIEWS = [
  {
    place: 'Westlands',
    quote:
      '“WYA helped us sell out our art festival in days — and the sponsors actually showed up.”',
    name: 'Nairobi Arts Collective',
    role: 'Festival organizers',
    image: '/landing/review-1.jpg',
  },
  {
    place: 'Kilimani',
    quote:
      '“I found night markets and food pop-ups I never would have known about. The AI feels personal.”',
    name: "Achieng'",
    role: 'Food explorer',
    image: '/landing/review-2.jpg',
  },
  {
    place: 'CBD',
    quote:
      '“Finally one place for tickets, friends, and what’s actually happening tonight in the city.”',
    name: 'Zuri W.',
    role: 'Nightlife regular',
    image: '/landing/review-3.jpg',
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Create your profile',
    body: 'Tell WYA what you love — music, food, rooftops, culture — and we learn your vibe.',
    image: '/landing/step-1.jpg',
  },
  {
    n: '02',
    title: 'Curate or request',
    body: 'Browse what’s live tonight, or submit the night you want to see happen.',
    image: '/landing/step-2.jpg',
  },
  {
    n: '03',
    title: 'Show up with confidence',
    body: 'Tickets, reminders, and your people — all in one place when the city lights up.',
    image: '/landing/step-3.jpg',
  },
] as const;

/** Full-bleed edge padding — content hugs the viewport, not a centered column. */
const edge = 'px-4 sm:px-5 md:px-6 lg:px-8';

/**
 * Figma 12 — Landing Concept D (Hybrid Full) · Light + Dark
 * Includes Get the App modal.
 */
const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [appModalOpen, setAppModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const card = isDark
    ? 'border-[#333b47] bg-[#1a1f26]'
    : 'border-[#e8ecf0] bg-white shadow-[0px_14px_32px_0px_rgba(0,0,0,0.1)]';
  const heading = isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#5c6570]';
  const sectionAlt = isDark ? 'bg-[#0d1117]' : 'bg-white';
  const sectionMuted = isDark ? 'bg-[#12161c]' : 'bg-[#f4f6f8]';

  return (
    <div className={cn('flex min-h-screen flex-col', isDark ? 'bg-[#0d1117] text-white' : 'bg-white text-[#0d1117]')}>
      {/* ——— Hero ——— */}
      <section className="relative min-h-[720px] overflow-hidden md:min-h-[920px]">
        <img
          src="/landing/hero-crowd.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,18,23,0.35)] via-[rgba(13,18,23,0.55)] to-[rgba(13,18,23,0.92)]" />

        <div className={cn('relative z-10 flex h-[88px] items-center justify-between py-4', edge)}>
          <Logo
            href="/"
            size="lg"
            className="[&_img]:!h-14 sm:[&_img]:!h-16 md:[&_img]:!h-[80px] [&_img]:!min-w-0 [&>div]:!min-w-0"
          />
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <ModeToggle className="border-white/20 bg-black/40 text-white hover:bg-black/55" />
            <Link
              to="/login"
              className="hidden rounded-xl border border-white/35 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex md:px-[18px] md:py-3"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-[#ff6b35] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff6b35]/90 md:px-[18px] md:py-3"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className={cn('relative z-10 flex max-w-[720px] flex-col gap-[18px] pb-10 pt-12 md:pt-24', edge)}>
          <p className="text-xs font-semibold tracking-[1.2px] text-[#ff6b35]">
            KENYA&apos;S EVENT COMPANION
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-[56px] md:leading-[64px]">
            Find your people.
            <br />
            Feel the night.
          </h1>
          <p className="max-w-[580px] text-base leading-7 text-[#e5ebf2] sm:text-lg">
            Discover curated nights, request experiences, and let AI put you where the energy is —
            with real faces, real venues, real Kenya.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/events"
              className="rounded-[14px] bg-[#ff6b35] px-[22px] py-3.5 text-[15px] font-semibold text-white hover:bg-[#ff6b35]/90"
            >
              Browse live events
            </Link>
            <Link
              to="/request-event"
              className="rounded-[14px] border border-white/40 px-[22px] py-3.5 text-[15px] font-semibold text-white hover:bg-white/10"
            >
              Request event
            </Link>
          </div>
        </div>

        <div
          className={cn(
            'relative z-10 mt-auto flex flex-wrap gap-y-4 py-5 md:absolute md:inset-x-0 md:bottom-0',
            edge
          )}
        >
          {METRICS.map((m, i) => (
            <div key={m.label} className="flex items-center">
              {i > 0 && <div className="mx-2 hidden h-10 w-px bg-white/15 sm:block" />}
              <div className="px-1 pr-6 sm:pr-10">
                <p className="text-xl font-bold text-white sm:text-2xl">{m.value}</p>
                <p className="text-[13px] text-[#bfc7d1]">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Features ——— */}
      <section className={cn('py-14 md:py-16', sectionAlt, edge)}>
        <p className="text-xs font-semibold tracking-[1.6px] text-[#f97316]">
          EVERYTHING IN ONE PLACE
        </p>
        <h2 className={cn('mt-3 text-3xl font-bold md:text-[34px]', heading)}>
          Discover. Request. Let AI guide the night.
        </h2>
        <p className={cn('mt-3 max-w-3xl text-base', muted)}>
          WYA brings discovery, requests, and AI-powered planning together so you never miss a
          moment.
        </p>
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className={cn('overflow-hidden rounded-[20px] border p-4 sm:p-5', card)}>
              <img
                src={f.image}
                alt=""
                className="mb-3.5 h-44 w-full rounded-[14px] object-cover sm:h-48"
              />
              <h3 className={cn('text-lg font-semibold', heading)}>{f.title}</h3>
              <p className={cn('mt-2 text-sm leading-[22px]', muted)}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ——— Stories ——— */}
      <section className={cn('py-14 md:py-16', sectionMuted, edge)}>
        <h2 className={cn('text-3xl font-bold md:text-[34px]', heading)}>Stories from the floor</h2>
        <p className={cn('mt-2 text-base', muted)}>Real nights. Real crews. Real Kenya.</p>
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          {STORIES.map((s) => (
            <article key={s.by} className={cn('overflow-hidden rounded-[20px] border p-4', card)}>
              <img
                src={s.image}
                alt=""
                className="mb-3 h-[200px] w-full rounded-[14px] object-cover sm:h-[220px]"
              />
              <p className="text-[11px] font-semibold text-[#ff6b35]">{s.tag}</p>
              <p className={cn('mt-2 text-base font-medium leading-6', heading)}>{s.quote}</p>
              <p className={cn('mt-3 text-[13px]', muted)}>{s.by}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ——— Reviews ——— */}
      <section className={cn('py-14 md:py-16', sectionMuted, edge)}>
        <p className="text-xs font-semibold tracking-[1.6px] text-[#f97316]">BY THE COMMUNITY</p>
        <h2 className={cn('mt-2.5 text-3xl font-bold md:text-[34px]', heading)}>
          Creators and explorers trust WYA
        </h2>
        <p className={cn('mt-2.5 max-w-3xl text-base leading-6', muted)}>
          Real nights. Real people. Stories from the city that never sits still.
        </p>
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <article key={r.name} className={cn('overflow-hidden rounded-[22px] border', card)}>
              <div className="relative h-[168px] overflow-hidden sm:h-[180px]">
                <img src={r.image} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
                <span className="absolute left-4 top-4 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white">
                  {r.place}
                </span>
              </div>
              <div className="space-y-3 px-5 pb-5 pt-5 sm:px-[22px]">
                <p className="text-[13px] font-medium text-[#f97316]">★★★★★</p>
                <p className={cn('text-[15px] leading-[23px]', heading)}>{r.quote}</p>
                <div className="flex items-center gap-2.5">
                  <img src={r.image} alt="" className="size-9 rounded-full object-cover" />
                  <div>
                    <p className={cn('text-sm font-semibold', heading)}>{r.name}</p>
                    <p className={cn('text-xs', muted)}>{r.role}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ——— How it works ——— */}
      <section id="how-it-works" className={cn('py-14 md:py-16', sectionAlt, edge)}>
        <p className="text-xs font-semibold tracking-[1.6px] text-[#f97316]">HOW IT WORKS</p>
        <h2 className={cn('mt-2.5 text-3xl font-bold md:text-[34px]', heading)}>
          From idea to unforgettable night
        </h2>
        <p className={cn('mt-2.5 text-base', muted)}>
          Three steps. Zero chaos. The city opens when you’re ready.
        </p>
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className={cn('overflow-hidden rounded-[22px] border', card)}>
              <div className="relative h-[200px] overflow-hidden sm:h-[220px]">
                <img src={s.image} alt="" className="size-full object-cover" />
                <span className="absolute left-4 top-4 rounded-[10px] bg-[#f97316] px-3 py-2 text-sm font-bold text-white">
                  {s.n}
                </span>
              </div>
              <div className="space-y-2.5 px-5 pb-6 pt-5 sm:px-[22px]">
                <h3 className={cn('text-xl font-semibold', heading)}>{s.title}</h3>
                <p className={cn('text-sm leading-[21px]', muted)}>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ——— CTA band (Figma: Ready when the city is · 1440×360) ——— */}
      <section className="relative isolate min-h-[300px] overflow-hidden md:min-h-[360px]">
        <img
          src="/landing/cta-rooftop.png"
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(7,10,15,0.62)]" />
        <div
          className={cn(
            'relative z-10 flex min-h-[300px] flex-col justify-center gap-8 py-12 md:min-h-[360px] md:flex-row md:items-center md:justify-between md:gap-10 md:py-14',
            edge
          )}
        >
          <div className="max-w-[640px] space-y-4">
            <h2 className="text-[28px] font-bold leading-tight text-white md:text-[36px]">
              Ready when the city is.
            </h2>
            <p className="max-w-[520px] text-[15px] leading-6 text-[#e5ebf2] md:text-base">
              Download WYA and step into the night — live events, real plans, people nearby.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-[10px] bg-black px-3.5 py-2.5 transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="size-7 shrink-0 fill-white" aria-hidden>
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.98 2.94 12.44 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                <span className="flex flex-col leading-none">
                  <span className="text-[10px] text-[#c8cdd5]">Download on the</span>
                  <span className="text-sm font-semibold text-white">App Store</span>
                </span>
              </a>
              <Link
                to="/download"
                className="inline-flex items-center gap-2.5 rounded-[10px] bg-black px-3.5 py-2.5 transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
                  <path fill="#EA4335" d="M3.6 2.3 13.4 12 3.6 21.7c-.4-.3-.6-.7-.6-1.2V3.5c0-.5.2-.9.6-1.2Z" />
                  <path fill="#FBBC04" d="m13.4 12 2.5-2.5 4.9 2.8c.7.4.7 1.4 0 1.8l-4.9 2.8L13.4 12Z" />
                  <path fill="#4285F4" d="M13.4 12 3.6 2.3c.3-.2.6-.3 1-.3.4 0 .8.1 1.1.3L15.9 9.5 13.4 12Z" />
                  <path fill="#34A853" d="M13.4 12 15.9 14.5 5.7 21.7c-.3.2-.7.3-1.1.3-.4 0-.7-.1-1-.3L13.4 12Z" />
                </svg>
                <span className="flex flex-col leading-none">
                  <span className="text-[10px] text-[#c8cdd5]">Get it on</span>
                  <span className="text-sm font-semibold text-white">Google Play</span>
                </span>
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAppModalOpen(true)}
            className="shrink-0 self-start rounded-[14px] bg-[#ff6b35] px-7 py-4 text-base font-semibold text-white hover:bg-[#ff6b35]/90 md:self-center"
          >
            Get the app
          </button>
        </div>
      </section>

      <SiteFooter className="mt-auto shrink-0" />

      <GetAppModal open={appModalOpen} onClose={() => setAppModalOpen(false)} />
    </div>
  );
};

export default Landing;
