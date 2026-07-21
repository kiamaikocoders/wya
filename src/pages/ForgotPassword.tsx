import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/Logo';
import { WebAuthOverlayShell } from '@/components/auth/WebAuthOverlayShell';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword } = useAuth();
  const t = useWebAuthTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      setIsSubmitting(true);
      await forgotPassword(email);
      setIsSuccess(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: unknown) {
      console.error('Forgot password failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <Logo href="/" size="sm" className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
          <div className="flex size-[46px] items-center justify-center rounded-full bg-[rgba(255,107,53,0.15)]">
            <Mail className="size-5 text-[#ff6b35]" />
          </div>
          <h1 className={cn('text-[26px] font-bold', t.heading)}>Check your email</h1>
          <p className={cn('text-sm leading-[22px]', t.muted)}>
            We&apos;ve sent a password reset link to {email}
          </p>
          <div className={cn('w-full rounded-[10px] px-3.5 py-3 text-left', t.inset)}>
            <p className={cn('text-xs leading-[18px]', t.muted)}>
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setEmail('');
            }}
            className={cn('text-[13px] font-semibold', t.heading)}
          >
            Try again
          </button>
          <Link to="/login" className="text-[13px] font-semibold text-[#ff6b35] hover:underline">
            ← Back to login
          </Link>
        </div>
      </WebAuthOverlayShell>
    );
  }

  return (
    <WebAuthOverlayShell backgroundSrc="/auth/overlay-venue.png">
      <div className="flex flex-col items-start gap-3.5">
        <Logo href="/" size="sm" className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
        <h1 className={cn('text-[26px] font-bold', t.heading)}>Forgot Password</h1>
        <p className={cn('text-sm leading-[22px]', t.muted)}>
          Enter your email and we&apos;ll send a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
          <div className="space-y-2">
            <label htmlFor="email" className={t.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={t.input}
              required
              autoComplete="email"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className={t.primaryBtn}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </span>
            ) : (
              'Send reset link'
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

export default ForgotPassword;
