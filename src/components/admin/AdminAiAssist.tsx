import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toDisplayParagraphs } from '@/lib/ai-plain-text';
import { AdminOutlinePill } from '@/components/admin/AdminPageShell';

type WriteProps = {
  label?: string;
  disabled?: boolean;
  /** Shown when user clicks while disabled (e.g. missing subject). */
  needHint?: string;
  className?: string;
  run: () => Promise<string>;
  onResult: (text: string) => void;
};

/** Compact “Write with AI” control for form fields. */
export function AdminAiWriteButton({
  label = 'Write with AI',
  disabled,
  needHint,
  className,
  run,
  onResult,
}: WriteProps) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (disabled) {
      if (needHint) toast.message(needHint);
      return;
    }
    setBusy(true);
    try {
      const text = await run();
      if (!text.trim()) throw new Error('Empty AI response');
      onResult(text.trim());
      toast.success('AI draft ready — review before publishing');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-[hsl(var(--admin-surface))] px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-[hsl(var(--admin-surface-2))] disabled:opacity-50',
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3 text-primary" />
      )}
      {busy ? 'Writing…' : label}
    </button>
  );
}

type InsightProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  emptyHint?: string;
  className?: string;
  run: () => Promise<string>;
};

/** Section-level AI insight box with generate / regenerate. */
export function AdminAiInsightPanel({
  title = 'AI insights',
  description,
  buttonLabel = 'Generate insights',
  emptyHint = 'Generate a plain-language summary from the data on this page.',
  className,
  run,
}: InsightProps) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');

  const generate = async () => {
    setBusy(true);
    try {
      const next = await run();
      if (!next.trim()) throw new Error('Empty AI response');
      setText(next.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setBusy(false);
    }
  };

  const paragraphs = text ? toDisplayParagraphs(text) : [];

  return (
    <div
      className={cn(
        'rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] p-4',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {title}
          </div>
          {description ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <AdminOutlinePill disabled={busy} onClick={() => void generate()}>
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Working…
            </span>
          ) : text ? (
            'Regenerate'
          ) : (
            buttonLabel
          )}
        </AdminOutlinePill>
      </div>

      {!text && !busy ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : null}

      {busy && !text ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {paragraphs.length ? (
        <div className="space-y-2.5 text-sm leading-relaxed text-foreground">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type InlineProps = {
  label?: string;
  className?: string;
  run: () => Promise<string>;
};

/** Per-row AI note that expands under the control. */
export function AdminAiInlineNote({ label = 'AI review', className, run }: InlineProps) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const onClick = async () => {
    if (open && text) {
      setOpen(false);
      return;
    }
    if (text) {
      setOpen(true);
      return;
    }
    setBusy(true);
    try {
      const next = await run();
      if (!next.trim()) throw new Error('Empty AI response');
      setText(next.trim());
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setBusy(false);
    }
  };

  const paragraphs = text ? toDisplayParagraphs(text) : [];

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3 text-primary" />
        )}
        {busy ? 'Analyzing…' : open ? 'Hide AI' : label}
      </button>
      {open && paragraphs.length ? (
        <div className="mt-2 rounded-[12px] border border-border bg-[hsl(var(--admin-surface-2))] px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
          {paragraphs.map((p, i) => (
            <p key={i} className={i ? 'mt-2' : undefined}>
              {p}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
