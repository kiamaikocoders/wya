import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Banknote,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Ticket,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminKpiTile } from '@/components/admin/AdminPageShell';
import {
  AdminPanelHeader,
  AdminSectionLayout,
  useAdminSectionTab,
  type AdminSubnavItem,
} from '@/components/admin/AdminSubnavLayout';
import {
  adminPlatformService,
  type AdminFinanceOverview,
  type AdminPaymentRow,
  type AdminTicketRow,
} from '@/lib/admin-platform-service';

type FinanceTab = 'overview' | 'payments' | 'tickets';

const FINANCE_NAV: AdminSubnavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: Banknote },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
];

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function formatKes(n?: number | null) {
  return `KES ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /admin_finance|does not exist|schema cache|Admin only/i.test(msg);
}

const FinancePanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [active, setActive] = useAdminSectionTab<FinanceTab>(
    FINANCE_NAV as { id: FinanceTab }[],
    'overview'
  );
  const [ticketFilter, setTicketFilter] = useState('all');

  const overviewQuery = useQuery({
    queryKey: ['admin-finance-overview'],
    queryFn: () => adminPlatformService.getFinanceOverview(),
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-finance-payments'],
    queryFn: () => adminPlatformService.getRecentPayments(60),
    retry: false,
    enabled: active === 'payments' || active === 'overview',
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-finance-tickets', ticketFilter],
    queryFn: () =>
      adminPlatformService.getRecentTickets({
        status: ticketFilter === 'all' ? undefined : ticketFilter,
        limit: 60,
      }),
    retry: false,
    enabled: active === 'tickets',
  });

  const cancelMutation = useMutation({
    mutationFn: (ticketId: number) =>
      adminPlatformService.cancelTicket(ticketId, 'Cancelled by admin from Finance'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-finance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const schemaMissing = useMemo(
    () => isSchemaMissing(overviewQuery.error),
    [overviewQuery.error]
  );

  const overview: AdminFinanceOverview | null = overviewQuery.data ?? null;
  const payments: AdminPaymentRow[] = paymentsQuery.data ?? [];
  const tickets: AdminTicketRow[] = ticketsQuery.data ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-finance-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-finance-tickets'] });
  };

  return (
    <AdminSectionLayout
      title="Finance & Tickets"
      subtitle="One section at a time — overview, payments, or ticket ops"
      actions={
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
      items={FINANCE_NAV}
      active={active}
      onChange={(id) => setActive(id as FinanceTab)}
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Finance overview unavailable</AlertTitle>
          <AlertDescription>
            Apply <code>admin_superadmin_platform</code> after the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {active === 'overview' && (
        <>
          <AdminPanelHeader
            title="Overview"
            description="Cash and ticket health at a glance. Open Payments or Tickets for detail."
          />
          {overviewQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : overview ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminKpiTile
                label="Payments completed"
                value={formatKes(overview.payments.completed_amount)}
                hint={`${formatKes(overview.payments.pending_amount)} pending`}
              />
              <AdminKpiTile
                label="Tickets confirmed"
                value={String(overview.tickets.confirmed)}
                hint={`${overview.tickets.pending} pending · ${overview.tickets.cancelled} cancelled`}
              />
              <AdminKpiTile
                label="Marketplace fees"
                value={formatKes(overview.marketplace.fees_collected)}
                hint="Platform fee collected"
              />
              <AdminKpiTile
                label="Payouts pending"
                value={formatKes(overview.marketplace.payouts_pending_amount)}
                hint={`${overview.marketplace.payouts_failed_count} failed · ${formatKes(overview.marketplace.payouts_paid_amount)} paid`}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No overview data yet.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActive('payments')}>
              <Banknote className="mr-2 h-4 w-4" />
              Open payments
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActive('tickets')}>
              <Ticket className="mr-2 h-4 w-4" />
              Open tickets
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/marketplace">
                <Wallet className="mr-2 h-4 w-4" />
                Marketplace
              </a>
            </Button>
          </div>
        </>
      )}

      {active === 'payments' && (
        <>
          <AdminPanelHeader
            title="Payments"
            description="Recent rows from the payments ledger."
          />
          {paymentsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Banknote className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No payments found</CardTitle>
                <CardDescription>
                  When M-Pesa/card payments land in <code>payments</code>, they show here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {payments.map((p) => (
                <li key={p.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">{formatKes(p.amount)}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {p.status}
                        </Badge>
                      </div>
                      <CardDescription className="font-mono text-xs break-all">
                        #{p.id}
                        {p.reference_code ? ` · ${p.reference_code}` : ''}
                        {p.payment_method ? ` · ${p.payment_method}` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      {formatWhen(p.created_at)}
                      {p.event_id != null ? ` · event #${p.event_id}` : ''}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {active === 'tickets' && (
        <>
          <AdminPanelHeader
            title="Tickets"
            description="Inventory ops — cancel revokes QR and unlists marketplace rows."
          />
          <div className="mb-4 flex justify-end gap-2 items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ticketsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No tickets</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {t.event_title || `Event #${t.event_id}`}
                          </CardTitle>
                          <CardDescription>
                            #{t.id} · {t.ticket_type} · {t.reference_code} · {formatKes(t.price)}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {t.status}
                          </Badge>
                          {t.status !== 'cancelled' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={cancelMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Cancel ticket #${t.id}? This revokes QR and unlists marketplace listings.`
                                  )
                                ) {
                                  cancelMutation.mutate(t.id);
                                }
                              }}
                            >
                              Cancel ticket
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Purchased {formatWhen(t.purchase_date)}
                      {t.event_date ? ` · event ${formatWhen(t.event_date)}` : ''}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AdminSectionLayout>
  );
};

export default FinancePanel;
