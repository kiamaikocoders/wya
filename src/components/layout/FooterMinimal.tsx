import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const socialLinks = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
];

const FooterMinimal = () => {
  return (
    <footer className="border-t border-white/5 bg-black/60 py-6 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 text-center text-white/70 sm:flex-row sm:text-left">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Link to="/home" className="text-sm font-semibold tracking-wide text-white">
            WYA Kenya
          </Link>
          <span className="text-xs text-white/50">
            © {new Date().getFullYear()} WYA Kenya. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-4">
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-kenya-orange/60 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default FooterMinimal;

