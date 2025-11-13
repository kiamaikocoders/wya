
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import FooterMinimal from "./FooterMinimal";

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
  const isAuthPage = ["/login", "/signup", "/admin-login"].includes(location.pathname);
  const isLanding = location.pathname === "/";

  return (
    <div className="relative flex min-h-screen flex-col bg-kenya-dark">
      {!isAuthPage && <Navbar />}
      <main className="flex-1 pb-20 md:pb-24">
        <Outlet />
      </main>
      {!isAuthPage && <BottomNav />}
      {!isAuthPage && (isLanding ? <Footer /> : <FooterMinimal />)}
      
      {scrollToTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-24 right-6 z-40 rounded-full bg-kenya-orange p-2 shadow-lg transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:bottom-28 sm:right-10"
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
  );
};

export default Layout;
