import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle';
import { cn } from '@/lib/utils';

/**
 * Figma 11 — Admin Login (Light + Dark).
 */
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adminLogin, isAdmin, isAuthenticated } = useAuth();
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Preload both Figma login backgrounds so theme toggle swaps instantly
  useEffect(() => {
    ['/admin/login-bg-light.png', '/admin/login-bg-dark.png'].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please provide both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminLogin(email, password);
      navigate('/admin', { replace: true });
    } catch (error: unknown) {
      console.error('Admin login failed:', error);
      const message =
        error instanceof Error ? error.message : 'Admin login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'admin-console relative flex min-h-screen overflow-hidden',
        isDark && 'admin-console--dark',
        isDark ? 'bg-[#0d1117]' : 'bg-white'
      )}
    >
      <div className="absolute inset-0">
        {/* Figma: light = daytime terrace; dark = night street — swap with theme */}
        <img
          src="/admin/login-bg-light.png"
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            isDark ? 'opacity-0' : 'opacity-100'
          )}
        />
        <img
          src="/admin/login-bg-dark.png"
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            isDark ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div
          className={cn(
            'absolute inset-0 transition-colors duration-500',
            isDark
              ? 'bg-gradient-to-r from-[rgba(13,18,23,0.9)] via-[rgba(13,18,23,0.58)] to-[rgba(13,18,23,0.32)]'
              : 'bg-gradient-to-r from-[rgba(15,20,31,0.78)] via-[rgba(15,20,31,0.42)] to-[rgba(255,255,255,0.12)]'
          )}
        />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <AdminThemeToggle />
      </div>

      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-10 lg:px-[72px]">
        <div className="mb-10 max-w-xl lg:mb-0">
          <p className="text-[13px] font-semibold tracking-wide text-[#ff6b35]">( ADMIN )</p>
          <h1 className="mt-3 font-sans text-4xl font-bold leading-tight text-white sm:text-[44px]">
            Where the night
            <br />
            gets managed
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#e6edf3]/[0.88]">
            Sign in to run events, marketplace transfers, moderation, and platform ops for WYA.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center px-4 pb-10 lg:absolute lg:inset-y-0 lg:right-0 lg:w-auto lg:items-center lg:justify-end lg:px-[100px] lg:pb-0">
        <form
          onSubmit={handleSubmit}
          className={cn(
            'flex w-full max-w-[440px] flex-col gap-[18px] rounded-[28px] p-9 shadow-[0px_18px_40px_0px_rgba(0,0,0,0.35)]',
            isDark ? 'border border-[#21262d] bg-[#161b22]' : 'bg-white'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]">
              <span className="text-lg font-bold text-white">W</span>
            </div>
            <div>
              <p className={cn('text-base font-bold', isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]')}>
                WYA Admin
              </p>
              <p className={cn('text-xs', isDark ? 'text-[#8b949e]' : 'text-[#656d76]')}>
                Superadmin console
              </p>
            </div>
          </div>

          <div>
            <h2
              className={cn(
                'text-[26px] font-bold',
                isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'
              )}
            >
              Sign in to continue
            </h2>
            <p className={cn('mt-1 text-[13px]', isDark ? 'text-[#8b949e]' : 'text-[#656d76]')}>
              Authorized personnel only. All actions are audited.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="admin-email"
              className={cn('text-xs font-medium', isDark ? 'text-[#8b949e]' : 'text-[#656d76]')}
            >
              Email
            </label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@wya.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'h-12 rounded-[14px] text-[14px] focus-visible:ring-[#ff6b35]',
                isDark
                  ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
                  : 'border-[#d1d6de] bg-[#f6f8fa] text-[#1f2328] placeholder:text-[#656d76]'
              )}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="admin-password"
              className={cn('text-xs font-medium', isDark ? 'text-[#8b949e]' : 'text-[#656d76]')}
            >
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'h-12 rounded-[14px] text-[14px] focus-visible:ring-[#ff6b35]',
                isDark
                  ? 'border-[#21262d] bg-[#0d1117] text-[#e6edf3] placeholder:text-[#8b949e]'
                  : 'border-[#d1d6de] bg-[#f6f8fa] text-[#1f2328] placeholder:text-[#656d76]'
              )}
              required
            />
          </div>

          <Button
            type="submit"
            className="h-[52px] w-full rounded-full bg-[#ff6b35] text-[15px] font-semibold text-white hover:bg-[#ff6b35]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </Button>

          <p className={cn('text-center text-xs', isDark ? 'text-[#8b949e]' : 'text-[#656d76]')}>
            Protected by role gate · Super Admin
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
