import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type CallbackType = 'signup' | 'recovery' | 'magiclink' | 'email_change' | 'invite' | 'unknown';

async function applyPendingAvatar(userId: string, email?: string | null) {
  try {
    const { flushPendingSignupAvatar } = await import('@/lib/pending-signup-avatar');
    await flushPendingSignupAvatar(userId, email ?? undefined);
  } catch (err) {
    console.warn('Failed to flush pending signup avatar:', err);
  }
}

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [callbackType, setCallbackType] = useState<CallbackType>('unknown');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const type = (searchParams.get('type') || '') as string;
        const tokenHash = searchParams.get('token_hash');
        const code = searchParams.get('code');

        if (type === 'signup' || type === 'email') {
          setCallbackType('signup');
        } else if (type === 'recovery') {
          setCallbackType('recovery');
          if (token) {
            navigate(`/reset-password?token=${token}&type=recovery`);
            return;
          }
        } else if (type === 'magiclink') {
          setCallbackType('magiclink');
        } else if (type === 'email_change') {
          setCallbackType('email_change');
        } else if (type === 'invite') {
          setCallbackType('invite');
        }

        // PKCE / modern confirm links: ?code=...
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.user) {
            await applyPendingAvatar(data.user.id, data.user.email);
            setCallbackType((prev) => (prev === 'unknown' ? 'signup' : prev));
            setStatus('success');
            setMessage('Email verified successfully! You can now continue.');
            toast.success('Email verified successfully!');
            setTimeout(() => navigate('/home'), 1500);
            return;
          }
        }

        // Hash / detectSessionInUrl may already have established a session
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user && !token && !tokenHash) {
          await applyPendingAvatar(existing.session.user.id, existing.session.user.email);
          setCallbackType((prev) => (prev === 'unknown' ? 'signup' : prev));
          setStatus('success');
          setMessage('You are signed in.');
          toast.success('Signed in successfully!');
          setTimeout(() => navigate('/home'), 1200);
          return;
        }

        // Legacy OTP links: ?token= / ?token_hash=
        if (token && (type === 'signup' || type === 'email' || !type)) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'email',
          });

          if (error) throw error;

          if (data.user) {
            await applyPendingAvatar(data.user.id, data.user.email);

            const pendingWelcome = localStorage.getItem('pending_welcome');
            if (pendingWelcome) {
              try {
                const { userId, userName } = JSON.parse(pendingWelcome);
                const { onboardingNotifications } = await import('@/lib/onboarding-notifications');
                await onboardingNotifications.sendWelcomeNotification(userId, userName);
                setTimeout(() => {
                  onboardingNotifications.initializeOnboarding(userId, userName);
                }, 1000);
                localStorage.removeItem('pending_welcome');
              } catch (err) {
                console.warn('Failed to send welcome notification:', err);
              }
            }

            setStatus('success');
            setMessage('Email verified successfully! You can now sign in.');
            toast.success('Email verified successfully!');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
        }

        if (token && type === 'magiclink') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'magiclink',
          });
          if (error) throw error;
          if (data.user) {
            setStatus('success');
            setMessage('Signed in successfully!');
            toast.success('Signed in successfully!');
            setTimeout(() => navigate('/home'), 1000);
            return;
          }
        }

        if (token && type === 'email_change') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'email_change',
          });
          if (error) throw error;
          if (data.user) {
            setStatus('success');
            setMessage('Email changed successfully!');
            toast.success('Email changed successfully!');
            setTimeout(() => navigate('/settings'), 2000);
            return;
          }
        }

        if (type === 'invite') {
          navigate(`/signup?token=${token || ''}&type=invite`);
          return;
        }

        setStatus('error');
        setMessage('Invalid or missing verification token.');
      } catch (error: unknown) {
        console.error('Auth callback error:', error);
        const msg =
          error instanceof Error ? error.message : 'Failed to verify. The link may have expired.';
        setStatus('error');
        setMessage(msg);
        toast.error(msg);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const getTitle = () => {
    switch (callbackType) {
      case 'signup':
        return 'Verifying Email';
      case 'magiclink':
        return 'Signing In';
      case 'email_change':
        return 'Verifying Email Change';
      case 'invite':
        return 'Accepting Invitation';
      default:
        return 'Processing';
    }
  };

  const getSuccessTitle = () => {
    switch (callbackType) {
      case 'signup':
        return 'Email Verified';
      case 'magiclink':
        return 'Signed In';
      case 'email_change':
        return 'Email Changed';
      case 'invite':
        return 'Invitation Accepted';
      default:
        return 'Success';
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
        <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-accent/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-gradient-orange-accent animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">{getTitle()}</CardTitle>
            <CardDescription className="text-text-white/70">
              Please wait while we verify your request...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
        <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">{getSuccessTitle()}</CardTitle>
            <CardDescription className="text-text-white/70">{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/50 rounded-lg">
              <p className="text-sm text-text-white/70 text-center">Redirecting you now...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
      <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Verification Failed</CardTitle>
          <CardDescription className="text-text-white/70">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/50 rounded-lg">
            <p className="text-sm text-text-white/70 text-center">
              The verification link may have expired or is invalid. Please request a new one.
            </p>
          </div>
        </CardContent>
        <CardContent className="flex flex-col space-y-2">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-accent hover:bg-opacity-90"
          >
            Go to Login
          </Button>
          <Button
            onClick={() => navigate('/forgot-password')}
            variant="outline"
            className="w-full border-gradient-purple-medium/30 text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
          >
            Request New Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
