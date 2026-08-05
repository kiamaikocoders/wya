import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  Tag,
  UserRound,
  X,
} from 'lucide-react';
import { AdminStatusPill } from '@/components/admin/AdminPageShell';
import type { AppFeedbackWithProfile, FeedbackStatus } from '@/lib/feedback-service';
import { cn } from '@/lib/utils';

type Props = {
  feedback: AppFeedbackWithProfile | null;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onUpdateStatus: (id: string, status: FeedbackStatus) => void;
  onDelete: (id: string) => void;
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'EEEE, d MMM yyyy · HH:mm');
  } catch {
    return value;
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  bug: 'Bug report',
  idea: 'Idea',
  general: 'General feedback',
  other: 'Other',
  contact: 'Contact support',
};

/**
 * Admin app-feedback detail modal — full message + submitter + status actions.
 */
export function AdminFeedbackDetailDialog({
  feedback,
  open,
  onClose,
  busy,
  onUpdateStatus,
  onDelete,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, busy]);

  if (!open || !feedback) return null;

  const name =
    feedback.profiles?.full_name?.trim() ||
    feedback.profiles?.username?.trim() ||
    (feedback.category === 'contact' ? 'Contact guest' : 'User');
  const username = feedback.profiles?.username?.trim() || null;
  const avatar = feedback.profiles?.avatar_url || null;
  const categoryLabel = CATEGORY_LABEL[feedback.category] || feedback.category;
  const statusTone =
    feedback.status === 'new'
      ? ('primary' as const)
      : feedback.status === 'read'
        ? ('muted' as const)
        : ('success' as const);

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)] backdrop-blur-[2px]"
        aria-label="Close feedback details"
        onClick={() => !busy && onClose()}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-feedback-detail-title"
          className="pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-[20px] border border-border bg-background shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="relative shrink-0 border-b border-border bg-[hsl(var(--admin-surface))] px-5 pb-4 pt-4 sm:px-7">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="size-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-base font-bold text-primary">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2
                    id="admin-feedback-detail-title"
                    className="truncate text-[22px] font-extrabold text-foreground"
                  >
                    {name}
                  </h2>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {username ? `@${username}` : 'Signed-in user'} · {categoryLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !busy && onClose()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--admin-surface-2))] text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminStatusPill tone={statusTone}>{feedback.status}</AdminStatusPill>
              <AdminStatusPill tone="muted">{categoryLabel}</AdminStatusPill>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-7">
            <div className="flex flex-col gap-4 pb-5">
              <div className="space-y-2.5 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <MetaRow
                  icon={<Calendar className="size-3.5 text-primary" />}
                  label="Submitted"
                  value={formatWhen(feedback.created_at)}
                />
                <MetaRow
                  icon={<Tag className="size-3.5 text-primary" />}
                  label="Category"
                  value={categoryLabel}
                />
                <MetaRow
                  icon={<Link2 className="size-3.5 text-primary" />}
                  label="Page path"
                  value={feedback.page_path || '—'}
                />
                <MetaRow
                  icon={<FolderOpen className="size-3.5 text-primary" />}
                  label="Status"
                  value={feedback.status}
                />
                <MetaRow
                  icon={<UserRound className="size-3.5 text-primary" />}
                  label="User ID"
                  value={feedback.user_id}
                />
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                  <FileText className="size-3.5" />
                  FULL MESSAGE
                </p>
                <p className="whitespace-pre-wrap rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3 text-[14px] leading-6 text-foreground">
                  {feedback.message}
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                  COURSE OF ACTION
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {feedback.status === 'new' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="flex-1 rounded-[10px] bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
                      onClick={() => onUpdateStatus(feedback.id, 'read')}
                    >
                      {busy ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Updating…
                        </span>
                      ) : (
                        'Mark as read'
                      )}
                    </button>
                  ) : null}
                  {feedback.status !== 'archived' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(
                        'rounded-[10px] border border-border py-3 text-sm font-semibold text-foreground disabled:opacity-60',
                        feedback.status === 'new' ? 'flex-1' : 'w-full'
                      )}
                      onClick={() => onUpdateStatus(feedback.id, 'archived')}
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="flex-1 rounded-[10px] border border-border py-3 text-sm font-semibold text-foreground disabled:opacity-60"
                      onClick={() => onUpdateStatus(feedback.id, 'read')}
                    >
                      Unarchive (mark read)
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    className="w-full rounded-[10px] border border-border py-3 text-sm font-semibold text-[hsl(var(--admin-error))] disabled:opacity-60"
                    onClick={() => onDelete(feedback.id)}
                  >
                    Delete feedback
                  </button>
                </div>
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Status changes notify the user in-app. Opening this panel does not change status
                  until you act.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--admin-surface-2))]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="block break-all text-[13px] font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}
