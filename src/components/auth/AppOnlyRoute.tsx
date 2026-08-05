import { Link, useLocation } from 'react-router-dom';
import { Smartphone, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isNativeApp } from '@/lib/post-auth-navigation';

interface AppOnlyRouteProps {
  children: React.ReactNode;
  /** Short label for what this feature is (shown on the web interstitial). */
  featureLabel?: string;
}

/**
 * Renders children in the native app; on web shows an “open in app” interstitial.
 */
const AppOnlyRoute = ({ children, featureLabel = 'This experience' }: AppOnlyRouteProps) => {
  const location = useLocation();

  if (isNativeApp()) {
    return <>{children}</>;
  }

  const next = `${location.pathname}${location.search}${location.hash}`;
  const downloadHref = `/download?next=${encodeURIComponent(next)}`;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Smartphone className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Available in the WYA app
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {featureLabel} works best in the app — Discover, chat, hosting, and your full feed live
          there. On the web you can still browse events, buy tickets, and manage your account.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="bg-kenya-orange text-kenya-dark hover:bg-kenya-orange/90">
            <Link to={downloadHref}>
              <Download className="mr-2 h-4 w-4" />
              Get the app
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">
              Browse events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/account" className="font-medium text-primary underline-offset-4 hover:underline">
            Go to your account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AppOnlyRoute;
