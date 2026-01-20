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
  { value: 'discover', label: 'Discover', description: 'Curated discover across Kenya' },
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
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-8 md:px-10 md:py-12 shadow-sm">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-[-30%] h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-[-10%] top-1/2 h-72 w-72 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Curated for explorers
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-display font-bold tracking-tight text-foreground md:text-4xl"
            >
              Explore Events
              {contextCity ? (
                <span className="block text-lg font-normal text-muted-foreground md:text-xl">
                  Handpicked highlights for {contextCity}
                </span>
              ) : (
                <span className="block text-lg font-normal text-muted-foreground md:text-xl">
                  Fresh line-up across Kenya
                </span>
              )}
            </motion.h1>

            <p className="max-w-xl text-sm text-muted-foreground md:text-base">{heroCopy}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                {metrics.thisWeek} events this week
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <Sparkles className="h-4 w-4 text-primary" />
                {metrics.featured} featured picks
              </span>
              {metrics.curatedCity && (
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {metrics.curatedCount} in {metrics.curatedCity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isAdmin ? (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 text-white shadow-md shadow-orange-500/20"
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
                  className="rounded-full"
                >
                  <Link to="/request-event">
                    Submit an idea
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Badge className="rounded-full bg-muted text-foreground">
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
                className="flex h-24 flex-col justify-between rounded-2xl border border-border bg-muted/50 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
                <span className="text-2xl font-display font-bold text-foreground">{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={value => onTabChange(value as EventsTab)}>
            <TabsList className="flex flex-wrap gap-2 rounded-full bg-muted p-1">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'flex flex-col rounded-full px-4 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white',
                    'sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:text-sm'
                  )}
                >
                  <span className="font-semibold">{tab.label}</span>
                  <span className="hidden text-xs font-normal normal-case opacity-70 sm:block">
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

