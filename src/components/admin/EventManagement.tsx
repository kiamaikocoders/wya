import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminPagination,
  AdminPrimaryPill,
  AdminSearchInput,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import { adminService, type AdminEvent } from '@/lib/admin-service';
import { DEFAULT_LIST_PAGE_SIZE } from '@/hooks/use-list-pagination';
import AdminCreateEvent from './AdminCreateEvent';
import AdminEditEvent from './AdminEditEvent';
import { AdminEventDetailDialog } from './AdminEventDetailDialog';
import { cn } from '@/lib/utils';

function formatKesCompact(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString()}`;
}

const EventManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [viewing, setViewing] = useState<AdminEvent | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const statsQuery = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
  });

  const eventsQuery = useQuery({
    queryKey: ['admin-events-figma', search, status, page],
    queryFn: () =>
      adminService.getEvents({
        page,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        search,
        status,
      }),
  });

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
    queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminService.approveEvent(id),
    onSuccess: () => {
      toast.success('Event approved');
      setViewing(null);
      invalidateEvents();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminService.rejectEvent(id),
    onSuccess: () => {
      toast.success('Event rejected');
      setViewing(null);
      invalidateEvents();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const events = eventsQuery.data?.data ?? [];
  const total = eventsQuery.data?.total ?? 0;
  const totalPages = eventsQuery.data?.totalPages ?? 1;

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

  if (showCreate) {
    return (
      <AdminCreateEvent
        onSuccess={() => {
          setShowCreate(false);
          invalidateEvents();
        }}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

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
          <div className="space-y-2.5">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_88px_160px] gap-3 rounded-lg bg-[hsl(var(--admin-surface-2))] px-3 py-2 text-[11px] font-semibold text-muted-foreground md:grid">
              <span>Event</span>
              <span>Details</span>
              <span>When</span>
              <span>Tickets</span>
              <span className="text-right">Actions</span>
            </div>

            {events.map((event) => {
              let when = '—';
              try {
                when = format(parseISO(event.date), 'MMM d');
              } catch {
                when = event.date?.slice(0, 10) || '—';
              }

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setViewing(event)}
                  className={cn(
                    'grid w-full grid-cols-1 items-center gap-3 rounded-[10px] border border-border bg-[hsl(var(--admin-surface))] p-3 text-left transition-colors hover:bg-[hsl(var(--admin-surface-2))]',
                    'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_88px_160px]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-[hsl(var(--admin-surface-2))] sm:h-14 sm:w-[88px]">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                          No banner
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {event.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {event.organizer_name || 'No organizer'}
                        {event.featured ? ' · Featured' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {event.category || 'Event'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {event.location || '—'}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">{when}</p>

                  <p className="text-xs text-muted-foreground">
                    {event.price && event.price > 0
                      ? `KES ${event.price.toLocaleString()}`
                      : 'Free'}
                    {event.tickets_sold != null ? (
                      <span className="block text-[10px]">{event.tickets_sold} sold</span>
                    ) : null}
                  </p>

                  <div
                    className="flex flex-wrap items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <AdminStatusPill tone={statusTone(event.status)}>
                      {statusLabel(event.status)}
                    </AdminStatusPill>
                    {event.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="rounded-[10px] bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground"
                          onClick={() => approveMutation.mutate(event.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-[10px] border border-border px-3 py-2 text-[12px] font-semibold text-[hsl(var(--admin-error))]"
                          onClick={() => rejectMutation.mutate(event.id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-[10px] border border-border px-3 py-2 text-[12px] font-semibold text-foreground"
                        onClick={() => setEditing(event)}
                      >
                        Edit
                      </button>
                    )}
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

      <AdminEventDetailDialog
        event={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={(ev) => {
          setViewing(null);
          setEditing(ev);
        }}
        onApprove={(id) => approveMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
      />

      {editing ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 sm:p-8">
          <AdminEditEvent
            event={editing}
            onSuccess={() => {
              setEditing(null);
              invalidateEvents();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default EventManagement;
