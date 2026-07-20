import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  Ticket,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  LayoutDashboard,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', icon: Ticket },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings2 },
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
  const n = Number(amount ?? 0);
  return `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function listingStatusVariant(
  status: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'active') return 'default';
  if (status === 'sold' || status === 'gifted') return 'secondary';
  if (status === 'failed') return 'destructive';
  return 'outline';
}

function transferStatusVariant(
  status: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'completed') return 'secondary';
  if (status === 'failed' || status === 'refunded') return 'destructive';
  if (status === 'pending_payment' || status === 'completing') return 'default';
  return 'outline';
}

function payoutStatusVariant(
  status: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'paid') return 'secondary';
  if (status === 'failed') return 'destructive';
  if (status === 'pending') return 'default';
  return 'outline';
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
    enabled: active === 'listings',
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
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-stats'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const forceCancelMutation = useMutation({
    mutationFn: (listingId: number) => adminPlatformService.forceCancelListing(listingId),
    onSuccess: () => {
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

  return (
    <AdminSectionLayout
      title="Marketplace"
      subtitle="One section at a time — overview, listings, transfers, payouts, settings"
      actions={
        <Button variant="outline" size="sm" className="gap-2" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
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
        <>
          <AdminPanelHeader
            title="Overview"
            description="Transfer health at a glance. Open a section for detail."
          />
          {statsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminKpiTile
                label="Active listings"
                value={String(stats?.active_listings ?? 0)}
                hint="Live on marketplace"
              />
              <AdminKpiTile
                label="Completed transfers"
                value={String(stats?.completed_transfers ?? 0)}
                hint={`${stats?.gifted_listings ?? 0} gifted · ${stats?.sold_listings ?? 0} sold`}
              />
              <AdminKpiTile
                label="Fees collected"
                value={formatKes(stats?.fees_collected)}
                hint="KES 100 per ticket"
              />
              <AdminKpiTile
                label="Payout queue"
                value={String(stats?.pending_payouts ?? 0)}
                hint={`${stats?.failed_payouts ?? 0} failed · ${formatKes(stats?.paid_payout_amount)} paid`}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActive('listings')}>
              <Ticket className="mr-2 h-4 w-4" />
              Listings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActive('transfers')}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfers
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActive('payouts')}>
              <Clock className="mr-2 h-4 w-4" />
              Payouts
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActive('settings')}>
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </>
      )}

      {active === 'listings' && (
        <>
          <AdminPanelHeader
            title="Listings"
            description="Active and historical transfer / gift listings."
          />
          <div className="mb-4 flex items-center gap-2 justify-end">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={listingFilter} onValueChange={setListingFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="gifted">Gifted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {listingsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No listings</CardTitle>
                <CardDescription>
                  When users list tickets for transfer or gift, they appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {listing.event?.title ?? `Event #${listing.event_id}`}
                          </CardTitle>
                          <CardDescription>
                            Listing #{listing.id} · {listing.ticket_count} ticket
                            {listing.ticket_count === 1 ? '' : 's'} · created{' '}
                            {formatWhen(listing.created_at)}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={listingStatusVariant(listing.status)} className="capitalize">
                            {listing.status}
                          </Badge>
                          <Badge variant="outline" className="gap-1 capitalize">
                            {listing.mode === 'gift' ? (
                              <Gift className="h-3 w-3" />
                            ) : (
                              <Wallet className="h-3 w-3" />
                            )}
                            {listing.mode === 'gift' ? 'Gift' : 'Paid transfer'}
                          </Badge>
                          {listing.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
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
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Gross</span>
                        <div className="font-medium">{formatKes(listing.gross_amount)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fee</span>
                        <div className="font-medium">{formatKes(listing.fee_amount)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Seller payout</span>
                        <div className="font-medium">
                          {formatKes(listing.seller_payout_amount)}
                        </div>
                      </div>
                      <div className="sm:col-span-3 text-muted-foreground text-xs">
                        Closes / expires {formatWhen(listing.expires_at)}
                        {listing.closed_at ? ` · closed ${formatWhen(listing.closed_at)}` : ''}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {active === 'transfers' && (
        <>
          <AdminPanelHeader
            title="Transfers"
            description="Completed buys and gift claims — ownership moves and fees."
          />
          <div className="mb-4 flex items-center gap-2 justify-end">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={transferFilter} onValueChange={setTransferFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending_payment">Pending payment</SelectItem>
                <SelectItem value="completing">Completing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transfersQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transfers.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No transfers yet</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {transfers.map((transfer) => (
                <li key={transfer.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base">Transfer #{transfer.id}</CardTitle>
                          <CardDescription className="font-mono text-xs break-all">
                            Listing #{transfer.listing_id}
                            {transfer.payment_reference
                              ? ` · ${transfer.payment_reference}`
                              : ''}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={transferStatusVariant(transfer.status)}
                            className="capitalize"
                          >
                            {transfer.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {transfer.mode === 'gift' ? 'Gift' : 'Paid'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Buyer paid</span>
                        <div className="font-medium">{formatKes(transfer.gross_amount)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Platform fee</span>
                        <div className="font-medium">{formatKes(transfer.fee_amount)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Seller receives</span>
                        <div className="font-medium">
                          {formatKes(transfer.seller_payout_amount)}
                        </div>
                      </div>
                      <div className="sm:col-span-3 text-xs text-muted-foreground">
                        Created {formatWhen(transfer.created_at)}
                        {transfer.completed_at
                          ? ` · completed ${formatWhen(transfer.completed_at)}`
                          : ''}
                      </div>
                      {transfer.error_message ? (
                        <div className="sm:col-span-3 text-sm text-destructive flex gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          {transfer.error_message}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {active === 'payouts' && (
        <>
          <AdminPanelHeader
            title="Payouts"
            description="Seller payout queue — retry failures from here."
          />
          <div className="mb-4 flex items-center gap-2 justify-end">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={payoutFilter} onValueChange={setPayoutFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payoutsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>No payouts</CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <ul className="space-y-3">
              {payouts.map((payout) => (
                <li key={payout.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-base">{formatKes(payout.amount)}</CardTitle>
                          <CardDescription>
                            Payout #{payout.id} · transfer #{payout.transfer_id} · attempts{' '}
                            {payout.attempt_count}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={payoutStatusVariant(payout.status)}
                            className="capitalize gap-1"
                          >
                            {payout.status === 'paid' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : null}
                            {payout.status}
                          </Badge>
                          {(payout.status === 'failed' || payout.status === 'pending') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(payout.id)}
                            >
                              {retryMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Method {payout.payout_method ?? '—'} · created{' '}
                        {formatWhen(payout.created_at)}
                        {payout.paid_at ? ` · paid ${formatWhen(payout.paid_at)}` : ''}
                      </div>
                      {payout.last_error ? (
                        <div className="text-destructive flex gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          {payout.last_error}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {active === 'settings' && (
        <>
          <AdminPanelHeader
            title="Settings"
            description="Fee, transfer window, and marketplace kill switch."
          />
          <MarketplaceSettingsCard />
        </>
      )}
    </AdminSectionLayout>
  );
};

export default MarketplaceManagement;
