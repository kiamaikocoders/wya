import { lazy, Suspense } from 'react';
import { isNativeApp } from '@/lib/post-auth-navigation';

const Profile = lazy(() => import('@/pages/Profile'));
const WebProfile = lazy(() => import('@/pages/WebProfile'));

const fallback = (
  <div className="flex justify-center py-16">
    <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
  </div>
);

/**
 * Full social profile in the app; basic account profile on the light web surface.
 */
const ProfileBySurface = () => (
  <Suspense fallback={fallback}>
    {isNativeApp() ? <Profile /> : <WebProfile />}
  </Suspense>
);

export default ProfileBySurface;
