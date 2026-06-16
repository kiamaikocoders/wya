import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  initializeOneSignal,
  isOneSignalSupported,
  onNotificationClick,
  oneSignalLogin,
  oneSignalLogout,
} from "@/lib/onesignal";

function resolveNotificationPath(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    if (url.startsWith("/")) return url;
  }
  return "/notifications";
}

/**
 * Initializes OneSignal, binds Supabase user IDs as external IDs, and routes push clicks.
 */
export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOneSignalSupported()) return;

    initializeOneSignal().catch((error) => {
      console.warn("[OneSignal] init failed:", error);
    });
  }, []);

  useEffect(() => {
    if (!isOneSignalSupported()) return;

    let cancelled = false;

    const syncAuth = async () => {
      try {
        if (isAuthenticated && user?.id) {
          await oneSignalLogin(user.id);
        } else {
          await oneSignalLogout();
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[OneSignal] auth sync failed:", error);
        }
      }
    };

    syncAuth();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isOneSignalSupported()) return;

    let removeClickListener: (() => void) | null = null;

    onNotificationClick((url) => {
      navigate(resolveNotificationPath(url));
    }).then((remove) => {
      removeClickListener = remove;
    });

    return () => {
      removeClickListener?.();
    };
  }, [navigate]);

  return <>{children}</>;
}
