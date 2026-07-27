import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  STATUS_CONTENT,
  type StatusCta,
  type StatusVariant,
} from '@/components/status/status-content';

export type StatusScreenProps = {
  variant: StatusVariant;
  /** Hide the status nav (for in-page empty states). */
  embedded?: boolean;
  className?: string;
  onRetry?: () => void;
  onClearFilters?: () => void;
  /** Override primary / secondary CTA handlers when using action kinds. */
  onPrimary?: () => void;
  onSecondary?: () => void;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function StatusCtaButton({
  cta,
  tone,
  isDark,
  onAction,
}: {
  cta: StatusCta;
  tone: 'primary' | 'secondary';
  isDark: boolean;
  onAction?: () => void;
}) {
  const isPrimary = tone === 'primary';
  const className = cn(
    'inline-flex items-center justify-center px-[22px] py-3.5 text-sm transition-opacity hover:opacity-90',
    isPrimary
      ? 'rounded-xl bg-[#ff6b35] font-bold text-white'
      : cn(
          'rounded-xl border-[1.5px] font-semibold',
          isDark
            ? 'border-[#21262d] text-[#e6edf3]'
            : 'border-[#d0d7de] text-[#1f2328]'
        )
  );

  if (cta.kind === 'link') {
    return (
      <Link to={cta.to} className={className}>
        {cta.label}
      </Link>
    );
  }

  if (cta.kind === 'mailto') {
    return (
      <a href={cta.href} className={className}>
        {cta.label}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onAction}>
      {cta.label}
    </button>
  );
}

/**
 * Figma 17 — Status screens (404 / 500 / Offline / Maintenance / 403 / Empty).
 * Light + dark via ThemeContext.
 */
export function StatusScreen({
  variant,
  embedded = false,
  className,
  onRetry,
  onClearFilters,
  onPrimary,
  onSecondary,
}: StatusScreenProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const content = STATUS_CONTENT[variant];
  const Icon = content.icon;
  const { r, g, b } = hexToRgb(content.accent);

  const handleAction = (action: 'retry' | 'reload' | 'clear_filters' | 'notify') => {
    if (action === 'retry') {
      if (onPrimary) {
        onPrimary();
        return;
      }
      if (onRetry) {
        onRetry();
        return;
      }
      window.location.reload();
      return;
    }
    if (action === 'reload') {
      if (onPrimary) {
        onPrimary();
        return;
      }
      window.location.reload();
      return;
    }
    if (action === 'clear_filters') {
      if (onPrimary) {
        onPrimary();
        return;
      }
      onClearFilters?.();
    }
  };

  const runCta = (cta: StatusCta, which: 'primary' | 'secondary') => {
    if (cta.kind !== 'action') return undefined;
    if (which === 'primary' && onPrimary) return onPrimary;
    if (which === 'secondary' && onSecondary) return onSecondary;
    return () => handleAction(cta.action);
  };

  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col',
        isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]',
        embedded && 'min-h-0 bg-transparent',
        className
      )}
    >
      {!embedded ? (
        <header
          className={cn(
            'relative z-10 flex h-16 shrink-0 items-center justify-between px-6 sm:px-12',
            isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'
          )}
        >
          <Logo
            href="/"
            size="sm"
            compact
            className="[&_img]:!h-7 [&_img]:!min-w-0 [&>div]:!min-w-0"
          />
          <Link
            to="/"
            className={cn(
              'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90',
              isDark
                ? 'border-[#21262d] text-[#e6edf3]'
                : 'border-[#d0d7de] text-[#1f2328]'
            )}
          >
            Back to Home
          </Link>
        </header>
      ) : null}

      {!embedded ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 55% 50% at 0% 40%, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.09) 45%, transparent 70%)`,
          }}
        />
      ) : null}

      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col items-center justify-center gap-[18px] px-6 pb-12 pt-10 text-center sm:px-12',
          embedded && 'py-16'
        )}
      >
        <div
          className="flex items-center justify-center rounded-3xl border p-[22px]"
          style={{
            backgroundColor: `rgba(${r},${g},${b},0.14)`,
            borderColor: `rgba(${r},${g},${b},0.35)`,
          }}
        >
          <Icon className="h-9 w-9" style={{ color: content.accent }} strokeWidth={2.25} />
        </div>

        {content.code ? (
          <p
            className="font-extrabold tracking-[-2px] text-[72px] leading-none sm:text-[96px]"
            style={{ color: content.accent }}
          >
            {content.code}
          </p>
        ) : null}

        <h1
          className={cn(
            'max-w-[560px] text-[28px] font-extrabold leading-10 sm:text-[32px]',
            isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'
          )}
        >
          {content.title}
        </h1>

        <p
          className={cn(
            'max-w-[520px] text-base leading-[26px]',
            isDark ? 'text-[#8b949e]' : 'text-[#656d76]'
          )}
        >
          {content.body}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <StatusCtaButton
            cta={content.primary}
            tone="primary"
            isDark={isDark}
            onAction={runCta(content.primary, 'primary')}
          />
          <StatusCtaButton
            cta={content.secondary}
            tone="secondary"
            isDark={isDark}
            onAction={runCta(content.secondary, 'secondary')}
          />
        </div>

        <p
          className={cn(
            'text-xs',
            isDark ? 'text-[#8b949e]' : 'text-[#656d76]'
          )}
        >
          {content.meta}
        </p>
      </div>
    </div>
  );
}

export default StatusScreen;
