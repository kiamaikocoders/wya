import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#stories", label: "Community" },
  { href: "#ai", label: "AI" },
  { href: "#faq", label: "FAQ" },
];

const MarketingNavbar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/signup");
    }
  };

  const handleSecondaryCta = () => {
    if (isAuthenticated) {
      navigate("/events");
    } else {
      navigate("/login");
    }
  };

  const shouldHighlight = (hash: string) => {
    return location.hash === hash;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "backdrop-blur-xl bg-black/70 shadow-lg shadow-black/10" : ""
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-3">
          <img
            src="/wya logo.png"
            alt="WYA logo"
            className="h-8 w-auto drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)]"
            loading="lazy"
          />
          <span className="text-lg font-semibold tracking-wide">WYA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-kenya-brown-light">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-white",
                shouldHighlight(link.href) && "text-white"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-kenya-brown-light hover:text-white hover:bg-white/10"
            onClick={handleSecondaryCta}
          >
            {isAuthenticated ? "Explore Events" : "Log In"}
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-br from-kenya-orange via-amber-400 to-kenya-orange shadow-[0_0_20px_rgba(255,128,0,0.45)] hover:shadow-[0_0_30px_rgba(255,128,0,0.55)] text-kenya-dark"
            onClick={handlePrimaryCta}
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MarketingNavbar;


