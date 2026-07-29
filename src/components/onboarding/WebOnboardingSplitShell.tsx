import type { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { cn } from '@/lib/utils';

type WebOnboardingSplitShellProps = {
  heroSrc: string;
  heroAlt?: string;
  step: number;
  headline: string;
  subcopy: string;
  children: ReactNode;
  /** Defaults to `STEP {n} OF 4`. Use e.g. `PROPOSAL · STEP 1 OF 4` for request event. */
  stepBadge?: string;
  /** When true, omit ModeToggle / hero logo (page provides its own header). */
  embedded?: boolean;
};

export function WebOnboardingSplitShell({
  heroSrc,
  heroAlt = '',
  step,
  headline,
  subcopy,
  children,
  stepBadge,
  embedded = false,
}: WebOnboardingSplitShellProps) {
  const t = useWebAuthTheme();
  const badge = stepBadge ?? `STEP ${step} OF 4`;

  return (
    <div className={cn('relative min-h-0 w-full flex-1', t.pageBg)}>
      {!embedded && (
        <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
          <ModeToggle />
        </div>
      )}

      <div className="relative flex min-h-[calc(100vh-66px)] w-full flex-col lg:flex-row lg:min-h-[min(900px,calc(100vh-66px))]">
        <section className="relative hidden min-h-[280px] overflow-hidden lg:flex lg:w-[36%] lg:min-h-[inherit] xl:w-[520px] xl:shrink-0">
          <img src={heroSrc} alt={heroAlt} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-[rgba(13,17,23,0.55)]" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 pb-12 pt-10">
            <div className="flex flex-col gap-6">
              {!embedded && (
                <Logo
                  href="/"
                  size="md"
                  className="[&_img]:!h-12 [&_img]:!min-w-0 [&>div]:!min-w-0"
                />
              )}
              <span className="inline-flex w-fit items-center rounded-full bg-[rgba(255,107,53,0.2)] px-3 py-1.5 text-[11px] font-bold text-[#ff6b35]">
                {badge}
              </span>
            </div>
            <div className="max-w-[420px] space-y-3">
              <h1 className="text-[36px] font-extrabold leading-[1.15] text-white xl:text-[40px]">
                {headline}
              </h1>
              <p className="text-[15px] leading-relaxed text-[#e6edf3]/85">{subcopy}</p>
            </div>
          </div>
        </section>

        <section
          className={cn(
            'relative flex flex-1 flex-col px-5 py-8 sm:px-10 lg:overflow-y-auto lg:px-12 lg:py-10 xl:px-12',
            t.panelBg
          )}
        >
          <div className="mb-6 flex w-full max-w-[824px] flex-col gap-4 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              {!embedded && (
                <Logo href="/" size="sm" className="[&_img]:!h-10 [&_img]:!min-w-0 [&>div]:!min-w-0" />
              )}
              <span className="inline-flex items-center rounded-full bg-[rgba(255,107,53,0.2)] px-3 py-1.5 text-[11px] font-bold text-[#ff6b35]">
                {badge}
              </span>
            </div>
            <div className="space-y-1.5">
              <h1 className={cn('text-2xl font-extrabold leading-tight', t.heading)}>{headline}</h1>
              <p className={cn('text-sm', t.muted)}>{subcopy}</p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[824px] flex-1 flex-col gap-5">
            <OnboardingProgress step={step} isDark={t.isDark} />
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
