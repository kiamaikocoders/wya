import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivitySquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  AdminKpiRow,
  AdminPageShell,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { AdminAiInsightPanel } from '@/components/admin/AdminAiAssist';
import {
  AnalyticsAlertRow,
  AnalyticsBarSeries,
  AnalyticsChartCard,
  AnalyticsDonut,
  AnalyticsHeaderActions,
  AnalyticsKpiCard,
  AnalyticsModuleTabs,
  AnalyticsPeriodBar,
  AnalyticsRankedList,
  PLATFORM_TABS,
  formatCompact,
  formatKesCompact,
  type AnalyticsCustomRange,
  type AnalyticsPeriod,
  type PlatformTab,
} from '@/components/admin/analytics/analytics-ui';
import { loadPlatformAnalytics } from '@/lib/admin-analytics';
import { summarizePlatformAnalytics } from '@/lib/admin-ai-analysis';
import { useAdminSectionTab } from '@/components/admin/AdminSubnavLayout';

const Analytics: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [customRange, setCustomRange] = useState<AnalyticsCustomRange | null>(null);
  const [comparePrior, setComparePrior] = useState(true);
  const [excludeGhosts, setExcludeGhosts] = useState(true);
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useAdminSectionTab<PlatformTab>(
    PLATFORM_TABS.map((id) => ({ id })),
    'overview'
  );
  const aiRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-platform-analytics', period, customRange, excludeGhosts],
    queryFn: () =>
      loadPlatformAnalytics(period, { excludeGhosts, customRange }),
    enabled: period !== 'custom' || !!customRange,
  });

  const cityOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'City: All' }];
    data?.overview.topCities.forEach((c) => {
      opts.push({ value: c.title.toLowerCase(), label: `City: ${c.title}` });
    });
    return opts;
  }, [data]);

  const categoryOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Category: All' }];
    data?.events.categories.forEach((c) => {
      opts.push({ value: c.name.toLowerCase(), label: `Category: ${c.name}` });
    });
    return opts;
  }, [data]);

  const onPeriod = (p: AnalyticsPeriod) => {
    if (p !== 'custom') setCustomRange(null);
    setPeriod(p);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['tab', 'metric', 'value'],
      ['overview', 'wau', String(data.overview.wau)],
      ['overview', 'net_new', String(data.overview.netNew)],
      ['overview', 'gmv', String(data.overview.gmv)],
      ['overview', 'tickets_confirmed', String(data.overview.ticketsConfirmed)],
      ['revenue', 'completed', String(data.revenue.completed)],
      ['revenue', 'pending', String(data.revenue.pending)],
      ['revenue', 'failed', String(data.revenue.failed)],
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wya-analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const scrollToAi = () => {
    aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const o = data?.overview;

  return (
    <AdminPageShell
      title="Analytics"
      subtitle="BI hub · period trends · payments truth"
      icon={ActivitySquare}
      actions={
        <AnalyticsHeaderActions
          onExport={exportCsv}
          onRefresh={() => {
            void refetch();
            queryClient.invalidateQueries({ queryKey: ['admin-platform-analytics'] });
          }}
          onGenerateAi={scrollToAi}
          aiBusy={isFetching}
        />
      }
      toolbar={
        <AnalyticsPeriodBar
          period={period}
          onPeriod={onPeriod}
          customRange={customRange}
          onCustomRange={setCustomRange}
          comparePrior={comparePrior}
          onComparePrior={setComparePrior}
          excludeGhosts={excludeGhosts}
          onExcludeGhosts={setExcludeGhosts}
          city={city}
          onCity={setCity}
          category={category}
          onCategory={setCategory}
          cityOptions={cityOptions}
          categoryOptions={categoryOptions}
        />
      }
      subnav={<AnalyticsModuleTabs active={tab} onChange={setTab} />}
    >
      <div className="space-y-3.5">
        {isLoading || !data ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {tab === 'overview' && o && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="WAU" value={formatCompact(o.wau)} delta={comparePrior ? o.wauDelta : null} spark={o.sparks.wau} />
                  <AnalyticsKpiCard label="Net new users" value={formatCompact(o.netNew)} delta={comparePrior ? o.netNewDelta : null} spark={o.sparks.netNew} />
                  <AnalyticsKpiCard label="Ticket GMV" value={formatKesCompact(o.gmv)} delta={comparePrior ? o.gmvDelta : null} spark={o.sparks.gmv} hint="Payments completed" />
                  <AnalyticsKpiCard label="Tickets confirmed" value={formatCompact(o.ticketsConfirmed)} delta={comparePrior ? o.ticketsDelta : null} spark={o.sparks.tickets} />
                </AdminKpiRow>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Live / upcoming" value={`${o.live} / ${o.upcoming}`} delta={comparePrior ? 2 : null} deltaPoints />
                  <AnalyticsKpiCard label="Check-in rate" value={o.checkInRate != null ? `${o.checkInRate.toFixed(0)}%` : '—'} delta={comparePrior ? o.checkInDelta : null} deltaPoints />
                  <AnalyticsKpiCard label="MP transfers" value={formatCompact(o.transfers)} delta={comparePrior ? o.transfersDelta : null} />
                  <AnalyticsKpiCard label="Ghost %" value={`${o.ghostPct.toFixed(0)}%`} delta={comparePrior ? o.ghostDelta : null} deltaPoints />
                </AdminKpiRow>

                <AnalyticsAlertRow
                  items={[
                    ...(o.paymentFailPct != null
                      ? [{ label: `Payment failures ↑ ${o.paymentFailPct.toFixed(0)}%`, tone: 'primary' as const }]
                      : []),
                    { label: `Pending events: ${o.pendingEvents}`, tone: 'primary' },
                    ...(o.ghostStoryPct != null
                      ? [{ label: `Ghost stories ${o.ghostStoryPct}% of volume`, tone: 'muted' as const }]
                      : []),
                  ]}
                />

                <div className="grid gap-3.5 lg:grid-cols-3">
                  <AnalyticsChartCard title="Users over time" description="WAU · prior period dashed" className="lg:col-span-1">
                    <AnalyticsBarSeries
                      data={o.usersSeries}
                      compareKey={comparePrior ? 'prior' : undefined}
                    />
                  </AnalyticsChartCard>
                  <AnalyticsChartCard title="Revenue (payments)" description="Completed GMV · not ticket×price" className="lg:col-span-1">
                    <AnalyticsBarSeries
                      data={o.revenueSeries}
                      compareKey={comparePrior ? 'prior' : undefined}
                    />
                  </AnalyticsChartCard>
                  <div ref={aiRef}>
                    <AdminSectionPanel title={`AI summary · ${period}`}>
                      <AdminAiInsightPanel
                        title="AI summary"
                        description="Plain-language read of period KPIs and deltas."
                        buttonLabel="Regenerate"
                        emptyHint="Generate insights from current platform metrics."
                        run={() =>
                          summarizePlatformAnalytics({
                            totalEvents: o.live + o.upcoming,
                            activeUsers: o.wau,
                            revenueKes: o.gmv,
                            tickets: o.ticketsConfirmed,
                            transfersCompleted: o.transfers,
                            organizers: 0,
                          })
                        }
                      />
                    </AdminSectionPanel>
                  </div>
                </div>

                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsRankedList
                    title="Top events"
                    rows={o.topEvents}
                    deepLink={{ to: '/admin/events', label: 'View in Events →' }}
                  />
                  <AnalyticsRankedList
                    title="Top cities"
                    rows={o.topCities}
                    deepLink={{ to: '/admin/events', label: 'View in Events →' }}
                  />
                </div>
              </>
            )}

            {tab === 'growth' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="New signups" value={formatCompact(data.growth.signups)} delta={comparePrior ? data.growth.signupsDelta : null} />
                  <AnalyticsKpiCard label="Verified" value={data.growth.verifiedPct != null ? `${data.growth.verifiedPct}%` : '—'} delta={comparePrior ? 2 : null} deltaPoints />
                  <AnalyticsKpiCard label="Avatar complete" value={data.growth.avatarPct != null ? `${data.growth.avatarPct}%` : '—'} delta={comparePrior ? 5 : null} deltaPoints />
                  <AnalyticsKpiCard label="First ticket" value={data.growth.firstTicketPct != null ? `${data.growth.firstTicketPct}%` : '—'} delta={comparePrior ? 1 : null} deltaPoints />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="Signups over time" description="Daily net new real users">
                    <AnalyticsBarSeries data={data.growth.signupsSeries} />
                  </AnalyticsChartCard>
                  <AnalyticsChartCard title="Activation funnel" description="Signup → verified → photo → ticket">
                    <AnalyticsDonut data={data.growth.funnel} />
                  </AnalyticsChartCard>
                </div>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsRankedList title="Retention cohorts" rows={data.growth.cohorts} />
                  <AnalyticsRankedList
                    title="Top cities"
                    rows={data.growth.cities}
                    deepLink={{ to: '/admin/users', label: 'View in Users →' }}
                  />
                </div>
              </>
            )}

            {tab === 'events' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Pending" value={formatCompact(data.events.pending)} delta={comparePrior ? 2 : null} deltaPoints />
                  <AnalyticsKpiCard label="Approved (period)" value={formatCompact(data.events.approved)} delta={comparePrior ? 6 : null} deltaPoints />
                  <AnalyticsKpiCard label="Avg fill rate" value={data.events.fillRate != null ? `${data.events.fillRate.toFixed(0)}%` : '—'} delta={comparePrior ? 3 : null} deltaPoints />
                  <AnalyticsKpiCard label="Time-to-approve" value={data.events.timeToApproveHours != null ? `${data.events.timeToApproveHours}h` : '—'} delta={comparePrior ? -4 : null} deltaPoints />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="Pipeline trend" description="Pending / approved / rejected">
                    <AnalyticsBarSeries data={data.events.pipelineSeries} />
                  </AnalyticsChartCard>
                  <AnalyticsChartCard title="Category mix" description="Share of upcoming supply">
                    <AnalyticsDonut data={data.events.categories} />
                  </AnalyticsChartCard>
                </div>
                <AnalyticsRankedList
                  title="Top events"
                  rows={data.events.topByFill}
                  deepLink={{ to: '/admin/events', label: 'View in Events →' }}
                />
              </>
            )}

            {tab === 'revenue' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Completed GMV" value={formatKesCompact(data.revenue.completed)} delta={comparePrior ? 6 : null} hint="Payments truth" />
                  <AnalyticsKpiCard label="Pending" value={formatKesCompact(data.revenue.pending)} delta={comparePrior ? -8 : null} />
                  <AnalyticsKpiCard label="Failed" value={formatKesCompact(data.revenue.failed)} delta={comparePrior ? 12 : null} />
                  <AnalyticsKpiCard label="AOV" value={formatKesCompact(data.revenue.aov)} delta={comparePrior ? 2 : null} />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="GMV over time" description="Payments truth · not ticket×price">
                    <AnalyticsBarSeries data={data.revenue.series} />
                  </AnalyticsChartCard>
                  <AnalyticsChartCard title="Method mix" description="M-Pesa vs card vs cash">
                    <AnalyticsDonut data={data.revenue.methods} />
                  </AnalyticsChartCard>
                </div>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsRankedList
                    title="Revenue by event"
                    rows={data.revenue.byEvent}
                    deepLink={{ to: '/admin/finance', label: 'Open Finance →' }}
                  />
                  <AnalyticsRankedList title="By category" rows={data.revenue.byCategory} />
                </div>
              </>
            )}

            {tab === 'attendance' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Check-ins" value={formatCompact(data.attendance.checkIns)} delta={comparePrior ? 4 : null} />
                  <AnalyticsKpiCard label="Ticket→check-in" value={data.attendance.conversion != null ? `${data.attendance.conversion.toFixed(0)}%` : '—'} delta={comparePrior ? -2 : null} deltaPoints />
                  <AnalyticsKpiCard label="No-show rate" value={data.attendance.noShow != null ? `${data.attendance.noShow.toFixed(0)}%` : '—'} delta={comparePrior ? 2 : null} deltaPoints />
                  <AnalyticsKpiCard label="Peak hour" value="9–10pm" delta={null} />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="Check-ins over time" description="Platform-wide attendance">
                    <AnalyticsBarSeries data={data.attendance.series} />
                  </AnalyticsChartCard>
                  <AdminSectionPanel title="QR quality">
                    <div className="space-y-2">
                      <div className="flex justify-between rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">Reuse attempts</span>
                        <span className="font-semibold">{data.attendance.reuseAttempts}</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">Scan failures</span>
                        <span className="font-semibold">{data.attendance.scanFailures}</span>
                      </div>
                    </div>
                  </AdminSectionPanel>
                </div>
                <AnalyticsRankedList title="By event" rows={data.attendance.byEvent} />
              </>
            )}

            {tab === 'marketplace' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Listings" value={formatCompact(data.marketplace.listings)} delta={comparePrior ? 9 : null} />
                  <AnalyticsKpiCard label="Sold" value={formatCompact(data.marketplace.sold)} delta={comparePrior ? 11 : null} />
                  <AnalyticsKpiCard label="Conversion" value={data.marketplace.conversion != null ? `${data.marketplace.conversion.toFixed(0)}%` : '—'} delta={comparePrior ? 2 : null} deltaPoints />
                  <AnalyticsKpiCard label="Fees collected" value={formatKesCompact(data.marketplace.fees)} delta={comparePrior ? 8 : null} />
                </AdminKpiRow>
                <AnalyticsChartCard title="Listings → sold" description="Transfer volume">
                  <AnalyticsBarSeries data={data.marketplace.series} />
                </AnalyticsChartCard>
                <AdminSectionPanel title="Liquidity">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">Resell rate</p>
                      <p className="text-lg font-bold">
                        {data.marketplace.resellRate != null
                          ? `${data.marketplace.resellRate.toFixed(1)}%`
                          : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">Median time-to-sell</p>
                      <p className="text-lg font-bold">{data.marketplace.medianDays ?? '—'}d</p>
                    </div>
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">Payouts pending</p>
                      <p className="text-lg font-bold">{formatKesCompact(data.marketplace.pendingPayouts)}</p>
                    </div>
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">&gt;7d aging</p>
                      <p className="text-lg font-bold">{formatKesCompact(data.marketplace.agingOver7d)}</p>
                    </div>
                  </div>
                  <Link to="/admin/marketplace" className="mt-3 inline-flex text-[12px] font-semibold text-primary hover:underline">
                    Open Marketplace →
                  </Link>
                </AdminSectionPanel>
              </>
            )}

            {tab === 'engagement' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Stories" value={formatCompact(data.engagement.stories)} delta={comparePrior ? 18 : null} />
                  <AnalyticsKpiCard label="Posts" value={formatCompact(data.engagement.posts)} delta={comparePrior ? 6 : null} />
                  <AnalyticsKpiCard label="Likes" value={formatCompact(data.engagement.likes)} delta={comparePrior ? 12 : null} />
                  <AnalyticsKpiCard label="Follows" value={formatCompact(data.engagement.follows)} delta={comparePrior ? 9 : null} />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="Content volume" description={excludeGhosts ? 'Ghost vs real · toggle applied' : 'All content'}>
                    <AnalyticsBarSeries data={data.engagement.series} />
                  </AnalyticsChartCard>
                  <AnalyticsRankedList title="Per event" rows={data.engagement.byEvent} />
                </div>
                <AdminSectionPanel title="Social graph">
                  <p className="text-sm text-muted-foreground">
                    Favorites in range: <span className="font-semibold text-foreground">{formatCompact(data.engagement.favorites)}</span>
                  </p>
                </AdminSectionPanel>
              </>
            )}

            {tab === 'trust' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Mod queue" value={formatCompact(data.trust.modQueue)} delta={comparePrior ? 3 : null} deltaPoints />
                  <AnalyticsKpiCard label="Avg queue age" value={data.trust.avgQueueHours != null ? `${data.trust.avgQueueHours}h` : '—'} delta={comparePrior ? -1 : null} deltaPoints />
                  <AnalyticsKpiCard label="Bans (period)" value={formatCompact(data.trust.bans)} delta={comparePrior ? 1 : null} deltaPoints />
                  <AnalyticsKpiCard label="DSAR open" value={formatCompact(data.trust.dsarOpen)} delta={0} deltaPoints />
                </AdminKpiRow>
                <AdminSectionPanel title="Compliance">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">Consent coverage</p>
                      <p className="text-lg font-bold">{data.trust.consentCoverage}%</p>
                    </div>
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">Media consent opt-in</p>
                      <p className="text-lg font-bold">{data.trust.mediaOptIn}%</p>
                    </div>
                    <div className="rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">DSAR avg close</p>
                      <p className="text-lg font-bold">{data.trust.dsarCloseDays}d</p>
                    </div>
                  </div>
                  <Link to="/admin/moderation" className="mt-3 inline-flex text-[12px] font-semibold text-primary hover:underline">
                    Open Moderation →
                  </Link>
                </AdminSectionPanel>
              </>
            )}

            {tab === 'comms' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Emails sent" value={formatCompact(data.comms.emailsSent)} delta={comparePrior ? 22 : null} />
                  <AnalyticsKpiCard label="Reminders sent" value={formatCompact(data.comms.reminders)} delta={comparePrior ? 5 : null} />
                  <AnalyticsKpiCard label="Newsletter subs" value={formatCompact(data.comms.newsletter)} delta={comparePrior ? 3 : null} />
                  <AnalyticsKpiCard label="Bounce rate" value={data.comms.bounceRate != null ? `${data.comms.bounceRate}%` : '—'} delta={comparePrior ? -0.2 : null} deltaPoints />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsChartCard title="Send volume" description="By template / campaign">
                    <AnalyticsBarSeries data={data.comms.series} />
                  </AnalyticsChartCard>
                  <AnalyticsRankedList
                    title="Templates"
                    rows={data.comms.templates}
                    deepLink={{ to: '/admin/communications', label: 'Open Communications →' }}
                  />
                </div>
              </>
            )}

            {tab === 'feedback' && (
              <>
                <AdminKpiRow>
                  <AnalyticsKpiCard label="Volume" value={formatCompact(data.feedback.volume)} delta={comparePrior ? 12 : null} />
                  <AnalyticsKpiCard label="CSAT" value={data.feedback.csat != null ? `${data.feedback.csat}/5` : '—'} delta={comparePrior ? 0.1 : null} deltaPoints />
                  <AnalyticsKpiCard label="NPS" value={data.feedback.nps != null ? `+${data.feedback.nps}` : '—'} delta={comparePrior ? 4 : null} deltaPoints />
                  <AnalyticsKpiCard label="Bug reports" value={formatCompact(data.feedback.bugs)} delta={comparePrior ? -2 : null} deltaPoints />
                </AdminKpiRow>
                <div className="grid gap-3.5 lg:grid-cols-2">
                  <AnalyticsRankedList
                    title="Themes"
                    rows={data.feedback.themes}
                    deepLink={{ to: '/admin/feedback', label: 'Open App feedback →' }}
                  />
                  <AdminSectionPanel title="Surveys">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                        <span className="text-muted-foreground">Event satisfaction</span>
                        <span className="font-semibold">{data.feedback.surveyAvg} avg</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5">
                        <span className="text-muted-foreground">Post-event NPS</span>
                        <span className="font-semibold">+{data.feedback.postEventNps}</span>
                      </div>
                    </div>
                  </AdminSectionPanel>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminPageShell>
  );
};

export default Analytics;
