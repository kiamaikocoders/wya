import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

type EventsEmptyStateProps = {
  onResetFilters: () => void;
  isAdmin: boolean;
};

const EventsEmptyState = ({ onResetFilters, isAdmin }: EventsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 px-8 py-16 text-center text-white/70">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kenya-orange/20">
        <Sparkles className="h-8 w-8 text-kenya-orange" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-white">No events match these filters yet</h3>
      <p className="mt-2 max-w-md text-sm text-white/60">
        Try widening your filters or explore a different category. We’ll keep curating fresh moments
        for you.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          className="rounded-full border-white/20 text-white hover:border-kenya-orange hover:text-white"
          onClick={onResetFilters}
        >
          Reset filters
        </Button>
        {isAdmin ? (
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange text-kenya-dark"
          >
            <Link to="/create-event">Create an event</Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            className="rounded-full text-white/80 hover:text-white"
          >
            <Link to="/request-event">Submit an event idea</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventsEmptyState;

