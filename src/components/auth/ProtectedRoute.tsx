
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { authService } from '@/lib/auth-service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, refreshAuth } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      if (!isAuthenticated && authService.isAuthenticated()) {
        try {
          // Attempt to refresh auth state if token exists but context says not authenticated
          await refreshAuth();
        } catch (error) {
          console.error("Failed to refresh authentication:", error);
        }
      }
      setIsChecking(false);
    };

    checkAuthState();
  }, [isAuthenticated, refreshAuth]);

  useEffect(() => {
    // Show toast message if user is redirected to login
    if (!loading && !isChecking && !isAuthenticated) {
      toast.error('Please log in to access this page');
    }
  }, [loading, isChecking, isAuthenticated]);

  // Show loading state
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kenya-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
