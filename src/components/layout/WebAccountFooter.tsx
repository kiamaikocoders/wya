import { SiteFooter } from '@/components/marketing/SiteFooter';
import { companion } from '@/lib/companion-theme';
import { cn } from '@/lib/utils';

/**
 * Light-web footer — Figma SiteFooter on every companion page.
 */
const WebAccountFooter = () => {
  return (
    <div className="mt-auto pb-20 md:pb-0">
      <SiteFooter
        homeHref="/account"
        tagline="Discover nightlife across Africa"
        className={cn(companion.footerShell, 'px-4 pt-10 sm:px-8 lg:px-12')}
      />
    </div>
  );
};

export default WebAccountFooter;
