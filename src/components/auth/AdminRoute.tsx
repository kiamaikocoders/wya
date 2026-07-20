import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/pages/AdminLogin';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeContext';
import { cn } from '@/lib/utils';

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminGateLoading() {
  const { theme } = useAdminTheme();
  return (
    <div
      className={cn(
        'admin-console flex min-h-screen items-center justify-center',
        theme === 'dark' && 'admin-console--dark',
        theme === 'dark' ? 'bg-[hsl(216,28%,7%)]' : 'bg-white'
      )}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#ff6b35]" />
    </div>
  );
}

/**
 * Standalone admin console gate:
 * - Unauthenticated → admin login (Figma)
 * - Authenticated non-admin → blocked
 * - Admin → admin dashboard shell
 */
const AdminRouteInner: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <AdminGateLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <AdminThemeProvider>
      <AdminRouteInner>{children}</AdminRouteInner>
    </AdminThemeProvider>
  );
};

export default AdminRoute;
