import React, { useEffect, useState } from 'react';
import { StatusScreen } from '@/components/status/StatusScreen';

type Props = {
  children: React.ReactNode;
};

/**
 * Full-page Offline status when the browser reports no network.
 */
export function OfflineGate({ children }: Props) {
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (offline) {
    return (
      <StatusScreen
        variant="offline"
        onPrimary={() => window.location.reload()}
      />
    );
  }

  return <>{children}</>;
}

export default OfflineGate;
