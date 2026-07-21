import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { AttendeeSignupConsents } from '@/lib/signup-consent';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

type SignupConsentModalProps = {
  open: boolean;
  consents: AttendeeSignupConsents;
  mediaChoice: 'yes' | 'no' | '';
  onChange: (patch: Partial<AttendeeSignupConsents>) => void;
  onMediaChoice: (choice: 'yes' | 'no') => void;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

function CheckRow({
  checked,
  onToggle,
  children,
  isDark,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-start gap-2.5 text-left">
      <span
        className={cn(
          'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[4px]',
          checked
            ? 'bg-[#ff6b35]'
            : cn('border-[1.5px]', isDark ? 'border-[#21262d]' : 'border-[#d0d7de]')
        )}
        aria-hidden
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={cn('text-[13px] leading-[19px]', isDark ? 'text-[#e6edf3]' : 'text-[#0d1117]')}>
        {children}
      </span>
    </button>
  );
}

export function SignupConsentModal({
  open,
  consents,
  mediaChoice,
  onChange,
  onMediaChoice,
  onClose,
  onBack,
  onConfirm,
  isSubmitting,
}: SignupConsentModalProps) {
  const t = useWebAuthTheme();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(13,17,23,0.72)]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] border px-8 py-7 shadow-[0px_28px_56px_0px_rgba(0,0,0,0.5)]',
          t.isDark
            ? 'border-[#21262d] bg-[#161b22]'
            : 'border-[#e8ecf0] bg-[#f6f8fa] shadow-[0px_28px_56px_0px_rgba(0,0,0,0.14)]'
        )}
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[1.4px] text-[#ff6b35]">
              PERMISSIONS & PRIVACY
            </p>
            <h2 id="consent-title" className={cn('mt-1 text-2xl font-bold', t.heading)}>
              Almost there
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              t.inset,
              t.muted
            )}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className={cn('mb-3.5 text-[13px] leading-5', t.muted)}>
          Review these before we create your account. Required items are marked.
        </p>

        <div className="mb-3.5 space-y-3">
          <CheckRow
            checked={consents.acceptTerms}
            onToggle={() => onChange({ acceptTerms: !consents.acceptTerms })}
            isDark={t.isDark}
          >
            I agree to the{' '}
            <Link to="/terms-of-service" target="_blank" rel="noreferrer" className={t.accentLink} onClick={(e) => e.stopPropagation()}>
              Attendee Terms and Conditions
            </Link>
            . (Required)
          </CheckRow>
          <CheckRow
            checked={consents.acceptPrivacy}
            onToggle={() => onChange({ acceptPrivacy: !consents.acceptPrivacy })}
            isDark={t.isDark}
          >
            I agree to the{' '}
            <Link to="/privacy-policy" target="_blank" rel="noreferrer" className={t.accentLink} onClick={(e) => e.stopPropagation()}>
              Privacy Policy
            </Link>
            . (Required)
          </CheckRow>
          <CheckRow
            checked={consents.marketingOptIn}
            onToggle={() => onChange({ marketingOptIn: !consents.marketingOptIn })}
            isDark={t.isDark}
          >
            I would like marketing and promotional messages.
          </CheckRow>
          <CheckRow
            checked={consents.locationOptIn}
            onToggle={() => onChange({ locationOptIn: !consents.locationOptIn })}
            isDark={t.isDark}
          >
            I consent to location-based recommendations.
          </CheckRow>
          <CheckRow
            checked={consents.organizerSharingOptIn}
            onToggle={() => onChange({ organizerSharingOptIn: !consents.organizerSharingOptIn })}
            isDark={t.isDark}
          >
            Event-related posts may be shared with organizers.
          </CheckRow>
        </div>

        <div className={cn('mb-3.5 space-y-2.5 rounded-xl border p-3.5', t.inset, t.isDark ? 'border-[#21262d]' : 'border-[#e8ecf0]')}>
          <p className={cn('text-sm font-semibold', t.heading)}>Media consent (Required)</p>
          <p className={cn('text-xs leading-[18px]', t.muted)}>
            Do you consent to promotional use of photos, video, or audio of you at events? See{' '}
            <Link to="/media-consent" target="_blank" rel="noreferrer" className={t.accentLink}>
              Media consent
            </Link>
            .
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => onMediaChoice('yes')}
              className={cn(
                'flex-1 rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold',
                mediaChoice === 'yes'
                  ? 'border-[#ff6b35] bg-[rgba(255,107,53,0.12)] text-[#ff6b35]'
                  : cn(t.isDark ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3]' : 'border-[#d0d7de] bg-white text-[#0d1117]')
              )}
            >
              Yes, I consent
            </button>
            <button
              type="button"
              onClick={() => onMediaChoice('no')}
              className={cn(
                'flex-1 rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold',
                mediaChoice === 'no'
                  ? 'border-[#ff6b35] bg-[rgba(255,107,53,0.12)] text-[#ff6b35]'
                  : cn(t.isDark ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3]' : 'border-[#d0d7de] bg-white text-[#0d1117]')
              )}
            >
              No
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onBack} className={cn(t.outlineBtn, 'flex-1')}>
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(t.primaryBtn, 'flex-1')}
          >
            {isSubmitting ? 'Creating…' : 'Agree & Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
