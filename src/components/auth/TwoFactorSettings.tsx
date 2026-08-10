import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Switch } from '@/components/ui/switch';
import {
  enrollTotp,
  listVerifiedTotpFactors,
  syncTwoFactorProfileFlag,
  unenrollTotp,
  verifyTotpCode,
  type EnrollTotpResult,
} from '@/lib/mfa-service';
import { cn } from '@/lib/utils';

type TwoFactorSettingsProps = {
  userId: string;
  /** Visual variant for dark Settings page vs light WebSettings. */
  variant?: 'dark' | 'light';
  /** `row` = label + switch (Settings cards). `switchOnly` = trailing switch for WebSettings rows. */
  layout?: 'row' | 'switchOnly';
  className?: string;
  disabled?: boolean;
  onStatusChange?: (enabled: boolean) => void;
};

/**
 * Enable / disable authenticator-app (TOTP) MFA with QR enroll + code verify.
 */
export function TwoFactorSettings({
  userId,
  variant = 'light',
  layout = 'row',
  className,
  disabled,
  onStatusChange,
}: TwoFactorSettingsProps) {
  const dark = variant === 'dark';
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enroll, setEnroll] = useState<EnrollTotpResult | null>(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const factors = await listVerifiedTotpFactors();
      const on = factors.length > 0;
      setEnabled(on);
      setFactorId(factors[0]?.id ?? null);
      onStatusChange?.(on);
      await syncTwoFactorProfileFlag(userId, on);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startEnroll = async () => {
    setBusy(true);
    setEnrollError(null);
    setEnrollCode('');
    try {
      const result = await enrollTotp('WYA');
      setEnroll(result);
      setEnrollOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start 2FA setup');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!enroll) return;
    setBusy(true);
    setEnrollError(null);
    try {
      await verifyTotpCode(enroll.factorId, enrollCode);
      await syncTwoFactorProfileFlag(userId, true);
      setEnabled(true);
      setFactorId(enroll.factorId);
      onStatusChange?.(true);
      setEnrollOpen(false);
      setEnroll(null);
      toast.success('Two-factor authentication enabled');
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const cancelEnroll = async () => {
    if (enroll?.factorId) {
      try {
        await unenrollTotp(enroll.factorId);
      } catch {
        /* unverified factor cleanup best-effort */
      }
    }
    setEnrollOpen(false);
    setEnroll(null);
    setEnrollCode('');
    setEnrollError(null);
  };

  const confirmDisable = async () => {
    if (!factorId) {
      toast.error('No authenticator found to disable');
      return;
    }
    setBusy(true);
    setDisableError(null);
    try {
      await verifyTotpCode(factorId, disableCode);
      await unenrollTotp(factorId);
      await syncTwoFactorProfileFlag(userId, false);
      setEnabled(false);
      setFactorId(null);
      onStatusChange?.(false);
      setDisableOpen(false);
      setDisableCode('');
      toast.success('Two-factor authentication disabled');
    } catch (e) {
      setDisableError(e instanceof Error ? e.message : 'Could not disable 2FA');
    } finally {
      setBusy(false);
    }
  };

  const onToggle = (checked: boolean) => {
    if (checked) void startEnroll();
    else {
      setDisableCode('');
      setDisableError(null);
      setDisableOpen(true);
    }
  };

  const switchControl =
    loading ? (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    ) : (
      <Switch
        checked={enabled}
        disabled={busy || disabled}
        onCheckedChange={onToggle}
      />
    );

  const dialogs = (
    <>
      <Dialog
        open={enrollOpen}
        onOpenChange={(open) => {
          if (!open) void cancelEnroll();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up authenticator</DialogTitle>
            <DialogDescription>
              Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit
              code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {enroll?.qrCode ? (
              <img
                src={enroll.qrCode}
                alt="Authenticator QR code"
                className="h-48 w-48 rounded-lg bg-white p-2"
              />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
            {enroll?.secret ? (
              <div className="w-full space-y-1">
                <Label className="text-xs text-muted-foreground">Or enter this key manually</Label>
                <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">
                  {enroll.secret}
                </code>
              </div>
            ) : null}
            <div className="flex w-full flex-col items-center gap-2">
              <Label>Verification code</Label>
              <InputOTP
                maxLength={6}
                value={enrollCode}
                onChange={setEnrollCode}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {enrollError ? <p className="text-sm text-destructive">{enrollError}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void cancelEnroll()} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmEnroll()}
              disabled={busy || enrollCode.length !== 6}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter a current code from your authenticator app to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <InputOTP
              maxLength={6}
              value={disableCode}
              onChange={setDisableCode}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {disableError ? <p className="text-sm text-destructive">{disableError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDisable()}
              disabled={busy || disableCode.length !== 6}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (layout === 'switchOnly') {
    return (
      <div className={cn('flex items-center', className)}>
        {switchControl}
        {dialogs}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="min-w-0">
        <div
          className={cn(
            'flex items-center gap-2 font-medium',
            dark ? 'text-white' : 'text-foreground'
          )}
        >
          {enabled ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <ShieldOff className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span>Two-factor authentication</span>
        </div>
        <p className={cn('mt-0.5 text-sm', dark ? 'text-text-white/70' : 'text-muted-foreground')}>
          {loading
            ? 'Checking status…'
            : enabled
              ? 'Authenticator app is protecting your account'
              : 'Use an authenticator app for a one-time code at sign-in'}
        </p>
      </div>
      {switchControl}
      {dialogs}
    </div>
  );
}
