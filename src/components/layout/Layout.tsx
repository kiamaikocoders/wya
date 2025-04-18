
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";

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

  return (
    <div className="flex flex-col min-h-screen bg-kenya-dark">
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAdminPage && !isAuthPage && <Footer />}
      {!isAdminPage && !isAuthPage && <BottomNav />}
      
      {scrollToTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-20 right-4 p-2 bg-kenya-orange rounded-full shadow-lg z-50 transition-opacity duration-300"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
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
