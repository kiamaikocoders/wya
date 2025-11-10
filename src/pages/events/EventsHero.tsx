import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import type { EventsMetrics, EventsTab } from './types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type EventsHeroProps = {
  metrics: EventsMetrics;
  activeTab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
  contextCity: string | null;
  isAdmin: boolean;
};

const tabs: { value: EventsTab; label: string; description: string }[] = [
  { value: 'discover', label: 'Discover', description: 'Curated spotlight across Kenya' },
  { value: 'for-you', label: 'For You', description: 'Based on your interests & cities' },
  { value: 'attending', label: 'Saved', description: 'Events you marked to revisit' },
  { value: 'past', label: 'Past', description: 'Catch up on what you missed' },
];

const metricCardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const EventsHero = memo(
  ({ metrics, activeTab, onTabChange, contextCity, isAdmin }: EventsHeroProps) => {
    const heroCopy =
      activeTab === 'for-you'
        ? "Your interests, our picks. Let's line up experiences you’ll love."
        : activeTab === 'attending'
        ? 'Keep tabs on the events you bookmarked and get ready for lift-off.'
        : activeTab === 'past'
        ? 'Relive standout moments and revisit highlights from recent gatherings.'
        : 'Vibrant experiences curated from Kenya’s creative pulse.';

    return (
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-kenya-dark/90 via-black/80 to-kenya-dark/95 px-6 py-8 md:px-10 md:py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-[-30%] h-64 w-64 rounded-full bg-kenya-orange/15 blur-3xl" />
          <div className="absolute right-[-10%] top-1/2 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#FF800015,transparent_65%)]" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              <Sparkles className="h-3.5 w-3.5 text-kenya-orange" />
              Curated for explorers
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
            >
              Explore Events
              {contextCity ? (
                <span className="block text-lg font-normal text-white/70 md:text-xl">
                  Handpicked highlights for {contextCity}
                </span>
              ) : (
                <span className="block text-lg font-normal text-white/70 md:text-xl">
                  Fresh line-up across Kenya
                </span>
              )}
            </motion.h1>

            <p className="max-w-xl text-sm text-white/70 md:text-base">{heroCopy}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <CalendarDays className="h-4 w-4 text-kenya-orange" />
                {metrics.thisWeek} events this week
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Sparkles className="h-4 w-4 text-kenya-orange" />
                {metrics.featured} featured picks
              </span>
              {metrics.curatedCity && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <MapPin className="h-4 w-4 text-kenya-orange" />
                  {metrics.curatedCount} in {metrics.curatedCity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isAdmin ? (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-5 text-kenya-dark shadow-[0_0_24px_rgba(255,128,0,0.35)]"
                >
                  <Link to="/create-event">
                    Create event
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/20 text-white hover:border-kenya-orange hover:bg-white/10"
                >
                  <Link to="/request-event">
                    Submit an idea
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Badge className="rounded-full bg-white/10 text-white">
                {metrics.total} live events
              </Badge>
            </div>
          </div>

          <motion.div
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {[
              {
                label: 'Live now',
                value: metrics.total,
              },
              {
                label: 'This week',
                value: metrics.thisWeek,
              },
              {
                label: 'Featured',
                value: metrics.featured,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                variants={metricCardVariants}
                transition={{ duration: 0.35, delay: 0.05 * idx }}
                className="flex h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_15px_40px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <span className="text-xs uppercase tracking-wide text-white/60">{item.label}</span>
                <span className="text-2xl font-semibold">{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={value => onTabChange(value as EventsTab)}>
            <TabsList className="flex flex-wrap gap-2 rounded-full bg-white/10 p-1 backdrop-blur">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'flex flex-col rounded-full px-4 py-2 text-left text-xs uppercase tracking-wide text-white/70 transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-kenya-orange data-[state=active]:via-amber-400 data-[state=active]:to-kenya-orange data-[state=active]:text-kenya-dark',
                    'sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:text-sm'
                  )}
                >
                  <span className="font-semibold">{tab.label}</span>
                  <span className="hidden text-xs font-normal normal-case text-white/60 sm:block">
                    {tab.description}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>
    );
  }
);

EventsHero.displayName = 'EventsHero';

export default EventsHero;

