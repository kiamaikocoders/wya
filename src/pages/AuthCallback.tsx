import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPostLoginPath } from '@/lib/post-auth-navigation';
import { buildNativeAuthDeepLinks, isMobileAuthUserAgent } from '@/lib/native-auth-handoff';

type CallbackType = 'signup' | 'recovery' | 'magiclink' | 'email_change' | 'invite' | 'unknown';

async function applyPendingAvatar(userId: string, email?: string | null) {
  try {
    const { flushPendingSignupAvatar } = await import('@/lib/pending-signup-avatar');
    await flushPendingSignupAvatar(userId, email ?? undefined);
  } catch (err) {
    console.warn('Failed to flush pending signup avatar:', err);
  }
}

function shouldHandoffToNativeApp(
  pathname: string,
  searchParams: URLSearchParams,
  type: string,
): boolean {
  if (pathname.includes('/auth/confirm')) return true;
  if (searchParams.get('app') === 'wya' || searchParams.get('native') === '1') return true;
  if (type === 'recovery' && isMobileAuthUserAgent()) return true;
  return false;
}

const capturedAuthLocation =
  typeof window !== 'undefined'
    ? { search: window.location.search, hash: window.location.hash }
    : { search: '', hash: '' };

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'open_app'>('loading');
  const [message, setMessage] = useState('');
  const [callbackType, setCallbackType] = useState<CallbackType>('unknown');

  const nativeLinks = useMemo(
    () =>
      buildNativeAuthDeepLinks(
        location.search || capturedAuthLocation.search,
        location.hash || capturedAuthLocation.hash,
      ),
    [location.search, location.hash],
  );

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
          if (token && !shouldHandoffToNativeApp(location.pathname, searchParams, type)) {
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

        // Native bridge: open the app with the same query (PKCE code) — do not exchange here.
        // Exchanging in the browser would burn the one-time code; the native client holds the PKCE verifier.
        if (
          shouldHandoffToNativeApp(location.pathname, searchParams, type) &&
          (code || location.hash.includes('access_token') || token || tokenHash)
        ) {
          setStatus('open_app');
          setMessage(
            type === 'recovery'
              ? 'Opening the WYA app so you can set a new password…'
              : 'Opening the WYA app to finish setup…',
          );
          // Try Intent URL first (Android), then custom scheme — preserves ?code=
          window.location.href = nativeLinks[0];
          if (nativeLinks[1]) {
            window.setTimeout(() => {
              window.location.href = nativeLinks[1];
            }, 900);
          }
          return;
        }

        // PKCE / modern confirm links: ?code=...
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.user) {
            await applyPendingAvatar(data.user.id, data.user.email);
            if (type === 'recovery') {
              setCallbackType('recovery');
              setStatus('success');
              setMessage('Identity verified. Set a new password…');
              toast.success('You can now set a new password.');
              setTimeout(() => navigate('/reset-password'), 800);
              return;
            }
            setCallbackType((prev) => (prev === 'unknown' ? 'signup' : prev));
            setStatus('success');
            setMessage('Email verified successfully! You can now continue.');
            toast.success('Email verified successfully!');
            setTimeout(() => navigate(getPostLoginPath()), 1500);
            return;
          }
        }

        // Hash / detectSessionInUrl may already have established a session
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user && !token && !tokenHash) {
          await applyPendingAvatar(existing.session.user.id, existing.session.user.email);
          if (type === 'recovery') {
            setCallbackType('recovery');
            setStatus('success');
            setMessage('Identity verified. Set a new password…');
            setTimeout(() => navigate('/reset-password'), 800);
            return;
          }
          setCallbackType((prev) => (prev === 'unknown' ? 'signup' : prev));
          setStatus('success');
          setMessage('You are signed in.');
          toast.success('Signed in successfully!');
          setTimeout(() => navigate(getPostLoginPath()), 1200);
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
            setTimeout(() => navigate(getPostLoginPath()), 1000);
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
  }, [searchParams, navigate, location.pathname, location.hash, nativeLinks]);

  const getTitle = () => {
    switch (callbackType) {
      case 'signup':
        return 'Verifying Email';
      case 'magiclink':
        return 'Signing In';
      case 'email_change':
        return 'Verifying Email Change';
      case 'recovery':
        return 'Resetting Password';
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
      case 'recovery':
        return 'Ready to Reset';
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

  if (status === 'open_app') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
        <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-accent/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-gradient-orange-accent animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Open WYA</CardTitle>
            <CardDescription className="text-text-white/70">{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            {nativeLinks.map((href, i) => (
              <Button
                key={`${i}-${href.slice(0, 48)}`}
                onClick={() => {
                  window.location.href = href;
                }}
                className="w-full bg-gradient-accent hover:bg-opacity-90"
                variant={i === 0 ? 'default' : 'outline'}
              >
                {i === 0 ? 'Open in WYA app' : 'Try alternate open'}
              </Button>
            ))}
            <Button
              onClick={() => {
                const isRecovery =
                  callbackType === 'recovery' || searchParams.get('type') === 'recovery';
                if (isRecovery) {
                  navigate(
                    `/reset-password${location.search || capturedAuthLocation.search}${location.hash || capturedAuthLocation.hash}`,
                  );
                  return;
                }
                navigate('/login');
              }}
              variant="outline"
              className="w-full border-gradient-purple-medium/30 text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
            >
              Continue in browser
            </Button>
            <p className="text-xs text-text-white/60 text-center pt-2">
              Keep this tab open until the app opens. If you land on Welcome, tap Open in WYA app
              again — do not reuse an old confirmation email.
            </p>
          </CardContent>
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
