import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { isNativeApp } from '@/lib/post-auth-navigation';

const Home = lazy(() => import('@/pages/Home'));

/**
 * `/home` is the full app dashboard on native; on web it redirects to the light account hub.
 */
const HomeOrAccountRedirect = () => {
  if (!isNativeApp()) {
    return <Navigate to="/account" replace />;
  }
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-kenya-orange" />
        </div>
      }
    >
      <Home />
    </Suspense>
  );
};

export default HomeOrAccountRedirect;
