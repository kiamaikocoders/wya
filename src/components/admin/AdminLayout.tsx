import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAdminTheme } from './AdminThemeContext';
import { cn } from '@/lib/utils';

/**
 * Theme provider lives in AdminRoute so login + dashboard share the same light/dark preference.
 */
const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useAdminTheme();

  return (
    <div
      className={cn(
        'admin-console flex h-screen overflow-hidden bg-background text-foreground',
        theme === 'dark' && 'admin-console--dark'
      )}
    >
      <AdminSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen((open) => !open)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-[260px]">
        <AdminHeader onMenuClick={() => setIsMobileMenuOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
