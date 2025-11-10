import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpotlightGuideItem {
  id: string;
  title: string;
  category: string;
  description: string;
  location?: string;
  link?: string;
}

const SpotlightGuideCard: React.FC<{ item: SpotlightGuideItem; className?: string }> = ({ item, className }) => {
  return (
    <Card
      className={cn(
        'group h-full overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-white/0 transition-all hover:border-white/20',
        className
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-kenya-orange">{item.category}</span>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="text-sm text-white/70 line-clamp-3">{item.description}</p>
        </div>
        {item.location && <p className="text-xs text-white/50">Near {item.location}</p>}
        <button
          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-kenya-orange transition-colors group-hover:text-white"
          onClick={() => item.link && window.open(item.link, '_blank')}
        >
          Explore <ArrowUpRight size={16} />
        </button>
      </CardContent>
    </Card>
  );
};

export default SpotlightGuideCard;

