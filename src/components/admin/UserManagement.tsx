import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminPagination,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import {
  AdminUserDetailDialog,
  adminUserRoleLabel,
} from '@/components/admin/AdminUserDetailDialog';
import { adminService, type AdminUser } from '@/lib/admin-service';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { DEFAULT_LIST_PAGE_SIZE } from '@/hooks/use-list-pagination';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AdminUser | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const statsQuery = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users-figma', search, status, page],
    queryFn: () =>
      adminService.getUsers({
        page,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        search,
        status,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }),
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users-figma'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
  };

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: (_d, id) => {
      toast.success('User suspended');
      invalidateUsers();
      if (viewing?.id === id) setViewing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.restoreUserAccount(id),
    onSuccess: () => {
      toast.success('User activated');
      invalidateUsers();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => adminService.banUser(id, 'Banned by administrator'),
    onSuccess: (_d, id) => {
      toast.success('User banned');
      invalidateUsers();
      if (viewing?.id === id) setViewing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const softDeleteMutation = useMutation({
    mutationFn: (id: string) => adminService.softDeleteUserAccount(id),
    onSuccess: (_d, id) => {
      toast.success('User soft-deleted');
      invalidateUsers();
      if (viewing?.id === id) setViewing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => adminService.hardDeleteUserAccount(id),
    onSuccess: (_d, id) => {
      toast.success('User permanently deleted');
      invalidateUsers();
      if (viewing?.id === id) setViewing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'attendee' | 'admin' }) =>
      adminService.updateUserRole(id, role),
    onSuccess: (_d, vars) => {
      toast.success(vars.role === 'admin' ? 'Admin role transferred' : 'Admin access revoked');
      invalidateUsers();
      void usersQuery.refetch().then((res) => {
        const next = res.data?.data?.find((u) => u.id === vars.id);
        if (next) setViewing(next);
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 1;

  const actionBusy =
    suspendMutation.isPending ||
    activateMutation.isPending ||
    banMutation.isPending ||
    softDeleteMutation.isPending ||
    hardDeleteMutation.isPending ||
    roleMutation.isPending;

  // Keep popup in sync after list refetch
  useEffect(() => {
    if (!viewing) return;
    const next = users.find((u) => u.id === viewing.id);
    if (next && next !== viewing) setViewing(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when list data changes
  }, [users]);

  return (
    <div className="space-y-3.5">
      <AdminKpiRow>
        <AdminKpiTile
          label="Registered"
          value={(stats?.total_registered_profiles ?? 0).toLocaleString()}
        />
        <AdminKpiTile label="Active" value={(stats?.active_users ?? 0).toLocaleString()} />
        <AdminKpiTile label="Organizers" value={(stats?.organizers ?? 0).toLocaleString()} />
        <AdminKpiTile
          label="Suspended"
          value={Math.max(
            0,
            (stats?.total_registered_profiles ?? 0) -
              (stats?.active_users ?? 0) -
              (stats?.ghost_users ?? 0)
          ).toLocaleString()}
          hint="Inactive accounts"
        />
      </AdminKpiRow>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search people…"
        />
        <AdminFilterSelect
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            { value: 'all', label: 'Status: All' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <AdminSectionPanel title="People">
        {usersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No people found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const suspended = u.status === 'suspended' || u.status === 'inactive';
              const role = adminUserRoleLabel(u);
              const initials = (u.name || u.username || 'U')
                .split(/\s+/)
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setViewing(u)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[10px] border border-border bg-[hsl(var(--admin-surface))] p-3 text-left transition-colors hover:bg-[hsl(var(--admin-surface-2))]'
                  )}
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-full bg-[hsl(var(--admin-surface-2))] sm:size-14">
                    {resolveAvatarUrl(u.profile_picture) ? (
                      <img
                        src={resolveAvatarUrl(u.profile_picture)}
                        alt=""
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        'flex size-full items-center justify-center text-xs font-semibold text-muted-foreground',
                        resolveAvatarUrl(u.profile_picture) ? 'hidden' : undefined
                      )}
                    >
                      {initials}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {u.name || u.username || 'User'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {u.email || 'No email'} · {role}
                      {u.location ? ` · ${u.location}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <AdminStatusPill tone={suspended ? 'error' : 'success'}>
                      {suspended ? 'Suspended' : '✓ Active'}
                    </AdminStatusPill>
                    {suspended ? (
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          activateMutation.mutate(u.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            activateMutation.mutate(u.id);
                          }
                        }}
                      >
                        Activate
                      </span>
                    ) : u.username !== 'admin' ? (
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          suspendMutation.mutate(u.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            suspendMutation.mutate(u.id);
                          }
                        }}
                      >
                        Suspend
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            <AdminPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={DEFAULT_LIST_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </AdminSectionPanel>

      <AdminUserDetailDialog
        user={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        busy={actionBusy}
        onChangeRole={(role) => {
          if (!viewing) return;
          roleMutation.mutate({ id: viewing.id, role });
        }}
        onSuspend={() => viewing && suspendMutation.mutate(viewing.id)}
        onActivate={() => viewing && activateMutation.mutate(viewing.id)}
        onBan={() => viewing && banMutation.mutate(viewing.id)}
        onSoftDelete={() => viewing && softDeleteMutation.mutate(viewing.id)}
        onHardDelete={() => viewing && hardDeleteMutation.mutate(viewing.id)}
        onOpenProfile={() => {
          if (!viewing) return;
          navigate(`/users/${viewing.id}`);
        }}
      />
    </div>
  );
};

export default UserManagement;
