import type { ReactNode } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

type WebAuthOverlayShellProps = {
  backgroundSrc: string;
  children: ReactNode;
  cardClassName?: string;
};

/** Centered card over dimmed photo — Forgot / Check Email / Email Pending. */
export function WebAuthOverlayShell({
  backgroundSrc,
  children,
  cardClassName,
}: WebAuthOverlayShellProps) {
  const t = useWebAuthTheme();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
      <img
        src={backgroundSrc}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-[rgba(13,17,23,0.72)]" />

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ModeToggle className="border-white/20 bg-black/40 text-white hover:bg-black/55" />
      </div>

      <div className={cn('relative z-10', t.overlayCard, cardClassName)}>{children}</div>
    </main>
  );
}
