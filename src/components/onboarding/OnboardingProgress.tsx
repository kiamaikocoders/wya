import { cn } from '@/lib/utils';

type OnboardingProgressProps = {
  step: number;
  total?: number;
  isDark: boolean;
};

export function OnboardingProgress({ step, total = 4, isDark }: OnboardingProgressProps) {
  return (
    <div className="flex w-full gap-2">
      {Array.from({ length: total }, (_, i) => {
        const active = i < step;
        return (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-sm transition-colors',
              active ? 'bg-[#ff6b35]' : isDark ? 'bg-[#21262d]' : 'bg-[#d0d7de]'
            )}
          />
        );
      })}
    </div>
  );
}
