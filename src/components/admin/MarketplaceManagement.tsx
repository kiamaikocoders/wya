import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, ArrowLeftRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminOutlinePill,
  AdminRefreshButton,
  AdminSectionPanel,
  AdminStatusPill,
} from '@/components/admin/AdminPageShell';
import {
  AdminSectionLayout,
  useAdminSectionTab,
  type AdminSubnavItem,
} from '@/components/admin/AdminSubnavLayout';
import { adminService } from '@/lib/admin-service';
import { adminPlatformService } from '@/lib/admin-platform-service';
import MarketplaceSettingsCard from '@/components/admin/MarketplaceSettingsCard';
import type {
  AdminMarketplaceStats,
  MarketplaceListing,
  MarketplacePayout,
  MarketplaceTransfer,
} from '@/lib/marketplace-service';

type MarketplaceTab = 'overview' | 'listings' | 'transfers' | 'payouts' | 'settings';

const MARKETPLACE_NAV: AdminSubnavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'listings', label: 'Listings' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'settings', label: 'Settings' },
];

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

function formatKes(amount: number | null | undefined): string {
  return `KES ${Number(amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function modeLabel(mode: string) {
  return mode === 'gift' ? 'Gift' : 'Paid transfer';
}

function listingTicketLabel(listing: MarketplaceListing) {
  const type =
    listing.items?.[0]?.ticket?.ticket_type ||
    (listing.ticket_count === 1 ? 'ticket' : 'tickets');
  return `${listing.ticket_count}× ${type}`;
}

function isMissingRelationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /marketplace_|relation|does not exist|schema cache|Could not find the table/i.test(msg);
}

const MarketplaceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [active, setActive] = useAdminSectionTab<MarketplaceTab>(
    MARKETPLACE_NAV as { id: MarketplaceTab }[],
    'overview'
  );
  const [listingFilter, setListingFilter] = useState('all');
  const [transferFilter, setTransferFilter] = useState('all');
  const [payoutFilter, setPayoutFilter] = useState('all');

  const statsQuery = useQuery({
    queryKey: ['admin-marketplace-stats'],
    queryFn: () => adminService.getMarketplaceStats(),
    retry: false,
  });

  const listingsQuery = useQuery({
    queryKey: ['admin-marketplace-listings', listingFilter],
    queryFn: () =>
      adminService.getMarketplaceListings({
        status: listingFilter === 'all' ? undefined : listingFilter,
        limit: 100,
      }),
    retry: false,
    enabled: active === 'listings' || active === 'overview',
  });

  const transfersQuery = useQuery({
    queryKey: ['admin-marketplace-transfers', transferFilter],
    queryFn: () =>
      adminService.getMarketplaceTransfers({
        status: transferFilter === 'all' ? undefined : transferFilter,
        limit: 100,
      }),
    retry: false,
    enabled: active === 'transfers',
  });

  const payoutsQuery = useQuery({
    queryKey: ['admin-marketplace-payouts', payoutFilter],
    queryFn: () =>
      adminService.getMarketplacePayouts({
        status: payoutFilter === 'all' ? undefined : payoutFilter,
        limit: 100,
      }),
    retry: false,
    enabled: active === 'payouts',
  });

  const retryMutation = useMutation({
    mutationFn: (payoutId: number) => adminService.retryMarketplacePayout(payoutId),
    onSuccess: () => {
      toast.success('Payout retry queued');
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-stats'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const forceCancelMutation = useMutation({
    mutationFn: (listingId: number) => adminPlatformService.forceCancelListing(listingId),
    onSuccess: () => {
      toast.success('Listing cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const schemaMissing = useMemo(() => {
    return [
      statsQuery.error,
      listingsQuery.error,
      transfersQuery.error,
      payoutsQuery.error,
    ].some(isMissingRelationError);
  }, [statsQuery.error, listingsQuery.error, transfersQuery.error, payoutsQuery.error]);

  const loadError = useMemo(() => {
    if (schemaMissing) return null;
    const err =
      statsQuery.error || listingsQuery.error || transfersQuery.error || payoutsQuery.error;
    return err instanceof Error ? err.message : err ? String(err) : null;
  }, [
    schemaMissing,
    statsQuery.error,
    listingsQuery.error,
    transfersQuery.error,
    payoutsQuery.error,
  ]);

  const stats: AdminMarketplaceStats | null = statsQuery.data ?? null;
  const listings: MarketplaceListing[] = listingsQuery.data ?? [];
  const transfers: MarketplaceTransfer[] = transfersQuery.data ?? [];
  const payouts: MarketplacePayout[] = payoutsQuery.data ?? [];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-listings'] });
    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-transfers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-payouts'] });
  };

  const renderListingRow = (listing: MarketplaceListing) => {
    const eventTitle = listing.event?.title ?? `Event #${listing.event_id}`;
    const mode = modeLabel(listing.mode);
    return (
      <AdminListRow
        key={listing.id}
        title={`${eventTitle} · ${listingTicketLabel(listing)}`}
        meta={`${mode} · Gross ${formatKes(listing.gross_amount)}`}
        trailing={
          <>
            <span className="text-[11px] font-medium text-primary">{mode}</span>
            <AdminStatusPill
              tone={
                listing.status === 'active'
                  ? 'success'
                  : listing.status === 'failed'
                    ? 'error'
                    : 'muted'
              }
            >
              {listing.status === 'active' ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              ) : listing.status === 'sold' ? (
                'Sold'
              ) : listing.status === 'gifted' ? (
                'Gifted'
              ) : (
                listing.status
              )}
            </AdminStatusPill>
            {listing.status === 'active' ? (
              <AdminOutlinePill
                disabled={forceCancelMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Force-cancel listing #${listing.id}? Tickets return to the seller.`
                    )
                  ) {
                    forceCancelMutation.mutate(listing.id);
                  }
                }}
              >
                Force cancel
              </AdminOutlinePill>
            ) : null}
          </>
        }
      />
    );
  };

  return (
    <AdminSectionLayout
      title="Marketplace"
      subtitle="One section at a time — overview, listings, transfers, payouts, settings"
      icon={ArrowLeftRight}
      actions={<AdminRefreshButton onClick={refreshAll} />}
      items={MARKETPLACE_NAV}
      active={active}
      onChange={(id) => setActive(id as MarketplaceTab)}
    >
      {schemaMissing ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Marketplace tables not available</AlertTitle>
          <AlertDescription>
            Apply the ticket marketplace migration once the database is restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {loadError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Could not load marketplace data</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {active === 'overview' && (
        <div className="space-y-3.5">
          {statsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AdminKpiRow>
              <AdminKpiTile
                label="Active listings"
                value={String(stats?.active_listings ?? 0)}
                hint="Paid + gift"
              />
              <AdminKpiTile
                label="Completed transfers"
                value={(stats?.completed_transfers ?? 0).toLocaleString()}
                hint="All time"
              />
              <AdminKpiTile
                label="Fees collected"
                value={formatKes(stats?.fees_collected)}
                hint="KES 100 / ticket"
              />
              <AdminKpiTile
                label="Payout queue"
                value={String(stats?.pending_payouts ?? 0)}
                hint="Pending"
              />
            </AdminKpiRow>
          )}

          <div className="flex flex-wrap gap-2">
            <AdminOutlinePill onClick={() => setActive('listings')}>Listings</AdminOutlinePill>
            <AdminOutlinePill onClick={() => setActive('transfers')}>Transfers</AdminOutlinePill>
            <AdminOutlinePill onClick={() => setActive('payouts')}>Payouts</AdminOutlinePill>
            <AdminOutlinePill onClick={() => setActive('settings')}>Settings</AdminOutlinePill>
          </div>

          <AdminSectionPanel title="Recent listings">
            {listingsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              <div className="space-y-2">{listings.slice(0, 8).map(renderListingRow)}</div>
            )}
          </AdminSectionPanel>
        </div>
      )}

      {active === 'listings' && (
        <div className="space-y-3.5">
          <div className="flex justify-end">
            <AdminFilterSelect
              value={listingFilter}
              onChange={setListingFilter}
              options={[
                { value: 'all', label: 'Status: All' },
                { value: 'active', label: 'Active' },
                { value: 'sold', label: 'Sold' },
                { value: 'gifted', label: 'Gifted' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </div>
          <AdminSectionPanel title="Listings">
            {listingsQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No listings.</p>
            ) : (
              <div className="space-y-2">{listings.map(renderListingRow)}</div>
            )}
          </AdminSectionPanel>
        </div>
      )}

      {active === 'transfers' && (
        <div className="space-y-3.5">
          <div className="flex justify-end">
            <AdminFilterSelect
              value={transferFilter}
              onChange={setTransferFilter}
              options={[
                { value: 'all', label: 'Status: All' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending_payment', label: 'Pending payment' },
                { value: 'completing', label: 'Completing' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />
          </div>
          <AdminSectionPanel title="Transfers">
            {transfersQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transfers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No transfers yet.</p>
            ) : (
              <div className="space-y-2">
                {transfers.map((transfer) => (
                  <AdminListRow
                    key={transfer.id}
                    title={`Transfer #${transfer.id} · ${modeLabel(transfer.mode)}`}
                    meta={`Listing #${transfer.listing_id}${
                      transfer.payment_reference ? ` · ${transfer.payment_reference}` : ''
                    } · ${formatKes(transfer.gross_amount)} · ${formatWhen(transfer.created_at)}`}
                    trailing={
                      <AdminStatusPill
                        tone={
                          transfer.status === 'completed'
                            ? 'success'
                            : transfer.status === 'failed' || transfer.status === 'refunded'
                              ? 'error'
                              : 'warning'
                        }
                      >
                        {transfer.status.replace(/_/g, ' ')}
                      </AdminStatusPill>
                    }
                  />
                ))}
              </div>
            )}
          </AdminSectionPanel>
        </div>
      )}

      {active === 'payouts' && (
        <div className="space-y-3.5">
          <div className="flex justify-end">
            <AdminFilterSelect
              value={payoutFilter}
              onChange={setPayoutFilter}
              options={[
                { value: 'all', label: 'Status: All' },
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'failed', label: 'Failed' },
                { value: 'skipped', label: 'Skipped' },
              ]}
            />
          </div>
          <AdminSectionPanel title="Payouts">
            {payoutsQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payouts.</p>
            ) : (
              <div className="space-y-2">
                {payouts.map((payout) => (
                  <AdminListRow
                    key={payout.id}
                    title={formatKes(payout.amount)}
                    meta={`Payout #${payout.id} · transfer #${payout.transfer_id} · ${
                      payout.payout_method || '—'
                    } · ${formatWhen(payout.created_at)}`}
                    trailing={
                      <>
                        <AdminStatusPill
                          tone={
                            payout.status === 'paid'
                              ? 'success'
                              : payout.status === 'failed'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          {payout.status}
                        </AdminStatusPill>
                        {payout.status === 'failed' || payout.status === 'pending' ? (
                          <AdminOutlinePill
                            disabled={retryMutation.isPending}
                            onClick={() => retryMutation.mutate(payout.id)}
                          >
                            Retry
                          </AdminOutlinePill>
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

      {active === 'settings' && <MarketplaceSettingsCard />}
    </AdminSectionLayout>
  );
};

export default MarketplaceManagement;
