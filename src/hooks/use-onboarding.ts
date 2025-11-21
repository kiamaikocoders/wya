// Hook for onboarding reminders and checks
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingNotifications } from '@/lib/onboarding-notifications';
import { locationService } from '@/lib/location-service';
import { useQuery } from '@tanstack/react-query';

export function useOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Check profile completion
  const { data: profileCheck } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: () => user ? onboardingNotifications.checkProfileCompletion(user.id) : null,
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Check location permission
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const checkLocation = async () => {
      const cachedLocation = locationService.getCachedLocation();
      if (!cachedLocation) {
        // Check if user has location in profile
        const { supabase } = await import('@/lib/supabase');
        const { data: profile } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();
        
        if (!profile?.location) {
          setShowLocationPrompt(true);
        }
      }
    };

    checkLocation();
  }, [isAuthenticated, user?.id]);

  // Show profile reminder if incomplete
  useEffect(() => {
    if (profileCheck && !profileCheck.hasCompletedOnboarding) {
      setShowProfileReminder(true);
    } else {
      setShowProfileReminder(false);
    }
  }, [profileCheck]);

  // Request location permission
  const requestLocation = async () => {
    if (!user?.id) return;
    setShowLocationPrompt(false);
    await onboardingNotifications.requestLocationPermission(user.id);
  };

  // Dismiss profile reminder
  const dismissProfileReminder = () => {
    setShowProfileReminder(false);
  };

  return {
    profileCheck,
    showProfileReminder,
    showLocationPrompt,
    requestLocation,
    dismissProfileReminder,
  };
}

