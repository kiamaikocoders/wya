import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { WebAuthSplitShell } from '@/components/auth/WebAuthSplitShell';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

/** Figma 14 — Welcome (auth gateway). */
const AuthWelcome = () => {
  const t = useWebAuthTheme();

  return (
    <WebAuthSplitShell
      heroSrc="/auth/welcome-hero.png"
      heroAlt="Night out with friends"
      headline="Where are you tonight?"
      subcopy="Discover live events across Kenya — then show up with your people."
    >
      <div className={cn(t.card, 'flex flex-col gap-[18px]')}>
        <Logo href="/" size="sm" className="[&_img]:!h-[38px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
        <div className="space-y-1">
          <h2 className={cn('text-[30px] font-extrabold', t.heading)}>Welcome to WYA</h2>
          <p className={cn('text-sm', t.muted)}>Kenya’s nightlife and live events, in one place.</p>
        </div>
        <Link to="/signup" className={t.primaryBtn}>
          Get Started
        </Link>
        <Link to="/login" className={t.outlineBtn}>
          Log in
        </Link>
        <Link to="/events" className="text-[13px] font-medium text-[#ff6b35] hover:underline">
          Browse events without an account →
        </Link>
      </div>
    </WebAuthSplitShell>
  );
};

export default AuthWelcome;
