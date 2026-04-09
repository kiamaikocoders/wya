import { Link } from "react-router-dom";
import { Instagram, MessageSquarePlus } from "lucide-react";

const socialLinks = [
  { 
    href: "https://www.instagram.com/whereyouat.ke?utm_source=qr&igsh=NzdtNDR6eHUwYmk3", 
    icon: Instagram, 
    label: "Instagram",
    active: true
  },
  { 
    href: "#", 
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ), 
    label: "TikTok",
    active: false
  },
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

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:from-orange-600 hover:to-amber-600"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Send feedback
          </Link>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, icon: Icon, label, active }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`rounded-full border border-white/10 bg-white/5 p-2 transition ${
                  active
                    ? 'text-gradient-orange-accent border-kenya-orange/60 hover:border-kenya-orange hover:text-gradient-orange-accent'
                    : 'text-white/30 opacity-50 cursor-not-allowed hover:border-white/10 hover:text-white/30'
                }`}
              >
                {typeof Icon === 'function' ? <Icon /> : <Icon className="h-4 w-4" />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterMinimal;

