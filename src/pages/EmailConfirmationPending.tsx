import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/ui/Logo';
import { WebAuthOverlayShell } from '@/components/auth/WebAuthOverlayShell';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

const EmailConfirmationPending = () => {
  const location = useLocation();
  const t = useWebAuthTheme();
  const [email] = useState((location.state as { email?: string } | null)?.email || '');
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Missing email address. Please sign up again.');
      return;
    }
    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success('Confirmation email sent! Check your inbox.');
    } catch (error: unknown) {
      console.error('Resend email error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to resend email. Please try again.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <WebAuthOverlayShell backgroundSrc="/auth/overlay-lanterns.png">
      <div className="flex flex-col items-center gap-3.5 text-center">
        <Logo href="/" size="sm" className="[&_img]:!h-[34px] [&_img]:!min-w-0 [&>div]:!min-w-0" />
        <div className="flex size-[46px] items-center justify-center rounded-full bg-[rgba(255,107,53,0.15)]">
          <Mail className="size-5 text-[#ff6b35]" />
        </div>
        <h1 className={cn('text-[26px] font-bold', t.heading)}>Check Your Email</h1>
        <p className={cn('text-sm leading-[22px]', t.muted)}>
          We&apos;ve sent a confirmation link to your email address
        </p>

        {email && (
          <div className={cn('w-full rounded-[10px] px-3.5 py-3 text-left', t.inset)}>
            <p className={cn('text-xs leading-[18px]', t.muted)}>Email sent to: {email}</p>
          </div>
        )}

        <div className={cn('w-full space-y-1.5 rounded-[10px] px-3.5 py-3 text-left', t.inset)}>
          <p className={cn('text-[13px] font-semibold', t.heading)}>What to do next:</p>
          <ul className={cn('space-y-0.5 text-xs leading-[18px]', t.muted)}>
            <li>• Check your inbox for an email from WYA</li>
            <li>• Click the confirmation link</li>
            <li>• Check spam if you don’t see it</li>
            <li>• Link expires in 24 hours</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={handleResendEmail}
          disabled={isResending || !email}
          className={cn(t.outlineBtn, 'disabled:opacity-60')}
        >
          {isResending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </span>
          ) : (
            'Resend Confirmation Email'
          )}
        </button>

        <Link to="/login" className="text-[13px] font-semibold text-[#ff6b35] hover:underline">
          ← Back to login
        </Link>
      </div>
    </WebAuthOverlayShell>
  );
};

export default EmailConfirmationPending;
