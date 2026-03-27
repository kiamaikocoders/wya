
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateSignupConsents, type AttendeeSignupConsents } from '@/lib/signup-consent';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [locationOptIn, setLocationOptIn] = useState(false);
  const [organizerSharingOptIn, setOrganizerSharingOptIn] = useState(true);
  const [mediaConsentChoice, setMediaConsentChoice] = useState<'yes' | 'no' | ''>('');
  const { signup } = useAuth();

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch = confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch;
  const inputClassName =
    'h-12 w-full rounded-md border border-[#e8d2cc] bg-white px-4 text-sm text-[#2b1c17] shadow-sm placeholder:text-[#9f8178] focus:border-[#a83a00] focus:outline-none focus:ring-2 focus:ring-[#a83a00]/20';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!mediaConsentChoice) {
      toast.error(
        'Please indicate whether you consent to promotional use of photos, video, or audio of you (see Media consent).'
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setConfirmPasswordTouched(true);
      return;
    }

    const consents: AttendeeSignupConsents = {
      dateOfBirth: dateOfBirth,
      phone: phone.trim() || undefined,
      marketingOptIn,
      locationOptIn,
      organizerSharingOptIn,
      mediaRecordingPromotionalConsent: mediaConsentChoice === 'yes',
      acceptTerms,
      acceptPrivacy,
    };

    const err = validateSignupConsents(consents);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await signup(email, password, fullName, consents);
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff7f4] text-[#251914] md:h-screen md:overflow-hidden">
      <div className="relative flex min-h-screen w-full flex-col md:h-screen md:flex-row">
        <section className="relative hidden md:flex md:w-1/2 md:shadow-[inset_-70px_0_90px_-70px_rgba(255,247,244,0.75)]">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1700&q=80"
            alt="Festival crowd in warm orange light"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3a1205]/30 via-[#842a06]/65 to-[#3a1205]/90" />
          <div className="relative z-10 mt-auto w-full p-12 text-white lg:p-16">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              Live Experiences
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[0.96] tracking-[-0.03em] lg:text-7xl">
              WYA
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/90 lg:text-[22px] lg:leading-9">
              Step into the glow. Connect with people, discover premium events, and create memories that resonate.
            </p>
            <div className="mt-9 flex items-center gap-3">
              <span className="h-1 w-12 rounded-full bg-[#f26d35]" />
              <span className="h-1 w-4 rounded-full bg-white/45" />
              <span className="h-1 w-4 rounded-full bg-white/45" />
            </div>
          </div>
        </section>

        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-14 -translate-x-1/2 bg-gradient-to-r from-[#2d1207]/20 via-[#8e3f1e]/10 to-[#fff7f4] md:block" />

        <section className="flex flex-1 flex-col bg-gradient-to-b from-[#fff4f0] to-[#fff7f4] md:h-screen md:overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 pb-8 pt-8 sm:px-10 md:pt-10 lg:px-14">
            <div className="mb-10 flex items-center justify-between md:hidden">
              <span className="text-2xl font-extrabold tracking-tight text-[#a83a00]">WYA</span>
              <Link to="/login" className="text-sm font-semibold text-[#a83a00] hover:underline">
                Sign In
              </Link>
            </div>

            <header className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight text-[#251914]">Create Account</h2>
              <p className="mt-1 text-sm text-[#6e5148]">
                Join the community and start discovering exclusive live events.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Phone (Optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="dob" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={cn(inputClassName, !dateOfBirth && 'text-[#9f8178]')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(inputClassName, 'pr-11')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e6258] transition-colors hover:text-[#2b1c17]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6e5148]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      className={cn(
                        inputClassName,
                        'pr-11',
                        showPasswordMismatch && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e6258] transition-colors hover:text-[#2b1c17]"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {showPasswordMismatch && <p className="text-xs text-red-600">Passwords do not match</p>}
                </div>
              </div>

              <div className="space-y-4 border-t border-[#ead5cd] pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e5148]">Permissions & Privacy</h3>

                <label htmlFor="terms" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-sm leading-6 text-[#5d443b]">
                    I agree to the{' '}
                    <Link to="/terms-of-service" className="font-medium text-[#a83a00] underline" target="_blank" rel="noreferrer">
                      Attendee Terms and Conditions
                    </Link>
                    .
                  </span>
                </label>

                <label htmlFor="privacy" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="privacy"
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-sm leading-6 text-[#5d443b]">
                    I agree to the{' '}
                    <Link to="/privacy-policy" className="font-medium text-[#a83a00] underline" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <label htmlFor="marketing" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="marketing"
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-sm leading-6 text-[#5d443b]">
                    I would like marketing and promotional messages sent to my WYA account.
                  </span>
                </label>

                <label htmlFor="location" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="location"
                    type="checkbox"
                    checked={locationOptIn}
                    onChange={(e) => setLocationOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-sm leading-6 text-[#5d443b]">
                    I consent to location-based recommendations when location is enabled on my device.
                  </span>
                </label>

                <label htmlFor="organizer" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="organizer"
                    type="checkbox"
                    checked={organizerSharingOptIn}
                    onChange={(e) => setOrganizerSharingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-sm leading-6 text-[#5d443b]">
                    I understand my event-related posts may be shared with organizers for event promotion.
                  </span>
                </label>
              </div>

              <fieldset className="space-y-3 rounded-xl border border-[#ead5cd] bg-[#fff1ec] p-5">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6e5148]">
                  Media & Content Usage Consent
                </legend>

                <label htmlFor="media-yes" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="media-yes"
                    type="radio"
                    name="media-consent"
                    value="yes"
                    checked={mediaConsentChoice === 'yes'}
                    onChange={() => setMediaConsentChoice('yes')}
                    className="mt-1 h-4 w-4 border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-xs leading-5 text-[#5d443b]">
                    <span className="mb-1 block text-sm font-semibold text-[#2b1c17]">I consent</span>
                    I consent to the collection and use of my image, video, and/or audio recordings as described in the{' '}
                    <Link to="/media-consent" className="font-medium text-[#a83a00] underline" target="_blank" rel="noreferrer">
                      Media consent
                    </Link>{' '}
                    form for promotional and marketing purposes.
                  </span>
                </label>

                <label htmlFor="media-no" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="media-no"
                    type="radio"
                    name="media-consent"
                    value="no"
                    checked={mediaConsentChoice === 'no'}
                    onChange={() => setMediaConsentChoice('no')}
                    className="mt-1 h-4 w-4 border-[#cfaea2] text-[#a83a00] focus:ring-[#a83a00]"
                  />
                  <span className="text-xs leading-5 text-[#5d443b]">
                    <span className="mb-1 block text-sm font-semibold text-[#2b1c17]">I do not consent</span>
                    I do not consent to the collection and use of my image, video, and/or audio recordings for
                    promotional and marketing purposes.
                  </span>
                </label>
              </fieldset>

              <div className="space-y-5 pb-8 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#f26d35] to-[#a83a00] text-sm font-bold tracking-wide text-white shadow-[0_6px_18px_rgba(168,58,0,0.28)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-[#6e5148]">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-[#a83a00] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            <footer className="mt-auto border-t border-[#ead5cd] pt-8 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e7067]">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <span className="sm:mr-auto">© 2024 WYA</span>
                <Link to="/terms-of-service" className="hover:text-[#a83a00]">
                  Terms of Service
                </Link>
                <Link to="/privacy-policy" className="hover:text-[#a83a00]">
                  Privacy Policy
                </Link>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Signup;
