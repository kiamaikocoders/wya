
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sponsorService, EventSponsor } from '@/lib/sponsor';
import SponsorBanner from './SponsorBanner';
import { Button } from '@/components/ui/button';
import { Handshake } from 'lucide-react';
import { Sponsor } from '@/lib/sponsor/types';

interface EventSponsorsSectionProps {
  eventId: number;
  size?: 'sm' | 'md' | 'lg';
}

const EventSponsorsSection: React.FC<EventSponsorsSectionProps> = ({ eventId, size = 'md' }) => {
  const { data: eventSponsors, isLoading } = useQuery({
    queryKey: ['eventSponsors', eventId],
    queryFn: () => sponsorService.getEventSponsors(eventId),
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (!eventSponsors || eventSponsors.length === 0) return null;
  
  // Extract the sponsors from the eventSponsors array
  const sponsors = eventSponsors
    .filter(es => es.sponsor)
    .map(es => es.sponsor!)
    // Add type assertion to match the expected type
    .map(sponsor => ({
      ...sponsor,
      partnership_level: sponsor.partnership_level as "title" | "presenting" | "gold" | "silver" | "bronze" | "partner" | string
    }));
  
  if (sponsors.length === 0) return null;
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Event Sponsors</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sponsors" className="flex items-center gap-1 text-xs">
            <Handshake size={14} />
            <span>All Sponsors</span>
          </Link>
        </Button>
      </div>
      
      <SponsorBanner sponsors={sponsors} size={size} showLabels={true} />
    </div>
  );
};

export default EventSponsorsSection;
