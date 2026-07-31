import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminListRow,
  AdminOutlinePill,
  AdminPageShell,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { AdminAiInsightPanel } from '@/components/admin/AdminAiAssist';
import {
  AnalyticsBarSeries,
  AnalyticsChartCard,
  AnalyticsHeaderActions,
  AnalyticsKpiCard,
  formatCompact,
  type AnalyticsPeriod,
} from '@/components/admin/analytics/analytics-ui';
import { loadSponsorAnalytics } from '@/lib/admin-analytics';
import { summarizeSponsorAnalytics } from '@/lib/admin-ai-analysis';
import { cn } from '@/lib/utils';

const SponsorAnalytics: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [selectedSponsor, setSelectedSponsor] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const aiRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-sponsor-analytics-v2', period],
    queryFn: () => loadSponsorAnalytics(period),
  });

  const detail = selectedSponsor !== 'all' ? data?.detail[selectedSponsor] : null;
  const selectedName =
    selectedSponsor === 'all'
      ? 'All sponsors'
      : data?.sponsors.find((s) => s.id === selectedSponsor)?.name || 'Sponsor';

  const onPeriod = (p: AnalyticsPeriod) => {
    if (p === 'custom') {
      toast.message('Custom range coming soon — using 30d');
      setPeriod('30d');
      return;
    }
    setPeriod(p);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['sponsor', 'events', 'uniques', 'check_ins'],
      ...data.overview.leaderboard.map((r) => [
        r.name,
        String(r.events),
        String(r.uniques),
        String(r.checkIns),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wya-sponsor-analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const zoneOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Zone: All' }];
    if (detail?.zones) {
      detail.zones.forEach((z) => opts.push({ value: z.name.toLowerCase(), label: `Zone: ${z.name}` }));
    }
    return opts;
  }, [detail]);

  const subtitle =
    selectedSponsor === 'all'
      ? 'Independent page · rail selects sponsor scope'
      : `${selectedName} · zone breakdown · events sponsored`;

  return (
    <AdminPageShell
      title="Sponsor Analytics"
      subtitle={subtitle}
      icon={BarChart3}
      actions={
        <AnalyticsHeaderActions
          onExport={exportCsv}
          onRefresh={() => {
            void refetch();
            queryClient.invalidateQueries({ queryKey: ['admin-sponsor-analytics-v2'] });
          }}
          onGenerateAi={() => aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          aiBusy={isFetching}
        />
      }
      toolbar={
        selectedSponsor === 'all' ? (
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['7d', '30d', '90d'] as const).map((id) => (
                <AdminOutlinePill key={id} active={period === id} onClick={() => onPeriod(id)}>
                  {id}
                </AdminOutlinePill>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminFilterSelect
                value={eventFilter}
                onChange={setEventFilter}
                options={[{ value: 'all', label: 'Event: All' }]}
                className="h-9 min-w-[132px]"
              />
              <AdminFilterSelect
                value={zoneFilter}
                onChange={setZoneFilter}
                options={[{ value: 'all', label: 'Zone: All' }]}
                className="h-9 min-w-[132px]"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {period} · {selectedName}
            </p>
            <button
              type="button"
              onClick={() => setSelectedSponsor('all')}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              ← Back to all sponsors
            </button>
          </div>
        )
      }
    >
      {isLoading || !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex flex-col gap-3.5 lg:flex-row">
            <nav className="flex w-full shrink-0 flex-col gap-1.5 rounded-[14px] border border-border bg-card p-3 lg:w-[200px]">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
                Sponsors
              </p>
              <button
                type="button"
                onClick={() => setSelectedSponsor('all')}
                className={cn(
                  'rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors',
                  selectedSponsor === 'all'
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'font-medium text-muted-foreground hover:bg-[hsl(var(--admin-surface))] hover:text-foreground'
                )}
              >
                All sponsors
              </button>
              {data.sponsors.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSponsor(s.id)}
                  className={cn(
                    'rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors',
                    selectedSponsor === s.id
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'font-medium text-muted-foreground hover:bg-[hsl(var(--admin-surface))] hover:text-foreground'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1 space-y-3.5">
              {selectedSponsor === 'all' ? (
                <>
                  <AdminKpiRow>
                    <AnalyticsKpiCard
                      label="Sponsored events"
                      value={formatCompact(data.overview.sponsoredEvents)}
                      hint="placements"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Unique visitors"
                      value={formatCompact(data.overview.uniqueVisitors)}
                      hint="zone scans"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Check-ins"
                      value={formatCompact(data.overview.checkIns)}
                      hint="measured"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Est. reach"
                      value={formatCompact(data.overview.estReach)}
                      hint="labeled estimate"
                      badge={{ label: 'Estimated', tone: 'estimated' }}
                    />
                  </AdminKpiRow>

                  <AnalyticsChartCard title="Zone check-ins · all sponsors">
                    <AnalyticsBarSeries data={data.overview.series} />
                  </AnalyticsChartCard>

                  <AdminSectionPanel title="Leaderboard → sponsor detail">
                    <div className="space-y-2">
                      {!data.overview.leaderboard.length ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No sponsor activity yet.
                        </p>
                      ) : (
                        data.overview.leaderboard.map((row) => (
                          <AdminListRow
                            key={row.id}
                            title={row.name}
                            meta={`${row.events} events · ${row.uniques} uniques · ${row.checkIns} check-ins`}
                            trailing={
                              <button
                                type="button"
                                onClick={() => setSelectedSponsor(row.id)}
                                className="text-[12px] font-semibold text-primary hover:underline"
                              >
                                Open →
                              </button>
                            }
                          />
                        ))
                      )}
                    </div>
                  </AdminSectionPanel>

                  <div ref={aiRef}>
                    <AdminAiInsightPanel
                      title="AI sponsor summary"
                      description="Plain-language read of measured check-ins and leaderboard."
                      buttonLabel="Summarize performance"
                      run={() =>
                        summarizeSponsorAnalytics({
                          period,
                          impressions: data.overview.estReach,
                          interactions: data.overview.checkIns,
                          storyMentions: 0,
                          zoneCheckins: data.overview.checkIns,
                          activity: data.overview.leaderboard.map((row) => ({
                            sponsor: row.name,
                            visitors: row.uniques,
                            interactions: row.checkIns,
                          })),
                        })
                      }
                    />
                  </div>
                </>
              ) : detail ? (
                <>
                  <div className="flex items-center gap-3 rounded-[14px] border border-border bg-card p-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-lg font-bold text-primary">
                      {selectedName.slice(0, 1)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{selectedName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {detail.events} sponsored events · {period} period
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:hidden">
                    <AdminFilterSelect
                      value={zoneFilter}
                      onChange={setZoneFilter}
                      options={zoneOptions}
                    />
                  </div>

                  <AdminKpiRow>
                    <AnalyticsKpiCard
                      label="Unique visitors"
                      value={formatCompact(detail.uniques)}
                      hint="Zone scans"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Check-ins"
                      value={formatCompact(detail.checkIns)}
                      hint="Measured"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Story mentions"
                      value={formatCompact(detail.storyMentions)}
                      hint="Tagged content"
                      badge={{ label: 'Measured', tone: 'measured' }}
                    />
                    <AnalyticsKpiCard
                      label="Est. reach"
                      value={formatCompact(detail.estReach)}
                      hint="Proxy"
                      badge={{ label: 'Estimated', tone: 'estimated' }}
                    />
                  </AdminKpiRow>

                  <div className="grid gap-3.5 lg:grid-cols-2">
                    <AdminSectionPanel title="Zone breakdown">
                      <div className="space-y-2">
                        {detail.zones
                          .filter(
                            (z) =>
                              zoneFilter === 'all' ||
                              z.name.toLowerCase() === zoneFilter
                          )
                          .map((z) => (
                            <AdminListRow
                              key={z.name}
                              title={z.name}
                              meta={`${z.uniques} uniques · ${z.checkIns} check-ins`}
                            />
                          ))}
                      </div>
                    </AdminSectionPanel>
                    <AdminSectionPanel title="Events sponsored">
                      <div className="space-y-2">
                        {detail.eventTitles.map((title) => (
                          <AdminListRow key={title} title={title} />
                        ))}
                      </div>
                    </AdminSectionPanel>
                  </div>

                  <div ref={aiRef}>
                    <AdminAiInsightPanel
                      title={`AI · ${selectedName}`}
                      description="Scoped summary — Est. reach excluded from ROI."
                      buttonLabel="Regenerate"
                      run={() =>
                        summarizeSponsorAnalytics({
                          period: `${period} · ${selectedName}`,
                          impressions: detail.estReach,
                          interactions: detail.checkIns,
                          storyMentions: detail.storyMentions,
                          zoneCheckins: detail.checkIns,
                          activity: detail.zones.map((z) => ({
                            sponsor: z.name,
                            visitors: z.uniques,
                            interactions: z.checkIns,
                          })),
                        })
                      }
                    />
                  </div>
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No detail for this sponsor yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};

export default SponsorAnalytics;
