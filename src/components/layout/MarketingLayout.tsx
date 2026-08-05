import { Outlet, useLocation } from 'react-router-dom';
import MarketingNavbar from '../marketing/MarketingNavbar';
import Footer from './Footer';

const MarketingLayout = () => {
  const { pathname } = useLocation();
  // Landing is self-contained (own nav + footer + theme).
  const isLanding = pathname === '/';

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-promo text-white">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
