
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import FooterMinimal from "./FooterMinimal";
import MaintenanceBanner from "./MaintenanceBanner";
import { cn } from "@/lib/utils";
import { DiscoverUIProvider } from "@/contexts/DiscoverUIContext";

const Layout = () => {
  const location = useLocation();
  const [scrollToTop, setScrollToTop] = useState(false);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setScrollToTop(true);
      } else {
        setScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Check if current route is admin or auth page
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
  const isLanding = location.pathname === "/";
  const isDiscoverPage = location.pathname === "/discover";
  const isEventsBrowse =
    location.pathname === "/events" || /^\/events\/[^/]+$/.test(location.pathname);
  const isLegalPage = [
    "/privacy-policy",
    "/terms-of-service",
    "/media-consent",
    "/faq",
    "/contact",
    "/feedback",
  ].includes(location.pathname);
  const hideChrome = isAuthPage || isDiscoverPage || isLegalPage || isEventsBrowse;

  return (
    <DiscoverUIProvider>
      <div className="relative flex min-h-screen flex-col bg-background">
        {!hideChrome && <Navbar />}
        {!isAuthPage && !isAdminPage && !isLegalPage && <MaintenanceBanner />}
        <main className={cn("flex-1", !hideChrome && "pb-20 md:pb-24")}>
          <Outlet />
        </main>
        {!hideChrome && <BottomNav />}
        {!hideChrome && (isLanding ? <Footer /> : <FooterMinimal />)}
        
        {scrollToTop && !isLegalPage && !isEventsBrowse && (
          <button
            onClick={scrollTop}
            className="fixed bottom-24 right-6 z-40 rounded-full bg-primary p-2 shadow-lg transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-28 sm:right-10"
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
