import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type EventSkeletonProps = {
  variant?: 'grid' | 'list';
};

const EventSkeleton = ({ variant = 'grid' }: EventSkeletonProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-white/5 bg-black/30 shadow-[0_25px_50px_rgba(0,0,0,0.35)] backdrop-blur',
        variant === 'list' && 'md:flex'
      )}
    >
      <Skeleton className={cn('h-48 w-full bg-white/10', variant === 'list' ? 'md:w-64' : '')} />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-5 w-3/5 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-2/3 bg-white/10" />
        <div className="mt-auto flex gap-2">
          <Skeleton className="h-6 w-20 bg-white/10" />
          <Skeleton className="h-6 w-20 bg-white/10" />
        </div>
      </div>
    </div>
  );
};

export default EventSkeleton;

