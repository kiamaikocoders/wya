import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  Images,
  Inbox,
  ArrowLeftRight,
  Wallet,
  Settings2,
  Megaphone,
  ScrollText,
  Bell,
  Mail,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard }],
  },
  {
    title: 'People & access',
    items: [{ label: 'Users', path: '/admin/users', icon: Users }],
  },
  {
    title: 'Events',
    items: [
      { label: 'Events', path: '/admin/events', icon: Calendar },
      { label: 'Proposals', path: '/admin/proposals', icon: FileText },
    ],
  },
  {
    title: 'Money & tickets',
    items: [
      { label: 'Finance & Tickets', path: '/admin/finance', icon: Wallet },
      { label: 'Marketplace', path: '/admin/marketplace', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Moderation', path: '/admin/moderation', icon: MessageSquare },
      { label: 'App feedback', path: '/admin/feedback', icon: Inbox },
      { label: 'Event media', path: '/admin/media-gallery', icon: Images },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Communications', path: '/admin/communications', icon: Megaphone },
      { label: 'Analytics', path: '/admin/analytics', icon: ActivitySquare },
      { label: 'Sponsor Analytics', path: '/admin/sponsor-analytics', icon: BarChart3 },
      { label: 'Ghost', path: '/admin/ghost', icon: Ghost },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', path: '/admin/notifications', icon: Bell },
      { label: 'System', path: '/admin/system', icon: Settings2 },
      { label: 'Email', path: '/admin/email', icon: Mail },
      { label: 'Audit log', path: '/admin/audit', icon: ScrollText },
    ],
  },
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login');
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileToggle}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-card transition-all duration-300',
          isCollapsed ? 'w-[72px]' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!isCollapsed && (
            <Link to="/admin" className="font-semibold tracking-tight text-foreground">
              WYA Admin
            </Link>
          )}
          <div className="flex items-center gap-1">
            <div className="hidden lg:block">
              <NotificationBell />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', isCollapsed && 'rotate-180')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMobileToggle}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {sidebarSections.map((section, idx) => (
            <div key={section.title ?? `section-${idx}`} className="space-y-1">
              {section.title && !isCollapsed ? (
                <div className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
              ) : null}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobileOpen) onMobileToggle();
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!isCollapsed ? (
            <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 text-destructive hover:text-destructive',
              isCollapsed && 'justify-center px-0'
            )}
            onClick={() => void handleLogout()}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
