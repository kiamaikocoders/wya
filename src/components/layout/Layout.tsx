
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import WebAccountNav from "./WebAccountNav";
import WebAccountHeader from "./WebAccountHeader";
import WebAccountFooter from "./WebAccountFooter";
import Footer from "./Footer";
import FooterMinimal from "./FooterMinimal";
import MaintenanceBanner from "./MaintenanceBanner";
import { cn } from "@/lib/utils";
import { DiscoverUIProvider } from "@/contexts/DiscoverUIContext";
import { LocationConfirmPrompt } from "@/components/location/LocationConfirmPrompt";
import { isNativeApp } from "@/lib/post-auth-navigation";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [scrollToTop, setScrollToTop] = useState(false);
  const nativeApp = isNativeApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage = [
    "/login",
    "/signup",
    "/welcome",
    "/forgot-password",
    "/reset-password",
    "/email-confirmation-pending",
    "/auth/callback",
    "/auth/confirm",
  ].includes(location.pathname);
  const isImmersiveWizard =
    location.pathname === "/onboarding" ||
    (nativeApp && location.pathname === "/request-event");
  const isLanding = location.pathname === "/";
  const isDiscoverPage =
    location.pathname === "/discover" || location.pathname.startsWith("/discover/");
  const isEventsBrowse =
    location.pathname === "/events" || /^\/events\/[^/]+$/.test(location.pathname);
  const isSharedEventMedia = location.pathname.startsWith("/share/event-media");
  const isLegalPage = [
    "/privacy-policy",
    "/terms-of-service",
    "/media-consent",
  ].includes(location.pathname);
  const isSupportPage = ["/faq", "/contact", "/feedback"].includes(location.pathname);

  // Logged-in users keep account nav on /events so they can browse without getting trapped.
  const hideEventsChrome = isEventsBrowse && !isAuthenticated;

  // Support pages ship their own Legal shell header/footer — hide app chrome to avoid duplicates.
  const hideChrome =
    isAuthPage ||
    (nativeApp && isDiscoverPage) ||
    isLegalPage ||
    isSupportPage ||
    hideEventsChrome ||
    isImmersiveWizard ||
    isSharedEventMedia;

  const showWebAccountNav = !nativeApp && !hideChrome && isAuthenticated;
  const showFullBottomNav = nativeApp && !hideChrome;
  const showTopNavbar = nativeApp && !hideChrome;
  // Figma desktop shell: header on all authenticated light-web pages (not only account paths).
  const showWebAccountHeader = !nativeApp && !hideChrome && isAuthenticated;
  const showWebAccountFooter = showWebAccountHeader;

  return (
    <DiscoverUIProvider>
      <div
        className={cn(
          'relative flex min-h-screen flex-col',
          showWebAccountHeader
            ? 'bg-[#f6f8fa] text-[#0d1117] dark:bg-[#0d1117] dark:text-[#e6edf3]'
            : 'bg-background text-foreground'
        )}
      >
        {!isAuthPage && !isAdminPage && nativeApp && <LocationConfirmPrompt />}
        {showTopNavbar && <Navbar />}
        {showWebAccountHeader && <WebAccountHeader />}
        {!isAuthPage && !isAdminPage && !isLegalPage && !(nativeApp && isSupportPage) && (
          <MaintenanceBanner />
        )}
        <main
          className={cn(
            'flex-1',
            showWebAccountNav && 'pb-20 md:pb-0',
            showFullBottomNav && 'pb-20 md:pb-24'
          )}
        >
          <Outlet />
        </main>
        {showWebAccountFooter && <WebAccountFooter />}
        {/* Mobile-only bottom nav; desktop uses SiteHeader links per Figma */}
        {showWebAccountNav && (
          <div className="md:hidden">
            <WebAccountNav />
          </div>
        )}
        {showFullBottomNav && <BottomNav />}
        {!hideChrome && nativeApp && (isLanding ? <Footer /> : <FooterMinimal />)}

        {scrollToTop && !isLegalPage && !(isEventsBrowse && hideEventsChrome) && (
          <button
            onClick={scrollTop}
            className="fixed bottom-24 right-6 z-40 rounded-full bg-primary p-2 shadow-lg transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-8 sm:right-10"
            aria-label="Scroll to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </DiscoverUIProvider>
  );
};

export default Layout;
