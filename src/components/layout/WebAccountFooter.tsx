import { SiteFooter } from '@/components/marketing/SiteFooter';

/**
 * Light-web footer — same SiteFooter as landing/legal pages (no account actions).
 */
const WebAccountFooter = () => {
  return (
    <div className="mt-auto pb-24">
      <SiteFooter homeHref="/account" />
    </div>
  );
};

export default WebAccountFooter;
