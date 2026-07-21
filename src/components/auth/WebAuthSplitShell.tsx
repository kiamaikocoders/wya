import type { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

type WebAuthSplitShellProps = {
  heroSrc: string;
  heroAlt?: string;
  headline: string;
  subcopy: string;
  children: ReactNode;
  /** Allow panel to scroll (signup). */
  scrollPanel?: boolean;
};

/** Split hero + form panel used by Welcome / Login / Signup (Figma 14). */
export function WebAuthSplitShell({
  heroSrc,
  heroAlt = '',
  headline,
  subcopy,
  children,
  scrollPanel = false,
}: WebAuthSplitShellProps) {
  const t = useWebAuthTheme();

  return (
    <main className={cn('relative min-h-screen', t.pageBg)}>
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ModeToggle />
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        <section className="relative hidden min-h-[320px] overflow-hidden lg:flex lg:w-1/2 lg:min-h-screen">
          <img src={heroSrc} alt={heroAlt} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,18,23,0.25)] via-[rgba(13,18,23,0.4)] to-[rgba(13,18,23,0.85)]" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex flex-col gap-3">
              <Logo
                href="/"
                size="md"
                className="[&_img]:!h-[52px] [&_img]:!min-w-0 [&>div]:!min-w-0"
              />
              <span className="h-1 w-12 rounded bg-[#ff6b35]" />
            </div>
            <div className="max-w-[560px] space-y-3.5">
              <h1 className="text-[36px] font-extrabold leading-[1.15] text-white xl:text-[42px] xl:leading-[48px]">
                {headline}
              </h1>
              <p className="max-w-[480px] text-base leading-[26px] text-[#e6edf3]/85">{subcopy}</p>
            </div>
          </div>
        </section>

        <section
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-10 lg:w-1/2 lg:px-[56px] xl:px-[72px]',
            t.panelBg,
            scrollPanel && 'lg:overflow-y-auto lg:py-12'
          )}
        >
          <div className="mb-8 flex w-full max-w-[608px] items-center justify-between lg:hidden">
            <Logo href="/" size="sm" className="[&_img]:!h-10 [&_img]:!min-w-0 [&>div]:!min-w-0" />
          </div>
          <div className="w-full max-w-[608px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
