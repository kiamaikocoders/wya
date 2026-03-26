
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { signup } = useAuth();

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch = confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
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
    <div className="flex items-center justify-center min-h-screen p-4 bg-background animate-fade-in">
      <Card className="w-full max-w-md bg-kenya-brown border-kenya-brown-dark max-h-[95vh] overflow-y-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
          <CardDescription className="text-kenya-brown-light">
            Enter your details to create your WYA account. You must be 18 or older.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-white">
                  First Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-white">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email <span className="text-red-400">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-white">
                Phone (optional)
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dob" className="text-sm font-medium text-white">
                Date of birth <span className="text-red-400">*</span>
              </label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                required
              />
              <p className="text-xs text-kenya-brown-light">Used for age verification (18+).</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kenya-brown-light hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-white">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  className={cn(
                    'bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange pr-10',
                    showPasswordMismatch && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kenya-brown-light hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {showPasswordMismatch && (
                <p className="text-sm text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="rounded-md border border-kenya-brown-dark/80 bg-kenya-brown-dark/40 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(c) => setAcceptTerms(c === true)}
                  className="mt-0.5 border-white/40 data-[state=checked]:bg-kenya-orange"
                />
                <label htmlFor="terms" className="text-sm text-kenya-brown-light leading-snug">
                  I agree to the{' '}
                  <Link to="/terms-of-service" className="text-kenya-orange underline" target="_blank" rel="noreferrer">
                    Attendee Terms and Conditions
                  </Link>
                  .
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(c) => setAcceptPrivacy(c === true)}
                  className="mt-0.5 border-white/40 data-[state=checked]:bg-kenya-orange"
                />
                <label htmlFor="privacy" className="text-sm text-kenya-brown-light leading-snug">
                  I agree to the{' '}
                  <Link to="/privacy-policy" className="text-kenya-orange underline" target="_blank" rel="noreferrer">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={marketingOptIn}
                  onCheckedChange={(c) => setMarketingOptIn(c === true)}
                  className="mt-0.5 border-white/40 data-[state=checked]:bg-kenya-orange"
                />
                <label htmlFor="marketing" className="text-sm text-kenya-brown-light leading-snug">
                  I would like marketing and promotional messages about WYA and partner events (optional).
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="location"
                  checked={locationOptIn}
                  onCheckedChange={(c) => setLocationOptIn(c === true)}
                  className="mt-0.5 border-white/40 data-[state=checked]:bg-kenya-orange"
                />
                <label htmlFor="location" className="text-sm text-kenya-brown-light leading-snug">
                  I consent to location-based recommendations when I enable location on my device (optional).
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="organizer"
                  checked={organizerSharingOptIn}
                  onCheckedChange={(c) => setOrganizerSharingOptIn(c === true)}
                  className="mt-0.5 border-white/40 data-[state=checked]:bg-kenya-orange"
                />
                <label htmlFor="organizer" className="text-sm text-kenya-brown-light leading-snug">
                  I understand my event-related posts may be shared with organisers for promotion (see Privacy Policy). You can change this later in Settings.
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-kenya-orange hover:bg-opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-kenya-brown-light">
            Already have an account?{' '}
            <Link to="/login" className="text-kenya-orange hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
