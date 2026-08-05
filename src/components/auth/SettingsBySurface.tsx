import { lazy, Suspense } from 'react';
import { isNativeApp } from '@/lib/post-auth-navigation';

const Settings = lazy(() => import('@/pages/Settings'));
const WebSettings = lazy(() => import('@/pages/WebSettings'));

const fallback = (
  <div className="flex justify-center py-16">
    <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
  </div>
);

/**
 * Full settings in the app; core account settings on the light web surface.
 */
const SettingsBySurface = () => (
  <Suspense fallback={fallback}>
    {isNativeApp() ? <Settings /> : <WebSettings />}
  </Suspense>
);

export default SettingsBySurface;
