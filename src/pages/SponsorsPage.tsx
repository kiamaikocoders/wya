
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sponsorService, type Sponsor } from '@/lib/sponsor';
import { getSponsorColorVars, getSponsorClasses } from '@/lib/sponsor/brand-utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const SponsorsPage: React.FC = () => {
  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: sponsorService.getSponsors,
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (sponsors.length === 0) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-bold mb-6">Our Sponsors</h1>
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No sponsors available at the moment.</p>
        </div>
      </div>
    );
  }
  
  // Group sponsors by partnership level
  const sponsorsByLevel: Record<string, Sponsor[]> = {};
  
  sponsors.forEach(sponsor => {
    if (!sponsorsByLevel[sponsor.partnership_level]) {
      sponsorsByLevel[sponsor.partnership_level] = [];
    }
    sponsorsByLevel[sponsor.partnership_level].push(sponsor);
  });
  
  // Define the display order of partnership levels
  const levelOrder = ['title', 'presenting', 'gold', 'silver', 'bronze', 'partner'];
  
  // Format level name for display
  const formatLevelName = (level: string): string => {
    return level.charAt(0).toUpperCase() + level.slice(1) + ' Sponsors';
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Our Sponsors</h1>
      
      <div className="space-y-12">
        {levelOrder.map(level => {
          const levelSponsors = sponsorsByLevel[level];
          
          if (!levelSponsors || levelSponsors.length === 0) return null;
          
          return (
            <div key={level}>
              <h2 className="text-xl font-semibold mb-4">
                {formatLevelName(level)}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levelSponsors.map(sponsor => {
                  const colorVars = getSponsorColorVars(sponsor as any);
                  return (
                    <Link to={`/sponsors/${sponsor.id}`} key={sponsor.id}>
                      <Card 
                        className="h-full hover:bg-accent/50 transition-colors border-opacity-50 relative overflow-hidden"
                        style={{
                          ...colorVars as React.CSSProperties,
                          borderColor: sponsor.brand_color ? `${sponsor.brand_color}40` : undefined
                        }}
                      >
                        {sponsor.brand_color && (
                          <div 
                            className="absolute top-0 left-0 w-1 h-full"
                            style={{ backgroundColor: sponsor.brand_color }}
                          ></div>
                        )}
                        <CardContent className="pt-6 relative z-10">
                          <div className="flex flex-col items-center mb-4">
                            <Avatar className="h-24 w-24 mb-4 bg-white">
                              <AvatarImage src={sponsor.logo_url} alt={sponsor.name} />
                              <AvatarFallback>{sponsor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <h3 className="text-lg font-bold">{sponsor.name}</h3>
                            
                            <Badge 
                              variant="outline" 
                              className={`mt-1 ${getSponsorClasses(sponsor as any, 'border')}`}
                            >
                              {sponsor.partnership_level}
                            </Badge>
                          </div>
                          
                          {sponsor.description && (
                            <p className="text-muted-foreground text-sm text-center line-clamp-3">
                              {sponsor.description}
                            </p>
                          )}
                        </CardContent>
                        
                        <CardFooter className="justify-center">
                          <Button 
                            variant="default"
                            style={
                              sponsor.brand_color 
                                ? { backgroundColor: sponsor.brand_color } 
                                : {}
                            }
                          >
                            Visit Sponsor Zone
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SponsorsPage;
