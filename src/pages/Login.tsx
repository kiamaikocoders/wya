
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please provide both email and password');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Login successful - navigation happens in AuthContext
      // Don't reset form immediately - let navigation happen first
      // The form will be cleared when component unmounts
    } catch (error: any) {
      console.error('Login failed:', error);
      setIsSubmitting(false);
      // Error toast is already shown in AuthContext
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1310] text-white md:h-screen md:overflow-hidden">
      <div className="relative flex min-h-screen w-full flex-col lg:h-screen lg:flex-row">
        <section className="relative hidden lg:flex lg:w-1/2 lg:shadow-[inset_-70px_0_90px_-70px_rgba(26,19,16,0.85)]">
          <img
            src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80"
            alt="Live event crowd and stage lights"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09080a]/35 via-[#1b1311]/45 to-[#1a1310]/75" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-14 xl:p-16">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white">WYA</h1>
              <span className="mt-4 block h-1 w-12 rounded-full bg-[#f26d35]" />
            </div>

            <div className="max-w-md">
              <p className="text-6xl font-bold leading-[1.04] tracking-tight text-white">
                Experience the glow of connection.
              </p>
              <p className="mt-8 text-2xl leading-10 text-white/80">
                Join the world&apos;s most exclusive network for live events and curated social experiences.
              </p>
            </div>
          </div>
        </section>

        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-14 -translate-x-1/2 bg-gradient-to-r from-[#09080a]/20 via-[#1a1310]/20 to-[#1a1310] lg:block" />

        <section className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-[#231814] via-[#1a1310] to-[#140f0d] px-6 py-10 sm:px-10 md:px-12 lg:px-8">
          <div className="absolute left-6 top-8 lg:hidden">
            <h1 className="text-2xl font-black tracking-tight text-[#f26d35]">WYA</h1>
          </div>

          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#251914]/85 p-7 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-10">
            <div className="mb-9">
              <h2 className="text-4xl font-extrabold tracking-tight text-white">Welcome Back</h2>
              <p className="mt-2 text-base text-white/65">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full border border-white/15 bg-white/5 px-4 text-base text-white placeholder:text-white/30 focus:border-[#f26d35] focus:outline-none focus:ring-2 focus:ring-[#f26d35]/25"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#f26d35] transition-colors hover:text-white">
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
                    className="h-12 w-full border border-white/15 bg-white/5 px-4 pr-11 text-base text-white placeholder:text-white/30 focus:border-[#f26d35] focus:outline-none focus:ring-2 focus:ring-[#f26d35]/25"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/65 transition-colors hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f26d35] text-base font-bold text-[#2b140a] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <span aria-hidden>{'->'}</span>}
              </button>
            </form>

            <div className="relative my-8">
              <div className="border-t border-white/10" />
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#251914] px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <span className="text-base">G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <span className="text-base">A</span>
                <span>Apple</span>
              </button>
            </div>

            <p className="mt-9 text-center text-sm text-white/55">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-bold text-[#f26d35] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
