import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminPrimaryPill,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminService, type AdminEvent } from '@/lib/admin-service';
import AdminCreateEvent from './AdminCreateEvent';
import AdminEditEvent from './AdminEditEvent';

function formatKesCompact(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString()}`;
}

const EventManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);

  const statsQuery = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
  });

  const eventsQuery = useQuery({
    queryKey: ['admin-events-figma', search, status],
    queryFn: () =>
      adminService.getEvents({
        page: 1,
        pageSize: 50,
        search,
        status,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminService.approveEvent(id),
    onSuccess: () => {
      toast.success('Event approved');
      queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminService.rejectEvent(id),
    onSuccess: () => {
      toast.success('Event rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const events = eventsQuery.data?.data ?? [];

  const statusTone = (s?: string) => {
    if (s === 'approved') return 'success' as const;
    if (s === 'pending') return 'warning' as const;
    if (s === 'rejected') return 'error' as const;
    return 'muted' as const;
  };

  const statusLabel = (s?: string) => {
    if (s === 'approved') return '✓ Approved';
    if (s === 'pending') return 'Pending';
    if (s === 'rejected') return 'Rejected';
    return s || '—';
  };

  return (
    <div className="space-y-3.5">
      <AdminKpiRow>
        <AdminKpiTile label="Total" value={(stats?.total_events ?? 0).toLocaleString()} />
        <AdminKpiTile label="Pending" value={(stats?.pending_events ?? 0).toLocaleString()} />
        <AdminKpiTile label="This month" value={(stats?.events_this_month ?? 0).toLocaleString()} />
        <AdminKpiTile
          label="Revenue"
          value={formatKesCompact(stats?.total_revenue ?? 0)}
        />
      </AdminKpiRow>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search events…" />
        <AdminFilterSelect
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            { value: 'all', label: 'Status: All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <AdminPrimaryPill onClick={() => setShowCreate(true)}>+ Create event</AdminPrimaryPill>
      </div>

      <AdminSectionPanel title="Events">
        {eventsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No events found.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              let when = '—';
              try {
                when = format(parseISO(event.date), 'MMM d');
              } catch {
                when = event.date?.slice(0, 10) || '—';
              }
              return (
                <AdminListRow
                  key={event.id}
                  title={event.title}
                  meta={`${event.category || 'Event'} · ${event.organizer_name || 'Organizer'} · ${when}`}
                  trailing={
                    <>
                      <AdminStatusPill tone={statusTone(event.status)}>
                        {statusLabel(event.status)}
                      </AdminStatusPill>
                      {event.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                            onClick={() => approveMutation.mutate(event.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
                            onClick={() => rejectMutation.mutate(event.id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                          onClick={() => setEditing(event)}
                        >
                          Edit
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

      {showCreate ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:p-8">
          <AdminCreateEvent
            onSuccess={() => {
              setShowCreate(false);
              queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
              queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:p-8">
          <AdminEditEvent
            event={editing}
            onSuccess={() => {
              setEditing(null);
              queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
              queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default EventManagement;
