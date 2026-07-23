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
  X,
  Images,
  Inbox,
  ArrowLeftRight,
  Wallet,
  Settings2,
  Megaphone,
  ScrollText,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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
      { label: 'Audit log', path: '/admin/audit', icon: ScrollText },
    ],
  },
];

interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobileOpen, onMobileToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
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
          'fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-border bg-card transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-[52px] items-center justify-between border-b border-border px-4">
          <Link to="/admin" className="text-[15px] font-semibold text-foreground">
            WYA Admin
          </Link>
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

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-2 pt-2.5">
          {sidebarSections.map((section, idx) => (
            <div key={section.title ?? `section-${idx}`} className="pb-1.5">
              {section.title ? (
                <div className="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                      'mb-0.5 flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-xs transition-colors',
                      active
                        ? 'border border-primary bg-[hsl(var(--admin-surface-2))] font-semibold text-primary'
                        : 'border border-transparent font-medium text-muted-foreground hover:bg-[hsl(var(--admin-surface))] hover:text-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-primary' : 'text-muted-foreground'
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border px-3 pb-1 pt-2.5">
          <div className="rounded-[10px] bg-[hsl(var(--admin-surface))] px-2.5 py-2">
            <p className="truncate text-xs font-semibold text-foreground">
              {user?.name || 'Admin'}
            </p>
            <p className="text-[10px] text-muted-foreground">Super Admin</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full rounded-[10px] px-2.5 py-1.5 text-left text-xs font-medium text-[hsl(var(--admin-error))] hover:bg-destructive/5"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
