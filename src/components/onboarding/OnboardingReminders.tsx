// Onboarding reminders component
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, User, X } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Link } from 'react-router-dom';

const OnboardingReminders = () => {
  const { profileCheck, showProfileReminder, showLocationPrompt, requestLocation, dismissLocationPrompt, dismissProfileReminder } = useOnboarding();

  if (!showProfileReminder && !showLocationPrompt) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Profile Completion Reminder */}
      {showProfileReminder && profileCheck && (
        <Card className="relative overflow-hidden border-pink-200 dark:border-pink-900/30 bg-white dark:bg-card-dark shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-500 to-rose-400" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 pl-2">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center border border-pink-200 dark:border-pink-800/50">
                  <User className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display font-bold text-foreground">Complete Your Profile</CardTitle>
                  <CardDescription className="text-pink-600 dark:text-pink-400 mt-0.5 font-medium text-sm">
                    {!profileCheck.hasProfilePicture && 'Add a profile picture • '}
                    {!profileCheck.hasBio && 'Add a bio • '}
                    {!profileCheck.hasLocation && 'Add your location'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissProfileReminder}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <p className="text-sm text-muted-foreground mb-4 max-w-xl">
              Complete your profile to help others discover you and get personalized event recommendations.
            </p>
            <Link to="/profile">
              <Button className="bg-pink-500 hover:bg-pink-600 text-white shadow-sm shadow-pink-500/20 border border-pink-500/20">
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <Card className="relative overflow-hidden border-blue-200 dark:border-blue-900/30 bg-white dark:bg-card-dark shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-400" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 pl-2">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display font-bold text-foreground">Enable Location Services</CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400 mt-0.5 font-medium text-sm">
                    We use your location to show you events happening near you
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissLocationPrompt}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                <p>
                  Your location helps us recommend events in your area and connect you with local communities. 
                  We only use your location to show you relevant events and never share it with third parties.
                </p>
              </div>
              <Button 
                onClick={requestLocation}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full shadow-sm shadow-blue-500/20 border border-blue-500/20"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OnboardingReminders;

