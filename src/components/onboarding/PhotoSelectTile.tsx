import { cn } from '@/lib/utils';

type PhotoSelectTileProps = {
  imageSrc: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  aspect?: 'interest' | 'city';
  showCheck?: boolean;
};

export function PhotoSelectTile({
  imageSrc,
  label,
  selected,
  onClick,
  className,
  aspect = 'interest',
  showCheck = true,
}: PhotoSelectTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl text-left transition-all touch-manipulation',
        aspect === 'interest' ? 'h-[140px] w-full min-w-0' : 'h-[120px] w-full min-w-0',
        selected
          ? 'border-[2.5px] border-[#ff6b35]'
          : 'border border-[#d0d7de] dark:border-[#21262d]',
        className
      )}
    >
      <img src={imageSrc} alt="" className="absolute inset-0 size-full object-cover" />
      <div
        className={cn(
          'absolute inset-0 transition-colors',
          selected ? 'bg-[rgba(13,17,23,0.25)]' : 'bg-[rgba(13,17,23,0.5)]'
        )}
      />
      <span className="absolute bottom-3 left-3 z-10 text-sm font-semibold text-white">{label}</span>
      {selected && showCheck && (
        <span className="absolute right-2.5 top-2.5 z-10 flex size-[22px] items-center justify-center rounded-full bg-[#ff6b35]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2.5 6.2L4.8 8.5L9.5 3.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
