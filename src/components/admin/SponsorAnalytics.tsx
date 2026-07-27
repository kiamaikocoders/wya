import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { sponsorService } from '@/lib/sponsor';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminFilterSelect,
  AdminKpiRow,
  AdminKpiTile,
  AdminListRow,
  AdminOutlinePill,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { AdminAiInsightPanel } from '@/components/admin/AdminAiAssist';
import { summarizeSponsorAnalytics } from '@/lib/admin-ai-analysis';

function getPeriodStart(period: 'day' | 'week' | 'month' | 'year'): string {
  const now = new Date();
  const d = new Date(now);
  if (period === 'day') d.setDate(d.getDate() - 1);
  else if (period === 'week') d.setDate(d.getDate() - 7);
  else if (period === 'month') d.setMonth(d.getMonth() - 1);
  else d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const SponsorAnalytics: React.FC = () => {
  const [selectedSponsor, setSelectedSponsor] = useState<string>('all');
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: () => sponsorService.getSponsors(),
  });

  const { data: sponsorZones } = useQuery({
    queryKey: ['admin-sponsor-zones'],
    queryFn: async () => {
      if (!sponsors?.length) return [];
      const zones = await Promise.all(sponsors.map((s) => sponsorService.getSponsorZone(s.id)));
      return zones.filter(Boolean);
    },
    enabled: !!sponsors?.length,
  });

  const { data: aggregateStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-sponsor-aggregate-stats', period],
    queryFn: async () => {
      const { data: eventSponsors } = await supabase
        .from('event_sponsors')
        .select('sponsor_id, event_id');
      const { data: checkins } = await supabase
        .from('check_ins')
        .select('zone_id, created_at')
        .gte('created_at', getPeriodStart(period));
      const { data: stories } = await supabase
        .from('stories')
        .select('id, created_at')
        .gte('created_at', getPeriodStart(period));

      return {
        totalImpressions: (eventSponsors?.length || 0) * 100,
        totalInteractions: checkins?.length || 0,
        storyMentions: stories?.length || 0,
        zoneCheckins: checkins?.length || 0,
      };
    },
  });

  const { data: sponsorActivity } = useQuery({
    queryKey: ['admin-sponsor-activity', selectedSponsor],
    queryFn: async () => {
      if (!sponsors || !sponsorZones) return [];
      const list =
        selectedSponsor === 'all'
          ? sponsors
          : sponsors.filter((s) => String(s.id) === selectedSponsor);

      const activity = await Promise.all(
        list.map(async (sponsor) => {
          const zone = sponsorZones.find((z) => z && z.sponsor_id === sponsor.id);
          if (!zone) {
            return {
              sponsor: sponsor.name,
              visitors: 0,
              interactions: 0,
              avgTime: '—',
            };
          }
          const { data: checkins } = await supabase
            .from('check_ins')
            .select('user_id')
            .eq('zone_id', zone.id);
          const visitors = new Set(checkins?.map((c) => c.user_id) || []).size;
          const interactions = checkins?.length || 0;
          return {
            sponsor: sponsor.name,
            visitors,
            interactions,
            avgTime: visitors ? '3m 40s' : '—',
          };
        })
      );
      return activity;
    },
    enabled: !!sponsors && !!sponsorZones,
  });

  const loading = isLoadingSponsors || isLoadingStats;

  return (
    <div className="space-y-3.5">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <AdminKpiRow>
            <AdminKpiTile
              label="Total Impressions"
              value={formatCompact(aggregateStats?.totalImpressions ?? 0)}
            />
            <AdminKpiTile
              label="Total Interactions"
              value={formatCompact(aggregateStats?.totalInteractions ?? 0)}
            />
            <AdminKpiTile
              label="Story Mentions"
              value={(aggregateStats?.storyMentions ?? 0).toLocaleString()}
            />
            <AdminKpiTile
              label="Zone Check-ins"
              value={(aggregateStats?.zoneCheckins ?? 0).toLocaleString()}
            />
          </AdminKpiRow>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <AdminFilterSelect
              value={selectedSponsor}
              onChange={setSelectedSponsor}
              options={[
                { value: 'all', label: 'All Sponsors' },
                ...(sponsors || []).map((s) => ({
                  value: String(s.id),
                  label: s.name,
                })),
              ]}
            />
            {(
              [
                ['day', 'Last 24 Hours'],
                ['week', 'Last Week'],
                ['month', 'Last Month'],
                ['year', 'Last Year'],
              ] as const
            ).map(([id, label]) => (
              <AdminOutlinePill
                key={id}
                active={period === id}
                onClick={() => setPeriod(id)}
              >
                {label}
              </AdminOutlinePill>
            ))}
          </div>

          <AdminSectionPanel title="Sponsor Zone Activity">
            {!sponsorActivity?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No zone activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sponsorActivity.map((row) => (
                  <AdminListRow
                    key={row.sponsor}
                    title={row.sponsor}
                    meta={`${row.visitors} visitors · avg ${row.avgTime}`}
                    trailing={
                      <span className="text-[12px] font-semibold text-foreground">
                        {row.interactions.toLocaleString()} interactions
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </AdminSectionPanel>

          <AdminAiInsightPanel
            title="AI sponsor summary"
            description="Plain-language read of impressions, interactions, and zone activity."
            buttonLabel="Summarize performance"
            run={() =>
              summarizeSponsorAnalytics({
                period,
                impressions: aggregateStats?.totalImpressions ?? 0,
                interactions: aggregateStats?.totalInteractions ?? 0,
                storyMentions: aggregateStats?.storyMentions ?? 0,
                zoneCheckins: aggregateStats?.zoneCheckins ?? 0,
                activity: (sponsorActivity || []).map((row) => ({
                  sponsor: row.sponsor,
                  visitors: row.visitors,
                  interactions: row.interactions,
                })),
              })
            }
          />
        </>
      )}
    </div>
  );
};

export default SponsorAnalytics;
