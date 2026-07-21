import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { WebAuthSplitShell } from '@/components/auth/WebAuthSplitShell';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { cn } from '@/lib/utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const t = useWebAuthTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide both email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <WebAuthSplitShell
      heroSrc="/auth/login-hero.png"
      heroAlt="Friends connecting at a rooftop event"
      headline="Experience the glow of connection."
      subcopy="Join Kenya’s network for live events and curated social nights."
    >
      <div className={cn(t.card, 'flex flex-col gap-4')}>
        <div className="space-y-1.5">
          <h2 className={cn('text-[32px] font-extrabold tracking-tight', t.heading)}>Welcome Back</h2>
          <p className={cn('text-sm', t.muted)}>Please enter your details to sign in.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className={t.label}>
              Email Address
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className={t.label}>
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#ff6b35] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(t.input, 'pr-11')}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={cn('absolute right-3 top-1/2 -translate-y-1/2', t.muted)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={t.primaryBtn}>
            {isSubmitting ? 'Signing in…' : 'Sign In  →'}
          </button>
        </form>

        <div className="flex items-center gap-2.5">
          <div className={cn('h-px flex-1', t.divider)} />
          <span className={cn('text-[10px] font-semibold tracking-[1.2px]', t.muted)}>
            OR CONTINUE WITH
          </span>
          <div className={cn('h-px flex-1', t.divider)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={t.outlineBtn}
            onClick={() => toast.message('Google sign-in coming soon')}
          >
            Google
          </button>
          <button
            type="button"
            className={t.outlineBtn}
            onClick={() => toast.message('Apple sign-in coming soon')}
          >
            Apple
          </button>
        </div>

        <p className={cn('text-center text-[13px]', t.muted)}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-bold text-[#ff6b35] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </WebAuthSplitShell>
  );
};

export default Login;
