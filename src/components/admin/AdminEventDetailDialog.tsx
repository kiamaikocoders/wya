import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, MapPin, Ticket, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminEvent } from '@/lib/admin-service';
import { sponsorService } from '@/lib/sponsor';
import { AdminStatusPill } from '@/components/admin/AdminPageShell';

type Props = {
  event: AdminEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (event: AdminEvent) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onCancelOccurrence?: (id: number) => void;
  onRestoreOccurrence?: (id: number) => void;
  onCancelFuture?: (id: number) => void;
  onDelete?: (id: number) => void;
};

function formatWhen(event: AdminEvent): string {
  try {
    const d = format(parseISO(event.date), 'EEEE, d MMM yyyy');
    const start = event.time?.slice(0, 5);
    const end = event.end_time?.slice(0, 5);
    if (start && end) return `${d} · ${start} – ${end}`;
    if (start) return `${d} · ${start}`;
    return d;
  } catch {
    return event.date || '—';
  }
}

function formatPrice(price?: number): string {
  if (price == null || price <= 0) return 'Free';
  return `KES ${price.toLocaleString()}`;
}

/**
 * Admin event detail modal — Figma 15 Event Detail Popup (358:2) adapted for admin console tokens + actions.
 */
export function AdminEventDetailDialog({
  event,
  open,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onCancelOccurrence,
  onRestoreOccurrence,
  onCancelFuture,
  onDelete,
}: Props) {
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

  const sponsorsQuery = useQuery({
    queryKey: ['admin-event-sponsors', event?.id],
    queryFn: () => sponsorService.getEventSponsors(Number(event!.id)),
    enabled: open && !!event?.id,
    retry: false,
  });

  const expectLines = useMemo(() => {
    if (event?.performing_artists?.length) {
      return event.performing_artists.slice(0, 8);
    }
    const desc = event?.description || '';
    const lines = desc
      .split('\n')
      .map((l) => l.replace(/^[\s•\-]+/, '').trim())
      .filter(Boolean)
      .slice(0, 4);
    return lines.length > 1 ? lines : [];
  }, [event?.description, event?.performing_artists]);

  if (!open || !event) return null;

  const place = event.location?.split(',')[0]?.trim() || event.location || 'Kenya';
  const subtitle = `${place} · ${event.category || 'Event'}`;
  const statusTone =
    event.status === 'approved'
      ? ('success' as const)
      : event.status === 'pending'
        ? ('warning' as const)
        : event.status === 'rejected'
          ? ('error' as const)
          : ('muted' as const);

  const sponsors = (sponsorsQuery.data ?? [])
    .filter((es) => es.sponsor)
    .slice(0, 3);

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)] backdrop-blur-[2px]"
        aria-label="Close event details"
        onClick={onClose}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-event-detail-title"
          className="pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border border-border bg-background shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="relative h-[180px] w-full shrink-0 overflow-hidden sm:h-[240px]">
            {event.image_url ? (
              <img src={event.image_url} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[hsl(var(--admin-surface-2))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(13,18,23,0.55)]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
              <div className="flex flex-wrap gap-2">
                {event.featured ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    Featured
                  </span>
                ) : null}
                {event.category ? (
                  <span className="rounded-full border border-border bg-[hsl(var(--admin-surface-2))] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {event.category}
                  </span>
                ) : null}
                <AdminStatusPill tone={statusTone}>
                  {event.status === 'approved'
                    ? '✓ Approved'
                    : event.status === 'pending'
                      ? 'Pending'
                      : event.status === 'rejected'
                        ? 'Rejected'
                        : event.status || '—'}
                </AdminStatusPill>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    event.is_recurring
                      ? 'bg-primary/15 text-primary'
                      : 'border border-border bg-[hsl(var(--admin-surface-2))] text-muted-foreground',
                  )}
                >
                  {event.is_recurring ? 'Recurring' : 'One-time'}
                </span>
                {event.cancelled_at ? (
                  <span className="rounded-full bg-[hsl(var(--admin-error)/0.15)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--admin-error))]">
                    Cancelled date
                  </span>
                ) : null}
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
                  id="admin-event-detail-title"
                  className="text-[26px] font-extrabold text-foreground"
                >
                  {event.title}
                </h2>
                <p className="text-[13px] text-muted-foreground">{subtitle}</p>
              </div>

              <div className="space-y-2.5 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <MetaRow icon={<Calendar className="size-3.5 text-primary" />} label="Date & time" value={formatWhen(event)} />
                <MetaRow
                  icon={<Calendar className="size-3.5 text-primary" />}
                  label="Schedule"
                  value={
                    event.is_recurring
                      ? event.series?.summary || 'Recurring series'
                      : 'One-time event'
                  }
                />
                <MetaRow icon={<MapPin className="size-3.5 text-primary" />} label="Venue" value={event.location || '—'} />
                <MetaRow
                  icon={<Ticket className="size-3.5 text-primary" />}
                  label="Tickets"
                  value={
                    event.tickets_sold != null
                      ? `${formatPrice(event.price)} · ${event.tickets_sold} sold`
                      : formatPrice(event.price)
                  }
                />
                <MetaRow
                  icon={<Users className="size-3.5 text-primary" />}
                  label="Attendance"
                  value={
                    event.capacity
                      ? `${event.attendees_count ?? 0} / ${event.capacity} capacity`
                      : `${event.attendees_count ?? 0} going`
                  }
                />
              </div>

              {event.description ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    ABOUT THIS EVENT
                  </p>
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-foreground">
                    {event.description}
                  </p>
                </div>
              ) : null}

              {expectLines.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    {event.performing_artists?.length ? 'PERFORMING ARTISTS' : 'WHAT TO EXPECT'}
                  </p>
                  <div className="rounded-xl border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-2.5 text-xs leading-[18px] text-foreground">
                    {expectLines.map((line) => (
                      <p key={line}>•  {line}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 rounded-xl border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {(event.organizer_name || 'W').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
                    ORGANIZED BY
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.organizer_name || 'No organizer'}
                  </p>
                </div>
              </div>

              {sponsors.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    SPONSORS
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {sponsors.map((es) => (
                      <div
                        key={es.id ?? es.sponsor!.id}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-[hsl(var(--admin-surface))] px-3 py-3.5"
                      >
                        {es.sponsor!.logo_url ? (
                          <img
                            src={es.sponsor!.logo_url}
                            alt={es.sponsor!.name}
                            className="h-10 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-foreground">
                            {es.sponsor!.name}
                          </span>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {String(es.sponsorship_type || 'Partner')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2.5 pt-1">
                {event.status === 'pending' && onApprove ? (
                  <button
                    type="button"
                    className="flex-1 rounded-[10px] bg-primary py-3 text-sm font-bold text-primary-foreground"
                    onClick={() => onApprove(event.id)}
                  >
                    {event.is_recurring
                      ? `Approve series (${event.series?.occurrence_total ?? ''} dates)`
                      : 'Approve'}
                  </button>
                ) : null}
                {event.status === 'pending' && onReject ? (
                  <button
                    type="button"
                    className="flex-1 rounded-[10px] border border-border py-3 text-sm font-semibold text-[hsl(var(--admin-error))]"
                    onClick={() => onReject(event.id)}
                  >
                    {event.is_recurring ? 'Reject series' : 'Reject'}
                  </button>
                ) : null}
                {event.status !== 'pending' && event.cancelled_at && onRestoreOccurrence ? (
                  <button
                    type="button"
                    className="flex-1 rounded-[10px] bg-primary py-3 text-sm font-bold text-primary-foreground"
                    onClick={() => onRestoreOccurrence(event.id)}
                  >
                    Restore this date
                  </button>
                ) : null}
                {event.status !== 'pending' && !event.cancelled_at && onCancelOccurrence ? (
                  <button
                    type="button"
                    className="flex-1 rounded-[10px] border border-border py-3 text-sm font-semibold text-[hsl(var(--admin-error))]"
                    onClick={() => onCancelOccurrence(event.id)}
                  >
                    {event.is_recurring ? 'Cancel this date' : 'Cancel event'}
                  </button>
                ) : null}
                {event.status !== 'pending' &&
                !event.cancelled_at &&
                event.is_recurring &&
                onCancelFuture ? (
                  <button
                    type="button"
                    className="flex-1 rounded-[10px] border border-border py-3 text-sm font-semibold text-[hsl(var(--admin-error))]"
                    onClick={() => onCancelFuture(event.id)}
                  >
                    Cancel this & future
                  </button>
                ) : null}
                {onEdit ? (
                  <button
                    type="button"
                    className={cn(
                      'rounded-[10px] border border-border py-3 text-sm font-semibold text-foreground',
                      event.status === 'pending' || event.cancelled_at ? 'flex-1' : 'w-full',
                    )}
                    onClick={() => onEdit(event)}
                  >
                    Edit event
                  </button>
                ) : null}
                {event.status !== 'pending' && onDelete ? (
                  <button
                    type="button"
                    className="w-full rounded-[10px] border border-[hsl(var(--admin-error)/0.4)] bg-[hsl(var(--admin-error)/0.1)] py-3 text-sm font-semibold text-[hsl(var(--admin-error))]"
                    onClick={() => onDelete(event.id)}
                  >
                    {event.is_recurring ? 'Delete entire series' : 'Delete event'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
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
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--admin-surface-2))]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="block text-[13px] font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}
