import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { listenForForegroundMessages, refreshFcmToken } from '@/lib/fcm';
import { playNotificationSound } from '@/lib/sounds';

function resolvePath(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    if (url.startsWith('/')) return url;
  }
  return '/notifications';
}

export function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    void refreshFcmToken(user.id);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    return listenForForegroundMessages({
      onReceive: () => playNotificationSound(),
      onClick: (link) => navigate(resolvePath(link)),
    });
  }, [navigate]);

  return <>{children}</>;
}
