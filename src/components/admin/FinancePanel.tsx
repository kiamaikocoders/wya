import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Loader2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminOutlinePill,
  AdminPrimaryPill,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import {
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
import { adminService } from '@/lib/admin-service';

type FinanceTab = 'overview' | 'payments' | 'tickets';

const FINANCE_NAV: AdminSubnavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'payments', label: 'Payments' },
  { id: 'tickets', label: 'Tickets' },
];

function formatKes(n?: number | null) {
  return `KES ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function isSchemaMissing(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /admin_finance|does not exist|schema cache|Admin only/i.test(msg);
}

function paymentTone(status: string): 'success' | 'warning' | 'error' | 'muted' {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'success' || s === 'paid') return 'success';
  if (s === 'pending' || s === 'processing') return 'warning';
  if (s === 'failed' || s === 'cancelled') return 'error';
  return 'muted';
}

function paymentLabel(status: string) {
  if (/completed|success|paid/i.test(status)) return 'Completed';
  if (/pending/i.test(status)) return 'Pending';
  return status;
}

const FinancePanel: React.FC = () => {
  const navigate = useNavigate();
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

  const marketplaceStatsQuery = useQuery({
    queryKey: ['admin-marketplace-stats'],
    queryFn: () => adminService.getMarketplaceStats(),
    retry: false,
    enabled: active === 'overview',
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
      toast.success('Ticket cancelled');
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

  const completedPaymentsCount = payments.filter((p) =>
    /completed|success|paid/i.test(p.status)
  ).length;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-finance-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-finance-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-finance-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-stats'] });
  };

  return (
    <AdminSectionLayout
      title="Finance & Tickets"
      subtitle="One section at a time — overview, payments, or ticket ops"
      icon={Wallet}
      actions={<AdminRefreshButton onClick={refresh} />}
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
        <div className="space-y-3.5">
          {overviewQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AdminKpiRow>
              <AdminKpiTile
                label="Payments completed"
                value={(completedPaymentsCount || 0).toLocaleString()}
                hint="M-Pesa + card"
              />
              <AdminKpiTile
                label="Tickets confirmed"
                value={(overview?.tickets.confirmed ?? 0).toLocaleString()}
                hint="Active inventory"
              />
              <AdminKpiTile
                label="Marketplace fees"
                value={formatKes(overview?.marketplace.fees_collected)}
                hint="Seller fee"
              />
              <AdminKpiTile
                label="Payouts pending"
                value={String(
                  marketplaceStatsQuery.data?.pending_payouts ??
                    overview?.marketplace.payouts_failed_count ??
                    0
                )}
                hint="Needs retry"
              />
            </AdminKpiRow>
          )}

          <div className="flex flex-wrap gap-2">
            <AdminPrimaryPill onClick={() => setActive('payments')}>Open payments</AdminPrimaryPill>
            <AdminOutlinePill onClick={() => setActive('tickets')}>Open tickets</AdminOutlinePill>
            <AdminOutlinePill onClick={() => navigate('/admin/marketplace')}>
              Marketplace
            </AdminOutlinePill>
          </div>

          <AdminSectionPanel title="Recent payments">
            {paymentsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 8).map((p) => (
                  <AdminListRow
                    key={p.id}
                    title={formatKes(p.amount)}
                    meta={`${p.reference_code || `#${p.id}`} · ${p.payment_method || 'Payment'}`}
                    trailing={
                      <AdminStatusPill tone={paymentTone(p.status)}>
                        {paymentLabel(p.status)}
                      </AdminStatusPill>
                    }
                  />
                ))}
              </div>
            )}
          </AdminSectionPanel>
        </div>
      )}

      {active === 'payments' && (
        <AdminSectionPanel title="Payments">
          {paymentsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments found.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <AdminListRow
                  key={p.id}
                  title={formatKes(p.amount)}
                  meta={`${p.reference_code || `#${p.id}`} · ${p.payment_method || 'Payment'} · ${formatWhen(p.created_at)}`}
                  trailing={
                    <AdminStatusPill tone={paymentTone(p.status)}>
                      {paymentLabel(p.status)}
                    </AdminStatusPill>
                  }
                />
              ))}
            </div>
          )}
        </AdminSectionPanel>
      )}

      {active === 'tickets' && (
        <div className="space-y-3.5">
          <div className="flex justify-end">
            <AdminFilterSelect
              value={ticketFilter}
              onChange={setTicketFilter}
              options={[
                { value: 'all', label: 'Status: All' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'pending', label: 'Pending' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'active', label: 'Active' },
              ]}
            />
          </div>
          <AdminSectionPanel title="Tickets">
            {ticketsQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tickets.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <AdminListRow
                    key={t.id}
                    title={t.event_title || `Event #${t.event_id}`}
                    meta={`#${t.id} · ${t.ticket_type} · ${t.reference_code} · ${formatKes(t.price)}`}
                    trailing={
                      <>
                        <AdminStatusPill
                          tone={
                            t.status === 'cancelled'
                              ? 'error'
                              : t.status === 'pending'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {t.status}
                        </AdminStatusPill>
                        {t.status !== 'cancelled' ? (
                          <button
                            type="button"
                            className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-destructive"
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
                            Cancel
                          </button>
                        ) : null}
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </AdminSectionPanel>
        </div>
      )}
    </AdminSectionLayout>
  );
};

export default FinancePanel;
