import { StatusScreen } from '@/components/status/StatusScreen';

type EventsEmptyStateProps = {
  onResetFilters: () => void;
  isAdmin: boolean;
};

const EventsEmptyState = ({ onResetFilters }: EventsEmptyStateProps) => {
  return (
    <StatusScreen
      variant="empty_results"
      embedded
      onClearFilters={onResetFilters}
      className="rounded-3xl border border-dashed border-white/10 bg-black/20"
    />
  );
};

export default EventsEmptyState;
