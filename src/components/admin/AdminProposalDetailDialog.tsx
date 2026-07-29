import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Users,
  Wallet,
  X,
  Building2,
  UserRound,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AdminStatusPill } from '@/components/admin/AdminPageShell';
import { cn } from '@/lib/utils';

export type AdminProposalDetail = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  estimated_date: string | null;
  location: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  submitted_on: string | null;
  expected_attendees: number | null;
  budget: string | null;
  sponsor_needs: string | null;
  image_url: string | null;
  admin_notes: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  submitter_name?: string;
  is_registered: boolean;
};

type Props = {
  proposal: AdminProposalDetail | null;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onApprove: (id: number, note?: string) => void;
  onReject: (id: number, reason: string) => void;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'EEEE, d MMM yyyy');
  } catch {
    return value;
  }
}

function formatSubmitted(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'd MMM yyyy · HH:mm');
  } catch {
    return value;
  }
}

/**
 * Admin proposal detail modal — full pitch + proposer + decision with feedback email.
 */
export function AdminProposalDetailDialog({
  proposal,
  open,
  onClose,
  busy,
  onApprove,
  onReject,
}: Props) {
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState<'idle' | 'approve' | 'reject'>('idle');

  useEffect(() => {
    if (!open || !proposal) return;
    setFeedback(proposal.admin_notes || '');
    setAction('idle');
  }, [open, proposal?.id, proposal?.admin_notes]);

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

  if (!open || !proposal) return null;

  const place = proposal.location?.split(',')[0]?.trim() || proposal.location || 'Kenya';
  const subtitle = `${place} · ${proposal.category || 'Event'}`;
  const statusTone =
    proposal.status === 'approved'
      ? ('success' as const)
      : proposal.status === 'pending'
        ? ('warning' as const)
        : ('error' as const);

  const pending = proposal.status === 'pending';

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)] backdrop-blur-[2px]"
        aria-label="Close proposal details"
        onClick={() => !busy && onClose()}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-proposal-detail-title"
          className="pointer-events-auto relative flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] border border-border bg-background shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="relative h-[160px] w-full shrink-0 overflow-hidden sm:h-[220px]">
            {proposal.image_url ? (
              <img
                src={proposal.image_url}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[hsl(var(--admin-surface-2))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(13,18,23,0.55)]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
              <div className="flex flex-wrap gap-2">
                {proposal.category ? (
                  <span className="rounded-full border border-border bg-[hsl(var(--admin-surface-2))] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {proposal.category}
                  </span>
                ) : null}
                <AdminStatusPill tone={proposal.is_registered ? 'success' : 'warning'}>
                  {proposal.is_registered ? 'Registered' : 'Unregistered'}
                </AdminStatusPill>
                <AdminStatusPill tone={statusTone}>
                  {proposal.status === 'approved'
                    ? '✓ Approved'
                    : proposal.status === 'pending'
                      ? 'Pending'
                      : 'Rejected'}
                </AdminStatusPill>
              </div>
              <button
                type="button"
                onClick={() => !busy && onClose()}
                className="flex size-9 items-center justify-center rounded-full bg-black/45 text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-7">
            <div className="flex flex-col gap-4 pb-5">
              <div className="space-y-1.5">
                <h2
                  id="admin-proposal-detail-title"
                  className="text-[26px] font-extrabold text-foreground"
                >
                  {proposal.title}
                </h2>
                <p className="text-[13px] text-muted-foreground">{subtitle}</p>
              </div>

              <div className="space-y-2.5 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <MetaRow
                  icon={<Calendar className="size-3.5 text-primary" />}
                  label="Proposed date"
                  value={formatDate(proposal.estimated_date)}
                />
                <MetaRow
                  icon={<MapPin className="size-3.5 text-primary" />}
                  label="Location"
                  value={proposal.location || '—'}
                />
                <MetaRow
                  icon={<Users className="size-3.5 text-primary" />}
                  label="Expected attendees"
                  value={
                    proposal.expected_attendees != null
                      ? proposal.expected_attendees.toLocaleString()
                      : '—'
                  }
                />
                <MetaRow
                  icon={<Wallet className="size-3.5 text-primary" />}
                  label="Budget"
                  value={proposal.budget || '—'}
                />
                <MetaRow
                  icon={<Building2 className="size-3.5 text-primary" />}
                  label="Sponsor needs"
                  value={proposal.sponsor_needs || '—'}
                />
              </div>

              {proposal.description ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    ABOUT THIS EVENT
                  </p>
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-foreground">
                    {proposal.description}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2.5 rounded-[14px] border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-3">
                <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                  SUBMITTED BY
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {(proposal.submitter_name || proposal.contact_email || 'G')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {proposal.submitter_name ||
                        (proposal.is_registered ? 'Registered user' : 'Guest')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {proposal.is_registered
                        ? 'Has a WYA account'
                        : 'No WYA account yet'}{' '}
                      · Submitted {formatSubmitted(proposal.submitted_on)}
                    </p>
                  </div>
                </div>
                <MetaRow
                  icon={<Mail className="size-3.5 text-primary" />}
                  label="Contact email"
                  value={proposal.contact_email || '—'}
                />
                <MetaRow
                  icon={<Phone className="size-3.5 text-primary" />}
                  label="Contact phone"
                  value={proposal.contact_phone || '—'}
                />
                {proposal.submitted_by ? (
                  <MetaRow
                    icon={<UserRound className="size-3.5 text-primary" />}
                    label="Account ID"
                    value={proposal.submitted_by}
                  />
                ) : null}
              </div>

              {proposal.status !== 'pending' && proposal.admin_notes ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                    ADMIN NOTES SENT
                  </p>
                  <p className="whitespace-pre-wrap rounded-xl border border-border bg-[hsl(var(--admin-surface))] px-3.5 py-2.5 text-[13px] leading-5 text-foreground">
                    {proposal.admin_notes}
                  </p>
                </div>
              ) : null}

              {pending ? (
                <div className="space-y-2.5">
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-[11px] font-semibold tracking-[1.2px] text-muted-foreground">
                      COURSE OF ACTION
                    </p>
                    {action === 'reject' ? (
                      <span className="text-[11px] text-muted-foreground">
                        Feedback required for reject / changes
                      </span>
                    ) : null}
                  </div>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      action === 'reject'
                        ? 'Tell them what to change so they can resubmit…'
                        : 'Optional note for the submitter (included in the decision email)…'
                    }
                    rows={4}
                    disabled={busy}
                    className="min-h-[96px] resize-y rounded-[12px] border-border bg-[hsl(var(--admin-surface))] text-[13px]"
                  />
                  {action === 'reject' && feedback.trim().length > 0 && feedback.trim().length < 8 ? (
                    <p className="text-[11px] text-[hsl(var(--admin-error))]">
                      Add a bit more detail (at least a short sentence).
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      className="flex-1 rounded-[10px] bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
                      onClick={() => {
                        setAction('approve');
                        onApprove(proposal.id, feedback.trim() || undefined);
                      }}
                    >
                      {busy && action === 'approve' ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Approving…
                        </span>
                      ) : (
                        'Approve & email'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busy || (action === 'reject' && feedback.trim().length < 8)}
                      className={cn(
                        'flex-1 rounded-[10px] border border-border py-3 text-sm font-semibold text-[hsl(var(--admin-error))] disabled:opacity-60',
                        action === 'reject' && 'ring-1 ring-[hsl(var(--admin-error)/0.35)]'
                      )}
                      onClick={() => {
                        const note = feedback.trim();
                        if (note.length < 8) {
                          setAction('reject');
                          return;
                        }
                        setAction('reject');
                        onReject(proposal.id, note);
                      }}
                    >
                      {busy && action === 'reject' ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Sending…
                        </span>
                      ) : action === 'reject' && feedback.trim().length < 8 ? (
                        'Add feedback, then confirm'
                      ) : (
                        'Request changes & email'
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Decision emails go to {proposal.contact_email || 'their contact email'}
                    {proposal.is_registered ? ' (and their account inbox if different)' : ''}.
                    Rejection feedback is required so they know how to resubmit.
                  </p>
                </div>
              ) : null}
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
        <span className="block break-words text-[13px] font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}
