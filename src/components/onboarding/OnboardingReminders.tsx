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
        <Card className="bg-kenya-orange/10 border-kenya-orange/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-kenya-orange/20 rounded-lg">
                  <User className="h-5 w-5 text-kenya-orange" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Complete Your Profile</CardTitle>
                  <CardDescription className="text-kenya-brown-light mt-1">
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
                className="h-8 w-8 text-kenya-brown-light hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-kenya-brown-light mb-4">
              Complete your profile to help others discover you and get personalized event recommendations.
            </p>
            <Link to="/profile">
              <Button className="bg-kenya-orange hover:bg-opacity-90 text-white">
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Enable Location Services</CardTitle>
                  <CardDescription className="text-kenya-brown-light mt-1">
                    We use your location to show you events happening near you
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissLocationPrompt}
                className="h-8 w-8 text-kenya-brown-light hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-kenya-brown-light">
                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-400" />
                <p>
                  Your location helps us recommend events in your area and connect you with local communities. 
                  We only use your location to show you relevant events and never share it with third parties.
                </p>
              </div>
              <Button 
                onClick={requestLocation}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full"
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

