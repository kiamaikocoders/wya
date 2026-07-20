import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminService, type AdminUser } from '@/lib/admin-service';

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');

  const statsQuery = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminService.getUserStats(),
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users-figma', search, status],
    queryFn: () =>
      adminService.getUsers({
        page: 1,
        pageSize: 50,
        search,
        status,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users-figma'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.restoreUserAccount(id),
    onSuccess: () => {
      toast.success('User activated');
      queryClient.invalidateQueries({ queryKey: ['admin-users-figma'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const users = usersQuery.data?.data ?? [];

  const roleLabel = (u: AdminUser) => {
    if (u.role === 'admin' || u.username === 'admin') return 'Admin';
    if (u.role === 'organizer') return 'Organizer';
    return 'Attendee';
  };

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
              return (
                <AdminListRow
                  key={u.id}
                  title={u.name || u.username || 'User'}
                  meta={`${u.email || 'No email'} · ${roleLabel(u)}`}
                  trailing={
                    <>
                      <AdminStatusPill tone={suspended ? 'error' : 'success'}>
                        {suspended ? 'Suspended' : '✓ Active'}
                      </AdminStatusPill>
                      {suspended ? (
                        <button
                          type="button"
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                          onClick={() => activateMutation.mutate(u.id)}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                          onClick={() => suspendMutation.mutate(u.id)}
                        >
                          Suspend
                        </button>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </AdminSectionPanel>
    </div>
  );
};

export default UserManagement;
