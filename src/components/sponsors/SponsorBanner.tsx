
import React from 'react';
import { Link } from 'react-router-dom';
import { EventSponsor } from '@/lib/sponsor/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SponsorBannerProps {
  sponsors: EventSponsor[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const SponsorBanner: React.FC<SponsorBannerProps> = ({ 
  sponsors, 
  size = 'md', 
  showLabels = false 
}) => {
  if (!sponsors || sponsors.length === 0) return null;
  
  const logoSizes = {
    sm: 'h-6 w-6 md:h-8 md:w-8',
    md: 'h-8 w-8 md:h-10 md:w-10',
    lg: 'h-10 w-10 md:h-14 md:w-14',
  };
  
  const sortedSponsors = [...sponsors].sort((a, b) => {
    const levels = {
      'title': 5,
      'presenting': 4,
      'supporting': 3,
      'partner': 2,
      'media': 1,
      'community': 0
    };
    
    return (levels[b.sponsorship_type] || 0) - (levels[a.sponsorship_type] || 0);
  });
  
  const titleSponsor = sortedSponsors.find(s => s.sponsorship_type === 'title');
  const otherSponsors = sortedSponsors.filter(s => s.sponsorship_type !== 'title');
  
  return (
    <div className="w-full bg-kenya-dark/50 backdrop-blur-md rounded-lg p-2 md:p-3">
      {showLabels && (
        <p className="text-xs text-kenya-brown-light text-center mb-2">
          {titleSponsor ? 'Proudly Sponsored By' : 'Sponsors'}
        </p>
      )}
      
      <div className="flex flex-col gap-2">
        {titleSponsor && titleSponsor.sponsor && (
          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to={`/sponsors/${titleSponsor.sponsor_id}`}
                    className="flex items-center gap-2 bg-black/30 rounded-full px-3 py-1.5"
                  >
                    <img 
                      src={titleSponsor.sponsor.logo_url}
                      alt={titleSponsor.sponsor.name}
                      className={`${logoSizes[size]} rounded-full object-contain bg-white p-0.5`}
                    />
                    <span className="text-white font-medium">
                      {titleSponsor.sponsor.name}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Title Sponsor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {otherSponsors.length > 0 && (
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 py-1 px-2 min-w-max">
              {otherSponsors.map(sponsor => (
                sponsor.sponsor && (
                  <TooltipProvider key={sponsor.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={`/sponsors/${sponsor.sponsor_id}`}>
                          <img 
                            src={sponsor.sponsor.logo_url}
                            alt={sponsor.sponsor.name}
                            className={`${logoSizes[size]} rounded-full object-contain bg-white p-0.5`}
                          />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          <p>{sponsor.sponsor.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {sponsor.sponsorship_type.charAt(0).toUpperCase() + sponsor.sponsorship_type.slice(1)} Sponsor
                          </Badge>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default SponsorBanner;
