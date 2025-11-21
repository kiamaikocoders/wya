import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase creates one when user clicks reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // No session means invalid/expired link
        toast.error('Invalid or expired reset link. Please request a new password reset.');
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // When user clicks reset link, Supabase creates a session
      // We just need to update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // Sign out and redirect to login after 2 seconds
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password failed:', error);
      toast.error(error.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-kenya-dark animate-fade-in">
        <Card className="w-full max-w-md bg-kenya-brown border-kenya-brown-dark">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Password Reset Successful</CardTitle>
            <CardDescription className="text-kenya-brown-light">
              Your password has been reset successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-kenya-brown-dark/50 rounded-lg">
              <p className="text-sm text-kenya-brown-light text-center">
                You can now sign in with your new password.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-kenya-orange hover:bg-opacity-90"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-kenya-dark animate-fade-in">
        <Card className="w-full max-w-md bg-kenya-brown border-kenya-brown-dark">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
            <CardDescription className="text-kenya-brown-light">
              Redirecting to forgot password page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-kenya-dark animate-fade-in">
      <Card className="w-full max-w-md bg-kenya-brown border-kenya-brown-dark">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-kenya-brown-light">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                required
                minLength={6}
              />
              <p className="text-xs text-kenya-brown-light">Must be at least 6 characters</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-white">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-kenya-brown-dark text-white border-kenya-brown-dark focus:border-kenya-orange"
                required
                minLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-kenya-orange hover:bg-opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </div>
              ) : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-kenya-brown-light">
            Remember your password?{' '}
            <Link to="/login" className="text-kenya-orange hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
