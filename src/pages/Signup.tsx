import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { WebAuthSplitShell } from '@/components/auth/WebAuthSplitShell';
import { SignupConsentModal } from '@/components/auth/SignupConsentModal';
import { useWebAuthTheme } from '@/components/auth/webAuthTheme';
import { validateSignupConsents, type AttendeeSignupConsents } from '@/lib/signup-consent';
import { getPublicPlatformFlags } from '@/lib/platform-flags';
import LocationPicker from '@/components/maps/LocationPicker';
import { cn } from '@/lib/utils';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const pillCta =
  'flex h-12 w-full items-center justify-center rounded-full bg-[#ff6b35] text-[15px] font-semibold text-white transition-colors hover:bg-[#ff6b35]/90 disabled:cursor-not-allowed disabled:bg-[rgba(255,107,53,0.35)] disabled:opacity-100';

type SignupStep = 1 | 2;

function SignupStepper({ step, isDark }: { step: SignupStep; isDark: boolean }) {
  const accountDone = step === 2;
  const accountActive = step === 1;
  const profileActive = step === 2;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full text-xs font-bold',
            accountDone || accountActive
              ? 'bg-[#ff6b35] text-white'
              : cn(
                  'border',
                  isDark ? 'border-[#21262d] bg-[#161b22] text-[#8b949e]' : 'border-[#d0d7de] bg-white text-[#5c6570]'
                )
          )}
        >
          {accountDone ? <Check className="size-3.5 stroke-[3]" /> : '1'}
        </div>
        <span
          className={cn(
            'text-[13px]',
            accountActive ? 'font-semibold' : 'font-medium',
            accountActive
              ? isDark
                ? 'text-[#e6edf3]'
                : 'text-[#0d1117]'
              : isDark
                ? 'text-[#8b949e]'
                : 'text-[#5c6570]'
          )}
        >
          Account
        </span>
      </div>
      <div className="h-0.5 w-10 rounded-sm bg-[#ff6b35]" />
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex size-7 items-center justify-center rounded-full text-xs font-bold',
            profileActive
              ? 'bg-[#ff6b35] text-white'
              : cn(
                  'border',
                  isDark ? 'border-[#21262d] bg-[#161b22] text-[#8b949e]' : 'border-[#d0d7de] bg-white text-[#5c6570]'
                )
          )}
        >
          2
        </div>
        <span
          className={cn(
            'text-[13px]',
            profileActive ? 'font-semibold' : 'font-medium',
            profileActive
              ? isDark
                ? 'text-[#e6edf3]'
                : 'text-[#0d1117]'
              : isDark
                ? 'text-[#8b949e]'
                : 'text-[#5c6570]'
          )}
        >
          Profile photo
        </span>
      </div>
    </div>
  );
}

