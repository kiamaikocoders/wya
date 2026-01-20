// Onboarding and engagement notifications
import { notificationService } from './notification';
import { supabase } from './supabase';
import { locationService } from './location-service';
import { toast } from 'sonner';

export interface OnboardingCheck {
  hasProfilePicture: boolean;
  hasBio: boolean;
  hasLocation: boolean;
  hasCompletedOnboarding: boolean;
}

class OnboardingNotifications {
  /**
   * Check if user needs to complete their profile
   */
  async checkProfileCompletion(userId: string): Promise<OnboardingCheck> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_url, bio, location')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        hasProfilePicture: !!profile?.avatar_url,
        hasBio: !!profile?.bio,
        hasLocation: !!profile?.location,
        hasCompletedOnboarding: !!(profile?.avatar_url && profile?.bio && profile?.location),
      };
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return {
        hasProfilePicture: false,
        hasBio: false,
        hasLocation: false,
        hasCompletedOnboarding: false,
      };
    }
  }

  /**
   * Send profile completion reminder notification
   */
  async sendProfileReminder(userId: string): Promise<void> {
    const check = await this.checkProfileCompletion(userId);
    
    if (check.hasCompletedOnboarding) {
      return; // Already completed
    }

    const missingItems: string[] = [];
    if (!check.hasProfilePicture) missingItems.push('profile picture');
    if (!check.hasBio) missingItems.push('bio');
    if (!check.hasLocation) missingItems.push('location');

    const message = `Complete your profile! Add your ${missingItems.join(', ')} to help others discover you.`;

    await notificationService.createNotification({
      user_id: userId,
      title: 'Complete Your Profile',
      message,
      type: 'system',
      link: '/profile',
    });

    // Show toast notification
    toast.info('Complete your profile', {
      description: message,
      action: {
        label: 'Update Profile',
        onClick: () => window.location.href = '/profile',
      },
    });
  }

  /**
   * Send location permission request notification
   * Only requests if permission is not already granted
   */
  async requestLocationPermission(userId: string): Promise<void> {
    // Check permission status first
    const currentStatus = await locationService.checkPermissionStatus();
    
    // If already granted, proceed silently
    if (currentStatus.granted) {
      const location = await locationService.getCurrentLocation(false, true); // Silent mode
      if (location) {
        // Update user profile with location silently
        await supabase
          .from('profiles')
          .update({ location: location.address || location.city || 'Unknown' })
          .eq('id', userId);
      }
      return; // Exit early, no need to show prompts
    }

    // Only request permission if not already granted
    const permission = await locationService.requestLocationPermission();

    if (permission.granted) {
      const location = await locationService.getCurrentLocation(false, true); // Silent mode
      if (location) {
        // Update user profile with location
        await supabase
          .from('profiles')
          .update({ location: location.address || location.city || 'Unknown' })
          .eq('id', userId);

        await notificationService.createNotification({
          user_id: userId,
          title: 'Location Enabled! 🎉',
          message: `We'll show you events near ${location.city || 'your location'}.`,
          type: 'system',
        });

        toast.success('Location enabled! We\'ll show you events near you.');
      }
    } else if (permission.denied) {
      await notificationService.createNotification({
        user_id: userId,
        title: 'Enable Location Services',
        message: 'Enable location to discover events happening near you! Go to Settings → Privacy → Location Services.',
        type: 'system',
        link: '/settings',
      });

      toast.info('Enable location services', {
        description: 'We use your location to show you nearby events. Enable it in your browser settings.',
      });
    } else {
      // Show explanation why we need location
      toast.info('Enable Location Access', {
        description: 'We use your location to show you events happening near you. This helps you discover local gatherings and connect with your community.',
        action: {
          label: 'Enable',
          onClick: async () => {
            const loc = await locationService.getCurrentLocation(false, false); // Not silent, user explicitly clicked
            if (loc) {
              await supabase
                .from('profiles')
                .update({ location: loc.address || loc.city || 'Unknown' })
                .eq('id', userId);
              toast.success('Location enabled!');
            }
          },
        },
      });
    }
  }

  /**
   * Send welcome notification for new users
   */
  async sendWelcomeNotification(userId: string, userName: string): Promise<void> {
    await notificationService.createNotification({
      user_id: userId,
      title: `Welcome to WYA, ${userName}! 🎉`,
      message: 'Start discovering amazing events across Kenya. Complete your profile to get personalized recommendations.',
      type: 'system',
      link: '/profile',
    });

    // Show welcome toast
    toast.success(`Welcome to WYA, ${userName}!`, {
      description: 'Start exploring events and connect with the community.',
      duration: 5000,
    });
  }

  /**
   * Send welcome back notification for returning users
   */
  async sendWelcomeBackNotification(userId: string, userName: string): Promise<void> {
    // Check for new events since last login
    const { data: recentEvents } = await supabase
      .from('events')
      .select('id, title')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(5);

    if (recentEvents && recentEvents.length > 0) {
      await notificationService.createNotification({
        user_id: userId,
        title: `Welcome back, ${userName}! 👋`,
        message: `${recentEvents.length} new event${recentEvents.length > 1 ? 's' : ''} posted today. Check them out!`,
        type: 'announcement',
        link: '/events',
      });

      toast.success(`Welcome back, ${userName}!`, {
        description: `${recentEvents.length} new event${recentEvents.length > 1 ? 's' : ''} posted today.`,
        action: {
          label: 'View Events',
          onClick: () => window.location.href = '/events',
        },
      });
    } else {
      toast.success(`Welcome back, ${userName}!`, {
        description: 'Ready to discover more events?',
      });
    }
  }

  /**
   * Send nearby events notification
   */
  async sendNearbyEventsNotification(userId: string): Promise<void> {
    // Check permission first
    const permissionStatus = await locationService.checkPermissionStatus();
    
    // If permission is not granted, don't request automatically
    if (!permissionStatus.granted) {
      return; // Exit silently - don't show prompts
    }

    // Permission is granted - get location silently
    let userLocation = locationService.getCachedLocation();
    if (!userLocation) {
      // Try to get fresh location silently
      userLocation = await locationService.getCurrentLocation(false, true); // Silent mode
      if (!userLocation) {
        return; // Can't proceed without location
      }
    }

    // Get events within 50km
    const { data: events } = await supabase
      .from('events')
      .select('id, title, latitude, longitude, date, location')
      .gte('date', new Date().toISOString());

    if (!events || events.length === 0) return;

    const nearbyEvents = events
      .filter((event) => {
        if (!event.latitude || !event.longitude) return false;
        const distance = locationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.latitude,
          event.longitude
        );
        return distance <= 50; // Within 50km
      })
      .slice(0, 3); // Top 3 nearby events

    if (nearbyEvents.length > 0) {
      const eventTitles = nearbyEvents.map(e => e.title).join(', ');
      await notificationService.createNotification({
        user_id: userId,
        title: 'Events Near You 📍',
        message: `Check out these events happening near you: ${eventTitles}`,
        type: 'event_update',
        link: '/events',
      });

      toast.info('Events near you!', {
        description: `${nearbyEvents.length} event${nearbyEvents.length > 1 ? 's' : ''} happening near your location.`,
        action: {
          label: 'View',
          onClick: () => window.location.href = '/events',
        },
      });
    }
  }

  /**
   * Send new event posted notification
   */
  async sendNewEventNotification(userId: string, eventTitle: string, eventId: number): Promise<void> {
    await notificationService.createNotification({
      user_id: userId,
      title: 'New Event Posted! 🎊',
      message: `"${eventTitle}" was just posted. Check it out!`,
      type: 'event_update',
      link: `/events/${eventId}`,
    });
  }

  /**
   * Initialize onboarding for new user
   */
  async initializeOnboarding(userId: string, userName: string): Promise<void> {
    // Send welcome notification
    await this.sendWelcomeNotification(userId, userName);

    // Request location permission
    setTimeout(() => {
      this.requestLocationPermission(userId);
    }, 2000);

    // Send profile completion reminder after 5 seconds
    setTimeout(() => {
      this.sendProfileReminder(userId);
    }, 5000);
  }
}

export const onboardingNotifications = new OnboardingNotifications();

