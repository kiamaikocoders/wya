import React from 'react';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type LegalPageShellProps = {
  heroSrc: string;
  heroAlt?: string;
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  /** Optional override for hero meta line (Figma FAQ light uses orange). */
  metaClassName?: string;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
};

/**
 * Figma 13 — Legal shell (light + dark).
 * Hero stays dark-overlaid in both themes; page bg + floating card swap.
 */
export function LegalPageShell({
  heroSrc,
  heroAlt = '',
  eyebrow,
  title,
  meta,
  metaClassName,
  children,
  className,
  cardClassName,
}: LegalPageShellProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col',
        isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]',
        className
      )}
    >
      {/* Hero — same dark overlay in light + dark (Figma) */}
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[320px] md:h-[360px]">
        <img
          src={heroSrc}
          alt={heroAlt}
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,18,23,0.2)] to-[rgba(13,18,23,0.92)]" />

        <div className="relative z-10 flex h-[76px] items-center justify-between px-5 sm:px-8 md:px-12">
          <Logo href="/" size="sm" className="[&_img]:!h-10 sm:[&_img]:!h-12" />
          <ModeToggle className="border-white/20 bg-black/40 text-white hover:bg-black/55" />
        </div>

        <div className="relative z-10 flex flex-col gap-2.5 px-5 pb-8 pt-6 sm:px-8 md:px-16">
          <p className="text-xs font-semibold tracking-[0.96px] text-[#ff6b35]">{eyebrow}</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-[40px]">{title}</h1>
          {meta ? (
            <div className={cn('text-[13px] text-white', metaClassName)}>{meta}</div>
          ) : null}
        </div>
      </div>

      {/* Floating doc card — white (light) / #1a1f26 (dark) */}
      <div className="relative z-20 mx-auto -mt-5 w-full max-w-[1120px] flex-1 px-4 pb-10 sm:-mt-8 sm:px-6 md:px-8">
        <div
          className={cn(
            'rounded-3xl border px-5 py-8 sm:px-8 md:px-10 md:py-8',
            isDark
              ? 'border-[#38404d] bg-[#1a1f26]'
              : 'border-[#d0d7de] bg-white',
            cardClassName
          )}
        >
          {children}
        </div>
      </div>

      <SiteFooter className="mt-auto shrink-0" />
    </div>
  );
}

type LegalHeroFormShellProps = {
  heroSrc: string;
  heroAlt?: string;
  left: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Full-bleed hero with left copy panel + right form card (Contact / Feedback). */
export function LegalHeroFormShell({
  heroSrc,
  heroAlt = '',
  left,
  children,
  className,
}: LegalHeroFormShellProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col',
        isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]',
        className
      )}
    >
      <div className="absolute inset-0 min-h-[720px]">
        <img
          src={heroSrc}
          alt={heroAlt}
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(5, 8, 13, 0.72) 0%, rgba(5, 8, 13, 0.45) 42%, rgba(5, 8, 13, 0.2) 70%, rgba(5, 8, 13, 0.35) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex h-20 items-center justify-between px-5 py-6 sm:px-8 md:px-12">
          <Logo href="/" size="sm" className="[&_img]:!h-10 sm:[&_img]:!h-12" />
          <ModeToggle className="border-white/20 bg-black/40 text-white hover:bg-black/55" />
        </div>

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-5 pb-16 pt-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10 lg:px-12 lg:pt-8">
          <div className="w-full max-w-[516px] rounded-3xl border border-white/10 bg-[rgba(10,13,18,0.55)] p-7 backdrop-blur-sm">
            {left}
          </div>
          <div className="w-full max-w-[560px] rounded-[28px] bg-white px-6 py-8 text-[#1a1f24] shadow-2xl sm:px-9 lg:mt-0">
            {children}
          </div>
        </div>

        <SiteFooter className="relative z-10 mt-auto" />
      </div>
    </div>
  );
}
