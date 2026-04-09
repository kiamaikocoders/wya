import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare, 
  ActivitySquare, 
  BarChart3,
  Ghost,
  ChevronLeft,
  Menu,
  X,
  Images,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Events', path: '/admin/events', icon: Calendar },
  { label: 'Proposals', path: '/admin/proposals', icon: FileText },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Content Moderation', path: '/admin/moderation', icon: MessageSquare },
  { label: 'App feedback', path: '/admin/feedback', icon: Inbox },
  { label: 'Event media', path: '/admin/media-gallery', icon: Images },
  { label: 'Analytics', path: '/admin/analytics', icon: ActivitySquare },
  { label: 'Sponsor Analytics', path: '/admin/sponsor-analytics', icon: BarChart3 },
  { label: 'Ghost Management', path: '/admin/ghost', icon: Ghost },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileToggle,
}) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <h2 className="text-lg font-bold text-foreground">ADMIN MENU</h2>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="hidden lg:flex h-8 w-8"
              >
                <ChevronLeft
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isCollapsed && 'rotate-180'
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileToggle}
                className="lg:hidden h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Close mobile menu when item is clicked
                    if (window.innerWidth < 1024) {
                      onMobileToggle();
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

