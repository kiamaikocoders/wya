import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EmailConfirmationPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [isResending, setIsResending] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsResending(true);
      
      // Resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Confirmation email sent! Check your inbox.');
      
      // Reset email sent state after 5 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast.error(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    if (!email) {
      toast.error('Please enter your current email address');
      return;
    }

    try {
      setIsChangingEmail(true);
      
      // Sign up with new email
      const { error } = await supabase.auth.signUp({
        email: newEmail,
        password: 'temp-password-' + Date.now(), // Temporary, user will need to reset
        options: {
          data: {
            previous_email: email,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      toast.success('New confirmation email sent to ' + newEmail);
      setEmail(newEmail);
      setNewEmail('');
      setIsChangingEmail(false);
      setEmailSent(true);
      
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
    } catch (error: any) {
      console.error('Change email error:', error);
      toast.error(error.message || 'Failed to change email. Please try again.');
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
      <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-accent/20 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-gradient-orange-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Check Your Email</CardTitle>
          <CardDescription className="text-text-white/70">
            We've sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {email && (
            <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/50 rounded-lg border border-gradient-purple-medium/30">
              <p className="text-sm text-text-white/70 mb-1">Email sent to:</p>
              <p className="text-white font-medium">{email}</p>
            </div>
          )}

          {emailSent && (
            <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-400 font-medium">Email sent successfully!</p>
                <p className="text-xs text-green-400/80 mt-1">Check your inbox for the confirmation link.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/30 rounded-lg border-l-4 border-kenya-orange">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                What to do next:
              </h3>
              <ul className="text-sm text-text-white/70 space-y-2 ml-6 list-disc">
                <li>Check your inbox for an email from WYA</li>
                <li>Click the confirmation link in the email</li>
                <li>Check your spam/junk folder if you don't see it</li>
                <li>The link will expire in 24 hours</li>
              </ul>
            </div>

            {/* Resend Email Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Didn't receive the email?</label>
              </div>
              
              {!email && (
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark text-white border-gradient-purple-medium/30 focus:border-kenya-orange"
                />
              )}
              
              <Button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                variant="outline"
                className="w-full border-gradient-purple-medium/30 text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Confirmation Email
                  </div>
                )}
              </Button>
            </div>

            {/* Change Email Section */}
            <div className="pt-4 border-t border-gradient-purple-medium/30">
              <p className="text-sm text-text-white/70 mb-3">Used the wrong email address?</p>
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark text-white border-gradient-purple-medium/30 focus:border-kenya-orange"
                />
                
                <Button
                  onClick={handleChangeEmail}
                  disabled={isChangingEmail || !newEmail}
                  variant="outline"
                  className="w-full border-gradient-purple-medium/30 text-white hover:bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark"
                >
                  {isChangingEmail ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Confirmation to New Email'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-text-white/70">
            Already confirmed your email?{' '}
            <Link to="/login" className="text-gradient-orange-accent hover:underline">
              Sign in
            </Link>
          </div>
          
          <Button
            onClick={() => navigate('/signup')}
            variant="ghost"
            className="w-full text-text-white/70 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailConfirmationPending;

