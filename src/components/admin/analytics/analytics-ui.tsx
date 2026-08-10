import React, { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  AdminFilterSelect,
  AdminOutlinePill,
  AdminPrimaryPill,
  AdminSectionPanel,
} from '@/components/admin/AdminPageShell';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type AnalyticsPeriod = '12h' | '24h' | '7d' | '30d' | '90d' | 'custom';

/** Absolute window used when period === 'custom'. */
export type AnalyticsCustomRange = {
  startIso: string;
  endIso: string;
};

export function formatAnalyticsPeriodLabel(
  period: AnalyticsPeriod,
  customRange?: AnalyticsCustomRange | null
): string {
  if (period === 'custom' && customRange) {
    const start = new Date(customRange.startIso);
    const end = new Date(customRange.endIso);
    const fmt = (d: Date) =>
      d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    return `${fmt(start)} → ${fmt(end)}`;
  }
  return period;
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const PLATFORM_TABS = [
  'overview',
  'growth',
  'events',
  'revenue',
  'attendance',
  'marketplace',
  'engagement',
  'trust',
  'comms',
  'feedback',
] as const;

export type PlatformTab = (typeof PLATFORM_TABS)[number];

export const PLATFORM_TAB_LABELS: Record<PlatformTab, string> = {
  overview: 'Overview',
  growth: 'Growth',
  events: 'Events',
  revenue: 'Revenue',
  attendance: 'Attendance',
  marketplace: 'Marketplace',
  engagement: 'Engagement',
  trust: 'Trust',
  comms: 'Comms',
  feedback: 'Feedback',
};

export function formatKesCompact(amount: number): string {
  if (!Number.isFinite(amount)) return 'KES 0';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `KES ${(amount / 1_000).toFixed(1)}k`;
  return `KES ${Math.round(amount).toLocaleString()}`;
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

export function formatDelta(delta: number | null | undefined, opts?: { points?: boolean }) {
  if (delta == null || !Number.isFinite(delta)) return { text: '—', tone: 'muted' as const };
  const sign = delta > 0 ? '+' : '';
  const text = opts?.points ? `${sign}${delta.toFixed(1)}` : `${sign}${delta.toFixed(1)}%`;
  if (delta > 0) return { text, tone: 'up' as const };
  if (delta < 0) return { text, tone: 'down' as const };
  return { text: '0%', tone: 'muted' as const };
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const w = 72;
  const h = 22;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={cn('mt-1', className)} aria-hidden>
      <polyline
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function AnalyticsKpiCard({
  label,
  value,
  delta,
  deltaPoints,
  hint,
  spark,
  badge,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaPoints?: boolean;
  hint?: string;
  spark?: number[];
  badge?: { label: string; tone: 'measured' | 'estimated' };
  className?: string;
}) {
  const d = formatDelta(delta, { points: deltaPoints });
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-[14px] border border-border bg-card p-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        {badge ? (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
              badge.tone === 'measured'
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-amber-500/15 text-amber-500'
            )}
          >
            {badge.label}
          </span>
        ) : null}
      </div>
      <div className="text-[20px] font-bold leading-none text-foreground lg:text-[22px]">{value}</div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p
            className={cn(
              'text-[11px] font-semibold',
              d.tone === 'up' && 'text-emerald-500',
              d.tone === 'down' && 'text-destructive',
              d.tone === 'muted' && 'text-muted-foreground'
            )}
          >
            {d.text}
          </p>
          {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
        </div>
        {spark?.length ? <Sparkline values={spark} /> : null}
      </div>
    </div>
  );
}

export function AnalyticsPeriodBar({
  period,
  onPeriod,
  customRange,
  onCustomRange,
  comparePrior,
  onComparePrior,
  excludeGhosts,
  onExcludeGhosts,
  city,
  onCity,
  category,
  onCategory,
  cityOptions,
  categoryOptions,
  extraFilters,
  showComparePrior = true,
}: {
  period: AnalyticsPeriod;
  onPeriod: (p: AnalyticsPeriod) => void;
  customRange?: AnalyticsCustomRange | null;
  onCustomRange?: (range: AnalyticsCustomRange) => void;
  comparePrior: boolean;
  onComparePrior: (v: boolean) => void;
  excludeGhosts?: boolean;
  onExcludeGhosts?: (v: boolean) => void;
  city?: string;
  onCity?: (v: string) => void;
  category?: string;
  onCategory?: (v: string) => void;
  cityOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
  extraFilters?: ReactNode;
  showComparePrior?: boolean;
}) {
  const [customOpen, setCustomOpen] = React.useState(false);
  const now = React.useMemo(() => new Date(), [customOpen]);
  const defaultEnd = toDatetimeLocalValue(now);
  const defaultStart = toDatetimeLocalValue(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const [draftStart, setDraftStart] = React.useState(defaultStart);
  const [draftEnd, setDraftEnd] = React.useState(defaultEnd);
  const [draftError, setDraftError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!customOpen) return;
    if (customRange) {
      setDraftStart(toDatetimeLocalValue(new Date(customRange.startIso)));
      setDraftEnd(toDatetimeLocalValue(new Date(customRange.endIso)));
    } else {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      setDraftStart(toDatetimeLocalValue(start));
      setDraftEnd(toDatetimeLocalValue(end));
    }
    setDraftError(null);
  }, [customOpen, customRange]);

  const applyHours = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    onCustomRange?.({ startIso: start.toISOString(), endIso: end.toISOString() });
    onPeriod('custom');
    setCustomOpen(false);
  };

  const applyDraft = () => {
    const start = fromDatetimeLocalValue(draftStart);
    const end = fromDatetimeLocalValue(draftEnd);
    if (!start || !end) {
      setDraftError('Pick a valid start and end time');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setDraftError('End must be after start');
      return;
    }
    if (end.getTime() - start.getTime() > 365 * 24 * 60 * 60 * 1000) {
      setDraftError('Range cannot exceed 365 days');
      return;
    }
    onCustomRange?.({ startIso: start.toISOString(), endIso: end.toISOString() });
    onPeriod('custom');
    setCustomOpen(false);
  };

  const periodPills: Array<[Exclude<AnalyticsPeriod, 'custom'>, string]> = [
    ['12h', '12h'],
    ['24h', '24h'],
    ['7d', '7d'],
    ['30d', '30d'],
    ['90d', '90d'],
  ];

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {periodPills.map(([id, label]) => (
          <AdminOutlinePill key={id} active={period === id} onClick={() => onPeriod(id)}>
            {label}
          </AdminOutlinePill>
        ))}
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex max-w-[220px] items-center justify-center truncate rounded-full px-3 py-2 text-xs font-medium transition-colors',
                period === 'custom'
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'border border-border bg-[hsl(var(--admin-surface))] text-foreground hover:bg-[hsl(var(--admin-surface-2))]'
              )}
            >
              {period === 'custom' && customRange
                ? formatAnalyticsPeriodLabel('custom', customRange)
                : 'Custom'}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] space-y-3 p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Custom range</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Quick windows or an exact from → to range.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                [12, '12h'],
                [24, '24h'],
                [48, '48h'],
                [72, '72h'],
              ].map(([hours, label]) => (
                <AdminOutlinePill key={label} onClick={() => applyHours(Number(hours))}>
                  Last {label}
                </AdminOutlinePill>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">From</span>
                <Input
                  type="datetime-local"
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  className="h-9"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">To</span>
                <Input
                  type="datetime-local"
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="h-9"
                />
              </label>
              {draftError ? (
                <p className="text-[11px] text-destructive">{draftError}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <AdminOutlinePill onClick={() => setCustomOpen(false)}>Cancel</AdminOutlinePill>
              <AdminPrimaryPill onClick={applyDraft}>Apply</AdminPrimaryPill>
            </div>
          </PopoverContent>
        </Popover>
        {showComparePrior ? (
          <AdminOutlinePill active={comparePrior} onClick={() => onComparePrior(!comparePrior)}>
            Compare prior
          </AdminOutlinePill>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onCity && cityOptions ? (
          <AdminFilterSelect
            value={city || 'all'}
            onChange={onCity}
            options={cityOptions}
            className="h-9 min-w-[132px]"
          />
        ) : null}
        {onCategory && categoryOptions ? (
          <AdminFilterSelect
            value={category || 'all'}
            onChange={onCategory}
            options={categoryOptions}
            className="h-9 min-w-[148px]"
          />
        ) : null}
        {onExcludeGhosts != null ? (
          <AdminOutlinePill active={!!excludeGhosts} onClick={() => onExcludeGhosts(!excludeGhosts)}>
            Exclude ghosts
          </AdminOutlinePill>
        ) : null}
        {extraFilters}
      </div>
    </div>
  );
}

export function AnalyticsModuleTabs({
  active,
  onChange,
}: {
  active: PlatformTab;
  onChange: (tab: PlatformTab) => void;
}) {
  return (
    <div className="scrollbar-hide flex gap-1.5 overflow-x-auto">
      {PLATFORM_TABS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors',
            active === id
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'bg-[hsl(var(--admin-surface))] text-muted-foreground hover:bg-[hsl(var(--admin-surface-2))] hover:text-foreground'
          )}
        >
          {PLATFORM_TAB_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsAlertRow({ items }: { items: { label: string; tone?: 'primary' | 'muted' }[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            'rounded-full border border-border px-3 py-1.5 text-[11px] font-medium',
            item.tone === 'primary' ? 'text-primary' : 'text-foreground'
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function AnalyticsChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminSectionPanel title={title} description={description} className={className}>
      <div className="h-[200px] w-full">{children}</div>
    </AdminSectionPanel>
  );
}

export function AnalyticsBarSeries({
  data,
  dataKey = 'value',
  compareKey,
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  compareKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        {compareKey ? (
          <Bar dataKey={compareKey} fill="hsl(var(--muted-foreground))" opacity={0.35} radius={[4, 4, 0, 0]} />
        ) : null}
        <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsLineSeries({
  data,
  dataKey = 'value',
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsDonut({
  data,
}: {
  data: Array<{ name: string; value: number; color?: string }>;
}) {
  const colors = ['hsl(var(--primary))', '#22c55e', '#3b82f6', '#a855f7', '#eab308'];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color || colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsRankedList({
  title,
  rows,
  deepLink,
}: {
  title: string;
  rows: Array<{ title: string; meta?: string; value: string }>;
  deepLink?: { to: string; label: string };
}) {
  return (
    <AdminSectionPanel title={title}>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No data in range.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.title}
              className="flex items-center gap-2 rounded-xl bg-[hsl(var(--admin-surface))] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-foreground">{row.title}</div>
                {row.meta ? (
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.meta}</div>
                ) : null}
              </div>
              <div className="shrink-0 text-[12px] font-semibold text-foreground">{row.value}</div>
            </div>
          ))
        )}
      </div>
      {deepLink ? (
        <Link
          to={deepLink.to}
          className="mt-3 inline-flex text-[12px] font-semibold text-primary hover:underline"
        >
          {deepLink.label}
        </Link>
      ) : null}
    </AdminSectionPanel>
  );
}

export function AnalyticsHeaderActions({
  onExport,
  onRefresh,
  onGenerateAi,
  aiBusy,
}: {
  onExport?: () => void;
  onRefresh?: () => void;
  onGenerateAi?: () => void;
  aiBusy?: boolean;
}) {
  return (
    <>
      <AdminOutlinePill onClick={onExport}>Export</AdminOutlinePill>
      <AdminOutlinePill onClick={onRefresh}>Refresh</AdminOutlinePill>
      <AdminPrimaryPill onClick={onGenerateAi} disabled={aiBusy}>
        {aiBusy ? 'Generating…' : 'Generate AI'}
      </AdminPrimaryPill>
    </>
  );
}
