
import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  const didToastRef = useRef(false);

  useEffect(() => {
    didToastRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    // Show toast message if user is redirected to login
    if (!loading && !isAuthenticated && !didToastRef.current) {
      toast.error('Please log in to access this page');
      didToastRef.current = true;
    }
    
    // Show toast message if admin access is required
    if (!loading && isAuthenticated && adminOnly && !isAdmin && !didToastRef.current) {
      toast.error('You need admin privileges to access this page');
      didToastRef.current = true;
    }
  }, [loading, isAuthenticated, adminOnly, isAdmin, location.pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-promo">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Redirect to home if authenticated but not admin and route requires admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated (and has admin privileges if required)
  return <>{children}</>;
};

export default ProtectedRoute;
