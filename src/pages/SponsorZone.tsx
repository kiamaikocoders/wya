
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sponsor, SponsorZone as SponsorZoneType, sponsorService } from '@/lib/sponsor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SponsorZoneBlock from '@/components/sponsors/SponsorZoneBlock';

const SponsorZone: React.FC = () => {
  const { sponsorId } = useParams<{ sponsorId: string }>();
  const navigate = useNavigate();
  
  // Fetch sponsor details
  const { 
    data: sponsor, 
    isLoading: sponsorLoading, 
    error: sponsorError 
  } = useQuery({
    queryKey: ['sponsor', sponsorId],
    queryFn: () => sponsorService.getSponsorById(Number(sponsorId)),
    enabled: !!sponsorId,
  });
  
  // Fetch sponsor zone content
  const { 
    data: sponsorZone, 
    isLoading: zoneLoading, 
    error: zoneError 
  } = useQuery({
    queryKey: ['sponsorZone', sponsorId],
    queryFn: () => sponsorService.getSponsorZone(Number(sponsorId)),
    enabled: !!sponsorId,
  });
  
  const isLoading = sponsorLoading || zoneLoading;
  const error = sponsorError || zoneError;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (error || !sponsor) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-4">Sponsor not found</h1>
        <p className="text-kenya-brown-light mb-6">The sponsor you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      {/* Sponsor Header */}
      <div className="relative">
        <div 
          className="w-full h-40 bg-center bg-cover bg-no-repeat relative"
          style={{ 
            backgroundColor: '#2A231D',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7))` 
          }}
        >
          <Button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full text-white"
            size="icon"
            variant="ghost"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="absolute left-0 right-0 -bottom-16 flex justify-center">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={sponsor.logo_url} alt={sponsor.name} />
              <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
      
      {/* Sponsor Details */}
      <div className="mt-20 px-4 pt-4 text-center">
        <h1 className="text-2xl font-bold mb-1">{sponsor.name}</h1>
        <div className="inline-flex items-center gap-1 text-sm text-kenya-brown-light">
          <span className="capitalize px-2 py-0.5 bg-kenya-brown/20 rounded-full">
            {sponsor.partnership_level} Partner
          </span>
        </div>
        
        {sponsor.description && (
          <p className="mt-4 text-kenya-brown-light">{sponsor.description}</p>
        )}
        
        {sponsor.website_url && (
          <Button 
            variant="outline" 
            className="mt-4 flex items-center gap-2"
            onClick={() => window.open(sponsor.website_url, '_blank')}
          >
            <Globe size={16} />
            Visit Website
            <ExternalLink size={14} />
          </Button>
        )}
      </div>
      
      {/* Sponsor Zone Content */}
      <div className="px-4 mt-8">
        <h2 className="text-xl font-bold mb-4">
          {sponsorZone?.title || `${sponsor.name} Zone`}
        </h2>
        
        {sponsorZone?.description && (
          <p className="text-kenya-brown-light mb-6">{sponsorZone.description}</p>
        )}
        
        {sponsorZone?.content_blocks && sponsorZone.content_blocks.length > 0 ? (
          <div className="space-y-6">
            {/* Sort blocks by their order property */}
            {[...sponsorZone.content_blocks]
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <SponsorZoneBlock 
                  key={block.id} 
                  block={block} 
                  sponsorId={Number(sponsorId)} 
                />
              ))
            }
          </div>
        ) : (
          <div className="text-center py-8 text-kenya-brown-light">
            <p>No content available in this zone yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorZone;
