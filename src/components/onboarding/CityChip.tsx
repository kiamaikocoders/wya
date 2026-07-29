import { cn } from '@/lib/utils';

type CityChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  isDark: boolean;
};

export function CityChip({ label, selected, onClick, isDark }: CityChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-2.5 text-[13px] font-semibold transition-colors touch-manipulation min-h-[44px]',
        selected
          ? 'bg-[#ff6b35] text-white'
          : isDark
            ? 'border border-[#21262d] bg-[#161b22] text-[#e6edf3] hover:bg-white/5'
            : 'border border-[#d0d7de] bg-[#f6f8fa] text-[#0d1117] hover:bg-black/5'
      )}
    >
      {label}
    </button>
  );
}
