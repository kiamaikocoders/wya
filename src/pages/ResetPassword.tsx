import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/ui/Logo';
import { WebAuthOverlayShell } from '@/components/auth/WebAuthOverlayShell';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';
import { bootLocation, paramsFromAuthUrl } from '@/lib/auth-recovery';

const capturedResetLocation =
  typeof window !== 'undefined'
    ? { search: window.location.search || bootLocation.search, hash: window.location.hash || bootLocation.hash }
    : { search: '', hash: '' };

async function establishRecoverySession(): Promise<boolean> {
  const params = paramsFromAuthUrl(capturedResetLocation.search, capturedResetLocation.hash);

  for (let i = 0; i < 10; i += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return true;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return true;
  }

  const tokenHash = params.get('token_hash') || params.get('token');
  const type = params.get('type') || 'recovery';
  if (tokenHash && (type === 'recovery' || type === 'email' || !params.get('type'))) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (!error) return true;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) return true;
  }

  return false;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const t = useWebAuthTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      const ok = await establishRecoverySession();
      setHasSession(ok);
      setChecking(false);
      if (!ok) {
        toast.error('Invalid or expired reset link. Please request a new password reset.');
        setTimeout(() => navigate('/forgot-password'), 2200);
      }
    };
    void run();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      await supabase.auth.signOut();
    } catch (error: unknown) {
      console.error('Reset password failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. The link may have expired.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="size-8 animate-spin text-[#ff6b35]" />
          <p className={cn('text-sm', t.muted)}>Verifying reset link…</p>
        </div>
      </WebAuthOverlayShell>
    );
  }

  if (isSuccess) {
    return (
      <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <Logo href="/" size="sm" className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
          <div className="flex size-[46px] items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </div>
          <h1 className={cn('text-[26px] font-bold', t.heading)}>Password Reset Successful</h1>
          <p className={cn('text-sm leading-[22px]', t.muted)}>
            You can sign in on this website or open the WYA app and use the same email and new
            password.
          </p>
          <button type="button" onClick={() => navigate('/login')} className={t.primaryBtn}>
            Sign in on the website
          </button>
          <Link to="/download" className={t.outlineBtn}>
            Open the WYA app
          </Link>
        </div>
      </WebAuthOverlayShell>
    );
  }

  if (!hasSession) {
    return (
      <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className={cn('text-[26px] font-bold', t.heading)}>Invalid Reset Link</h1>
          <p className={cn('text-sm', t.muted)}>Redirecting so you can request a new link…</p>
        </div>
      </WebAuthOverlayShell>
    );
  }

  return (
    <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
      <div className="flex flex-col items-start gap-3.5">
        <Logo href="/" size="sm" className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
        <h1 className={cn('text-[26px] font-bold', t.heading)}>Reset Password</h1>
        <p className={cn('text-sm leading-[22px]', t.muted)}>
          Enter a new password. After you save it, sign in to the WYA app with the same credentials.
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
          <div className="space-y-2">
            <label htmlFor="password" className={t.label}>
              New Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={t.input}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className={cn('text-xs', t.muted)}>Must be at least 6 characters</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className={t.label}>
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={t.input}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className={t.primaryBtn}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Resetting…
              </span>
            ) : (
              'Save new password'
            )}
          </button>
        </form>

        <Link
          to="/login"
          className="w-full text-center text-[13px] font-semibold text-[#ff6b35] hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </WebAuthOverlayShell>
  );
};

export default ResetPassword;
