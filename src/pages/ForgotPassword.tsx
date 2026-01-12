import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await forgotPassword(email);
      setIsSuccess(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
        <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-accent/20 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-gradient-orange-accent" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
            <CardDescription className="text-text-white/70">
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark/50 rounded-lg">
              <p className="text-sm text-text-white/70">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            
            <div className="text-sm text-text-white/70 text-center">
              <p>Didn't receive the email? Check your spam folder or</p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-gradient-orange-accent hover:underline mt-2"
              >
                try again
              </button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Link to="/login" className="text-sm text-gradient-orange-accent hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-promo animate-fade-in">
      <Card className="w-full max-w-md bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30 border-gradient-purple-medium/30">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
          <CardDescription className="text-text-white/70">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30-dark text-white border-gradient-purple-medium/30 focus:border-kenya-orange"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-accent hover:bg-opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-text-white/70">
            Remember your password?{' '}
            <Link to="/login" className="text-gradient-orange-accent hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;

