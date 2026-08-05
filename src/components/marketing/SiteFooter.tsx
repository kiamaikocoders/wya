import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const INSTAGRAM_URL =
  'https://www.instagram.com/whereyouat.ke?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
const TIKTOK_URL = 'https://www.tiktok.com/@whereyouat.ke';

type SiteFooterProps = {
  className?: string;
  /** Override the Home link (e.g. `/account` on light web). */
  homeHref?: string;
  /** Optional brand blurb under the logo. */
  tagline?: string;
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
    </svg>
  );
}

/** Shared footer for landing + legal/help pages (Concept D style). */
export function SiteFooter({
  className,
  homeHref = '/',
  tagline = 'Discover the best events happening in Kenya. Connect with organizers and other attendees.',
}: SiteFooterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');

  const heading = isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#656d76]';

  return (
    <footer
      className={cn(
        'mt-auto w-full shrink-0 px-4 pb-10 pt-14 sm:px-5 md:px-6 lg:px-8',
        isDark ? 'bg-[#0a0e14]' : 'bg-white',
        className
      )}
    >
      <div className="grid w-full gap-10 md:grid-cols-[1.3fr_1fr_1fr_1.3fr] md:gap-8 lg:gap-12">
        <div className="space-y-3.5">
          <Logo
            href={homeHref}
            size="md"
            className="[&_img]:!h-14 md:[&_img]:!h-16 [&_img]:!min-w-0 [&>div]:!min-w-0"
          />
          <p className={cn('max-w-sm text-sm leading-[22px]', muted)}>
            {tagline}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#ff6b35] hover:text-[#ff6b35]',
                isDark ? 'border-[#21262d] text-[#e6edf3]' : 'border-[#d0d7de] text-[#0d1117]'
              )}
              aria-label="WYA on Instagram"
            >
              <Instagram className="size-4 shrink-0" />
              Instagram
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#ff6b35] hover:text-[#ff6b35]',
                isDark ? 'border-[#21262d] text-[#e6edf3]' : 'border-[#d0d7de] text-[#0d1117]'
              )}
              aria-label="WYA on TikTok"
            >
              <TikTokIcon className="size-4 shrink-0" />
              TikTok
            </a>
          </div>
        </div>

        <div>
          <p className={cn('text-sm font-semibold', heading)}>Quick Links</p>
          <ul className={cn('mt-3.5 space-y-3 text-[13px]', muted)}>
            <li>
              <Link to={homeHref} className="hover:text-[#ff6b35]">
                Home
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-[#ff6b35]">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#ff6b35]">
                Contact Support
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:text-[#ff6b35]">
                Send feedback
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={cn('text-sm font-semibold', heading)}>Legal</p>
          <ul className={cn('mt-3.5 space-y-3 text-[13px]', muted)}>
            <li>
              <Link to="/privacy-policy" className="hover:text-[#ff6b35]">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-[#ff6b35]">
                Attendee Terms
              </Link>
            </li>
            <li>
              <Link to="/media-consent" className="hover:text-[#ff6b35]">
                Media consent
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={cn('text-sm font-semibold', heading)}>Newsletter</p>
          <p className={cn('mt-3.5 text-[13px]', muted)}>Get the pulse in your inbox.</p>
          <form
            className={cn(
              'mt-3 flex overflow-hidden rounded-xl border',
              isDark ? 'border-[#333b47] bg-[#12161c]' : 'border-[#d0d7de] bg-white'
            )}
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className={cn(
                'min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none',
                isDark ? 'text-white placeholder:text-[#8b949e]' : 'text-[#0d1117]'
              )}
            />
            <button
              type="submit"
              className="bg-[#ff6b35] px-4 text-sm font-semibold text-white hover:bg-[#ff6b35]/90"
            >
              Subscribe
            </button>
          </form>
          <p className={cn('mt-4 text-xs', muted)}>
            © {new Date().getFullYear()} WYA Kenya · Made with ♥ in Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}
