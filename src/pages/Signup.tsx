import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { WebAuthSplitShell } from '@/components/auth/WebAuthSplitShell';
import { SignupConsentModal } from '@/components/auth/SignupConsentModal';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { validateSignupConsents, type AttendeeSignupConsents } from '@/lib/signup-consent';
import { getPublicPlatformFlags } from '@/lib/platform-flags';
import LocationPicker from '@/components/maps/LocationPicker';
import { cn } from '@/lib/utils';

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
  const [consentOpen, setConsentOpen] = useState(false);
  const [mediaChoice, setMediaChoice] = useState<'yes' | 'no' | ''>('');
  const [consents, setConsents] = useState<AttendeeSignupConsents>({
    dateOfBirth: '',
    phone: undefined,
    marketingOptIn: false,
    locationOptIn: false,
    organizerSharingOptIn: true,
    mediaRecordingPromotionalConsent: false,
    acceptTerms: false,
    acceptPrivacy: false,
    location: undefined,
    latitude: null,
    longitude: null,
  });
  const [pickedLocation, setPickedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const { signup } = useAuth();
  const t = useWebAuthTheme();

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch =
    confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch;

  const openConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!dateOfBirth) {
      toast.error('Please enter your date of birth');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setConfirmPasswordTouched(true);
      return;
    }
    if (
      !pickedLocation ||
      !Number.isFinite(pickedLocation.latitude) ||
      !Number.isFinite(pickedLocation.longitude)
    ) {
      toast.error('Please select your location from the suggestions or use My Location');
      return;
    }
    try {
      const flags = await getPublicPlatformFlags();
      if (!flags.registration_open) {
        toast.error('New registrations are temporarily closed. Please try again later.');
        return;
      }
    } catch {
      // fail open
    }
    setConsents((c) => ({
      ...c,
      dateOfBirth,
      phone: phone.trim() || undefined,
      location: pickedLocation.address,
      latitude: pickedLocation.latitude,
      longitude: pickedLocation.longitude,
      locationOptIn: true,
    }));
    setConsentOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!mediaChoice) {
      toast.error('Please indicate your media consent preference.');
      return;
    }
    const payload: AttendeeSignupConsents = {
      ...consents,
      dateOfBirth,
      phone: phone.trim() || undefined,
      mediaRecordingPromotionalConsent: mediaChoice === 'yes',
      location: pickedLocation?.address || consents.location,
      latitude: pickedLocation?.latitude ?? consents.latitude,
      longitude: pickedLocation?.longitude ?? consents.longitude,
      locationOptIn: consents.locationOptIn || !!pickedLocation,
    };
    const err = validateSignupConsents(payload);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await signup(email, password, fullName, payload);
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <WebAuthSplitShell
        heroSrc="/auth/signup-hero.png"
        heroAlt="Live concert crowd"
        headline="Step into the glow."
        subcopy="Connect with people, discover premium events, and create memories that resonate."
        scrollPanel
      >
        <div className={cn(t.card, 'flex flex-col gap-3.5 p-8')}>
          <div className="space-y-1.5">
            <h2 className={cn('text-[28px] font-bold tracking-tight', t.heading)}>Create Account</h2>
            <p className={cn('text-[13px]', t.muted)}>
              Join the community and start discovering exclusive live events.
            </p>
          </div>

          <form onSubmit={openConsent} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className={t.label}>
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={t.input}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className={t.label}>
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={t.input}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className={t.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={t.input}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className={t.label}>
                  Phone (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={t.input}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dob" className={t.label}>
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={cn(t.input, !dateOfBirth && t.muted)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className={t.label}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(t.input, 'pr-11')}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2', t.muted)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className={t.label}>
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
                      t.input,
                      'pr-11',
                      showPasswordMismatch && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    )}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2', t.muted)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {showPasswordMismatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className={t.label}>
                Your location <span className="text-[#ff6b35]">*</span>
              </label>
              <p className={cn('text-xs', t.muted)}>
                Required so we can show events near you. Start typing to see places, or use My
                Location.
              </p>
              <LocationPicker
                mode="user"
                compact
                showMap={false}
                title=""
                description=""
                onLocationSelect={(loc) => {
                  setPickedLocation({
                    address: loc.address,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  });
                }}
                onLocationClear={() => setPickedLocation(null)}
              />
              {pickedLocation ? (
                <p className={cn('text-xs font-medium text-[#ff6b35]')}>
                  Selected: {pickedLocation.address}
                </p>
              ) : (
                <p className={cn('text-xs', t.muted)}>Pick a place from the list to continue.</p>
              )}
            </div>

            <p className={cn('text-xs font-medium', t.muted)}>
              Next: review permissions & media consent
            </p>

            <button type="submit" className={t.primaryBtn}>
              Create Account
            </button>

            <p className={cn('text-center text-[13px]', t.muted)}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#ff6b35] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </WebAuthSplitShell>

      <SignupConsentModal
        open={consentOpen}
        consents={consents}
        mediaChoice={mediaChoice}
        onChange={(patch) => setConsents((c) => ({ ...c, ...patch }))}
        onMediaChoice={setMediaChoice}
        onClose={() => setConsentOpen(false)}
        onBack={() => setConsentOpen(false)}
        onConfirm={handleCreateAccount}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default Signup;
