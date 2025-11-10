import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/profile-service';

interface SpotlightProfileCardProps {
  profile: Profile;
  headline?: string;
  highlight?: string;
  className?: string;
}

const SpotlightProfileCard: React.FC<SpotlightProfileCardProps> = ({ profile, headline, highlight, className }) => {
  return (
    <Card
      className={cn(
        'h-full overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/0 transition-colors hover:border-white/15',
        className
      )}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 bg-kenya-brown/60">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || profile.username || ''} />
            <AvatarFallback className="bg-kenya-brown text-white text-lg">
              {(profile.full_name || profile.username || 'U').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{profile.full_name || profile.username || 'Unknown'}</h3>
            {headline && <p className="text-sm text-kenya-orange">{headline}</p>}
          </div>
        </div>
        {highlight && <p className="text-sm text-white/70 line-clamp-3">{highlight}</p>}
        <div className="mt-auto flex gap-3 text-xs text-white/60">
          {profile.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <MapPin size={12} />
              {profile.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
            <Users size={12} />
            Community Host
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotlightProfileCard;

