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
      // Check if user has dismissed the prompt
      const dismissed = localStorage.getItem('locationPromptDismissed') === 'true';
      if (dismissed) {
        setShowLocationPrompt(false);
        return;
      }

      // Check browser geolocation permission status
      let browserPermissionGranted = false;
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          browserPermissionGranted = permissionStatus.state === 'granted';
        } catch (error) {
          // Permissions API not supported or geolocation not available
          console.warn('Permissions API not available:', error);
        }
      }

      // Check cached location
      const cachedLocation = locationService.getCachedLocation();
      
      // Check if user has location in profile
      const { supabase } = await import('@/lib/supabase');
      const { data: profile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single();
      
      // Only show prompt if:
      // 1. Browser permission is not granted
      // 2. No cached location
      // 3. No profile location
      if (!browserPermissionGranted && !cachedLocation && !profile?.location) {
        setShowLocationPrompt(true);
      } else {
        setShowLocationPrompt(false);
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
    // After requesting, check again to see if it was granted
    // The useEffect will handle hiding the prompt if location is now available
  };

  // Dismiss location prompt (persist to localStorage)
  const dismissLocationPrompt = () => {
    localStorage.setItem('locationPromptDismissed', 'true');
    setShowLocationPrompt(false);
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
    dismissLocationPrompt,
    dismissProfileReminder,
  };
}

