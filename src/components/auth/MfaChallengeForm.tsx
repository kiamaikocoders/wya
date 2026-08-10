import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { listVerifiedTotpFactors, verifyTotpCode } from '@/lib/mfa-service';
import { cn } from '@/lib/utils';

type MfaChallengeFormProps = {
  onVerified: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  className?: string;
  /** Match login card styling when embedded. */
  mutedClassName?: string;
  headingClassName?: string;
};

/**
 * Post-password MFA challenge — enter authenticator app code.
 */
export function MfaChallengeForm({
  onVerified,
  onCancel,
  className,
  mutedClassName,
  headingClassName,
}: MfaChallengeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const factors = await listVerifiedTotpFactors();
      const factor = factors[0];
      if (!factor) throw new Error('No authenticator is enrolled on this account');
      await verifyTotpCode(factor.id, code);
      await onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="space-y-1.5">
        <h2 className={cn('text-[28px] font-extrabold tracking-tight', headingClassName)}>
          Check your authenticator
        </h2>
        <p className={cn('text-sm', mutedClassName)}>
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Label className="sr-only">Authentication code</Label>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          containerClassName="justify-center"
          autoFocus
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="h-12 w-full rounded-full bg-[#ff6b35] text-base font-semibold text-white hover:bg-[#ff6b35]/90"
          disabled={busy || code.length !== 6}
          onClick={() => void submit()}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify and continue
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={busy}
          onClick={() => void onCancel()}
        >
          Cancel and sign out
        </Button>
      </div>
    </div>
  );
}
