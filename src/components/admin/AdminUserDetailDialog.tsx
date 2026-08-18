import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Calendar,
  Mail,
  MapPin,
  Shield,
  Ticket,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/lib/admin-service';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { AdminStatusPill } from '@/components/admin/AdminPageShell';
import { AdminAiInlineNote } from '@/components/admin/AdminAiAssist';
import { analyzeUserForAdmin } from '@/lib/admin-ai-analysis';

export function adminUserRoleLabel(u: AdminUser): string {
  if (u.role === 'admin' || u.username === 'admin') return 'Admin';
  if (u.role === 'organizer') return 'Organizer';
  return 'Attendee';
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--admin-surface-2))]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

type Props = {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onChangeRole: (role: 'attendee' | 'admin') => void;
  onSuspend: () => void;
  onActivate: () => void;
  onBan: () => void;
  onSoftDelete: () => void;
  onHardDelete: () => void;
  onOpenProfile: () => void;
};

/**
 * Admin user detail modal — mirrors AdminEventDetailDialog shell (avatar hero + meta + actions).
 */
export function AdminUserDetailDialog({
  user,
  open,
  onClose,
  busy,
  onChangeRole,
  onSuspend,
  onActivate,
  onBan,
  onSoftDelete,
  onHardDelete,
  onOpenProfile,
}: Props) {
  const [roleDraft, setRoleDraft] = useState<'attendee' | 'admin'>('attendee');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const avatarSrc = resolveAvatarUrl(user?.profile_picture);

  useEffect(() => {
    if (!user) return;
    setRoleDraft(user.username === 'admin' || user.role === 'admin' ? 'admin' : 'attendee');
    setAvatarBroken(false);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  const suspended = user.status === 'suspended' || user.status === 'inactive';
  const isAdminUser = user.username === 'admin' || user.role === 'admin';
  const displayRole = adminUserRoleLabel(user);
  const joined = (() => {
    try {
      return format(parseISO(user.created_at), 'd MMM yyyy');
    } catch {
      return user.created_at?.slice(0, 10) || '—';
    }
  })();
  const lastActive = (() => {
    if (!user.last_active) return '—';
    try {
      return formatDistanceToNow(parseISO(user.last_active), { addSuffix: true });
    } catch {
      return user.last_active;
    }
  })();

  const initials = (user.name || user.username || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)] backdrop-blur-[2px]"
        aria-label="Close user details"
        onClick={onClose}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-detail-title"
          className="pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-[20px] border border-border bg-background shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="relative h-[160px] w-full shrink-0 overflow-hidden sm:h-[200px]">
            {avatarSrc && !avatarBroken ? (
              <img
                src={avatarSrc}
                alt=""
                className="absolute inset-0 size-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--admin-surface-2))]">
                <span className="text-4xl font-bold text-muted-foreground">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(13,18,23,0.55)]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
              <div className="flex flex-wrap gap-2">
                <AdminStatusPill tone={isAdminUser ? 'primary' : 'muted'}>
                  {displayRole}
                </AdminStatusPill>
                <AdminStatusPill tone={suspended ? 'error' : 'success'}>
                  {suspended ? 'Suspended' : '✓ Active'}
                </AdminStatusPill>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full bg-black/45 text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-7">
            <div className="flex flex-col gap-4 pb-5">
              <div className="space-y-1.5">
                <h2
                  id="admin-user-detail-title"
                  className="text-[26px] font-extrabold text-foreground"
                >
                  {user.name || user.username || 'User'}
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  @{user.username || 'unknown'}
                  {user.location ? ` · ${user.location}` : ''}
                </p>
              </div>

              <div className="space-y-2.5 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <MetaRow
                  icon={<Mail className="size-3.5 text-primary" />}
                  label="Email"
                  value={user.email || 'No email on file'}
                />
                <MetaRow
                  icon={<Shield className="size-3.5 text-primary" />}
                  label="Role"
                  value={
                    displayRole === 'Organizer'
                      ? 'Organizer (hosts events)'
                      : displayRole
                  }
                />
                <MetaRow
                  icon={<Calendar className="size-3.5 text-primary" />}
                  label="Joined"
                  value={joined}
                />
                <MetaRow
                  icon={<UserRound className="size-3.5 text-primary" />}
                  label="Last active"
                  value={lastActive}
                />
                {user.location ? (
                  <MetaRow
                    icon={<MapPin className="size-3.5 text-primary" />}
                    label="Location"
                    value={user.location}
                  />
                ) : null}
                <MetaRow
                  icon={<Ticket className="size-3.5 text-primary" />}
                  label="Events"
                  value={`${user.events_attended ?? 0} attended · ${user.events_created ?? 0} created`}
                />
                <MetaRow
                  icon={<Users className="size-3.5 text-primary" />}
                  label="Social"
                  value={`${user.followers_count ?? 0} followers · ${user.following_count ?? 0} following`}
                />
              </div>

              {user.bio ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    BIO
                  </p>
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-foreground">
                    {user.bio}
                  </p>
                </div>
              ) : null}

              {user.account_status_reason ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[12px] text-foreground">
                  Status note: {user.account_status_reason}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                  CHANGE ROLE
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Admin is the console operator (username admin). Making someone Admin transfers
                  that seat from the current admin.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={roleDraft}
                    onChange={(e) => setRoleDraft(e.target.value as 'attendee' | 'admin')}
                    disabled={busy}
                    className="h-10 rounded-[12px] border border-border bg-[hsl(var(--admin-surface))] px-3 text-sm text-foreground"
                  >
                    <option value="attendee">Member (attendee)</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      roleDraft === (isAdminUser ? 'admin' : 'attendee')
                    }
                    onClick={() => {
                      if (roleDraft === 'admin') {
                        const ok = window.confirm(
                          `Make ${user.name || user.username} the platform Admin? The current admin will be demoted to a member username.`
                        );
                        if (!ok) return;
                      }
                      onChangeRole(roleDraft);
                    }}
                    className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Apply role
                  </button>
                </div>
              </div>

              <AdminAiInlineNote
                label="AI notes"
                run={() =>
                  analyzeUserForAdmin({
                    name: user.name || user.username || 'User',
                    email: user.email,
                    role: displayRole,
                    status: user.status,
                    location: user.location,
                    events_attended: user.events_attended,
                    events_created: user.events_created,
                    followers_count: user.followers_count,
                    created_at: user.created_at,
                    last_active: user.last_active,
                    account_status_reason: user.account_status_reason,
                  })
                }
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-[hsl(var(--admin-surface))] px-5 py-3.5 sm:px-7">
            <button
              type="button"
              disabled={busy}
              onClick={onOpenProfile}
              className="rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground disabled:opacity-50"
            >
              Open profile
            </button>
            {suspended ? (
              <button
                type="button"
                disabled={busy}
                onClick={onActivate}
                className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Activate
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || isAdminUser}
                onClick={onSuspend}
                className={cn(
                  'rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-destructive disabled:opacity-50'
                )}
              >
                Suspend
              </button>
            )}
            <button
              type="button"
              disabled={busy || isAdminUser}
              onClick={() => {
                const ok = window.confirm(
                  `Ban ${user.name || user.username}? They will not be able to use the app until restored.`
                );
                if (ok) onBan();
              }}
              className="rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-destructive disabled:opacity-50"
            >
              Ban
            </button>
            <button
              type="button"
              disabled={busy || isAdminUser}
              onClick={() => {
                const ok = window.confirm(
                  `Soft-delete ${user.name || user.username}? Profile will be anonymized. Auth login remains until a full delete.`,
                );
                if (ok) onSoftDelete();
              }}
              className="rounded-full border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
            >
              Soft delete
            </button>
            <button
              type="button"
              disabled={busy || isAdminUser}
              onClick={() => {
                const ok = window.confirm(
                  `Permanently delete ${user.name || user.username} from Supabase? All app data and the auth account will be removed. This cannot be undone.`,
                );
                if (ok) onHardDelete();
              }}
              className="rounded-full border border-destructive bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
            >
              Delete permanently
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