const Signup = () => {
  const [step, setStep] = useState<SignupStep>(1);
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
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const firstNamePreview = firstName.trim() || 'there';
  const hasPhoto = Boolean(avatarFile && avatarPreview);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const goToProfileStep = async (e: React.FormEvent) => {
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
    setStep(2);
  };

  const openConsent = () => {
    if (!avatarFile) {
      toast.error('A profile photo is required to create your account');
      return;
    }
    setConsentOpen(true);
  };

  const handleAvatarPick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a PNG or JPG image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreateAccount = async () => {
    if (!avatarFile) {
      toast.error('A profile photo is required to create your account');
      return;
    }
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
      await signup(email, password, fullName, payload, {
        avatarFile,
        displayName: displayName.trim() || undefined,
      });
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hero =
    step === 1
      ? {
          src: '/auth/signup-hero.png',
          headline: 'Step into the glow.',
          subcopy:
            'Connect with people, discover premium events, and create memories that resonate.',
        }
      : {
          src: '/auth/signup-hero.png',
          headline: 'Show up as you.',
          subcopy:
            'A profile photo helps people recognize you at events and in chat. Required to finish signup.',
        };

  return (
    <>
      <WebAuthSplitShell
        heroSrc={hero.src}
        heroAlt="Live concert crowd"
        headline={hero.headline}
        subcopy={hero.subcopy}
        scrollPanel
      >
        {step === 1 ? (
          <div className={cn(t.card, 'flex flex-col gap-3.5 p-8')}>
            <div className="space-y-2">
              <h2 className={cn('text-[28px] font-bold tracking-tight', t.heading)}>
                Create Account
              </h2>
              <p className={cn('text-sm', t.muted)}>
                Step 1 of 2 — your details. Profile photo comes next.
              </p>
            </div>

            <SignupStepper step={1} isDark={t.isDark} />

            <form onSubmit={goToProfileStep} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className={t.label}>
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={cn(t.input, 'h-11 rounded-xl')}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className={t.label}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={cn(t.input, 'h-11 rounded-xl')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className={t.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(t.input, 'h-11 rounded-xl')}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className={t.label}>
                  Phone (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(t.input, 'h-11 rounded-xl')}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dob" className={t.label}>
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={cn(t.input, 'h-11 rounded-xl', !dateOfBirth && t.muted)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
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
                      className={cn(t.input, 'h-11 rounded-xl pr-11')}
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
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className={t.label}>
                    Confirm
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
                        'h-11 rounded-xl pr-11',
                        showPasswordMismatch &&
                          'border-red-500 focus:border-red-500 focus:ring-red-500/20'
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
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
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
                  <p className="text-xs font-medium text-[#ff6b35]">
                    Selected: {pickedLocation.address}
                  </p>
                ) : (
                  <p className={cn('text-xs', t.muted)}>Pick a place from the list to continue.</p>
                )}
              </div>

              <p className={cn('text-xs', t.muted)}>
                Next: upload a profile photo to finish creating your account
              </p>

              <button type="submit" className={pillCta}>
                Continue to profile
              </button>

              <p className={cn('text-[13px]', t.muted)}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#ff6b35] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        ) : (
          <div className={cn(t.card, 'flex flex-col items-center gap-[18px] p-9')}>
            <div className="w-full space-y-2 text-center">
              <h2 className={cn('text-[28px] font-bold tracking-tight', t.heading)}>
                Add your profile photo
              </h2>
              <p className={cn('mx-auto max-w-[520px] text-sm', t.muted)}>
                Required before we create your account. You can change it later in Settings.
              </p>
            </div>

            <SignupStepper step={2} isDark={t.isDark} />

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[rgba(255,107,53,0.15)] px-2.5 py-1 text-[11px] font-semibold text-[#ff6b35]">
                Required
              </span>
              <span className={cn('text-xs', t.muted)}>
                Account stays incomplete without a photo
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                handleAvatarPick(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />

            <div
              className={cn(
                'flex w-full max-w-[520px] flex-col items-center gap-3.5 rounded-[18px] px-6 py-7',
                t.inset,
                hasPhoto
                  ? 'border-[1.5px] border-solid border-[rgba(255,107,53,0.5)]'
                  : 'border-[1.5px] border-dashed border-[rgba(255,107,53,0.85)]'
              )}
            >
              {hasPhoto ? (
                <>
                  <div className="flex size-[132px] items-center justify-center rounded-full bg-[#ff6b35] p-1.5">
                    <img
                      src={avatarPreview!}
                      alt="Profile preview"
                      className="size-[120px] rounded-full object-cover"
                      width={120}
                      height={120}
                    />
                  </div>
                  <p className={cn('text-[15px] font-semibold', t.heading)}>
                    Looking good, {firstNamePreview}
                  </p>
                  <p className={cn('text-xs', t.muted)}>
                    {avatarFile?.name || 'photo.jpg'} · Tap to replace
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'rounded-full border px-[18px] py-2.5 text-[13px] font-semibold',
                      t.isDark
                        ? 'border-[#21262d] bg-[#161b22] text-[#e6edf3]'
                        : 'border-[#d0d7de] bg-white text-[#0d1117]'
                    )}
                  >
                    Change photo
                  </button>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      'flex size-[120px] items-center justify-center rounded-full border-2 border-dashed',
                      t.isDark ? 'border-[#21262d] bg-[#0d1117]' : 'border-[#d0d7de] bg-white'
                    )}
                  >
                    <Camera className={cn('size-7', t.muted)} strokeWidth={1.75} />
                  </div>
                  <p className={cn('text-base font-semibold', t.heading)}>Upload profile photo</p>
                  <p className={cn('text-xs', t.muted)}>PNG or JPG · max 5MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-[#ff6b35] px-[18px] py-2.5 text-[13px] font-semibold text-white hover:bg-[#ff6b35]/90"
                  >
                    Choose photo
                  </button>
                </>
              )}
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="displayName" className={t.label}>
                Display Name (Optional)
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="How should people see you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={cn(t.input, 'h-11 rounded-xl')}
                autoComplete="nickname"
              />
            </div>

            <div className="flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={openConsent}
                disabled={!hasPhoto}
                className={pillCta}
              >
                Create account
              </button>
              <p className={cn('text-xs', t.muted)}>
                {hasPhoto
                  ? 'Next: review permissions & media consent'
                  : 'Upload a photo to enable Create account'}
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-left text-[13px] font-medium text-[#ff6b35] hover:underline"
              >
                ← Back to account details
              </button>
            </div>
          </div>
        )}
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
