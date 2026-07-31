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

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

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
}: {
  period: AnalyticsPeriod;
  onPeriod: (p: AnalyticsPeriod) => void;
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
}) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['7d', '7d'],
            ['30d', '30d'],
            ['90d', '90d'],
            ['custom', 'Custom'],
          ] as const
        ).map(([id, label]) => (
          <AdminOutlinePill key={id} active={period === id} onClick={() => onPeriod(id)}>
            {label}
          </AdminOutlinePill>
        ))}
        <AdminOutlinePill active={comparePrior} onClick={() => onComparePrior(!comparePrior)}>
          Compare prior
        </AdminOutlinePill>
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
