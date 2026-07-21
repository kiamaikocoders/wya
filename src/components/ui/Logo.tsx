import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Compact mark for tight UI (cards, headers) — no 150px min-width */
  compact?: boolean;
  href?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  showTagline = false, 
  size = 'md',
  compact = false,
  href,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-24',
  };

  const taglineSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  const logoSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const heightPx = compact
    ? 40
    : size === 'sm'
      ? 48
      : size === 'md'
        ? 72
        : 96;

  const [imageError, setImageError] = useState(false);

  const content = (
    <div 
      className={cn('flex flex-col items-start gap-1', className)}
      onClick={onClick}
    >
      <div className={cn('relative flex items-center', !compact && 'min-w-[150px]')}>
        {!imageError ? (
          /* Logo Image - Primary (responsive WebP/AVIF) */
          <picture>
            <source
              type="image/avif"
              srcSet="/WYA_LOGO_2-180.avif 180w, /WYA_LOGO_2-300.avif 300w, /WYA_LOGO_2-612.avif 612w"
              sizes={compact ? '72px' : '(max-width: 640px) 180px, (max-width: 1024px) 300px, 300px'}
            />
            <source
              type="image/webp"
              srcSet="/WYA_LOGO_2-180.webp 180w, /WYA_LOGO_2-300.webp 300w, /WYA_LOGO_2-612.webp 612w"
              sizes={compact ? '72px' : '(max-width: 640px) 180px, (max-width: 1024px) 300px, 300px'}
            />
            <img
              src={compact ? '/WYA_LOGO_2-180.webp' : '/WYA_LOGO_2-300.webp'}
              alt="WYA - Where You At"
              width={compact ? 180 : 612}
              height={compact ? 120 : 408}
              className={cn(
                !compact && sizeClasses[size],
                'w-auto object-contain block relative z-10 bg-transparent',
                compact
                  ? 'h-10 max-h-10 max-w-[72px] min-w-0 drop-shadow-none'
                  : 'min-w-[150px] max-w-none drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)] transition-transform hover:scale-105'
              )}
              style={{
                height: `${heightPx}px`,
                width: 'auto',
                maxWidth: compact ? '72px' : 'none',
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                backgroundColor: 'transparent',
              }}
              loading="eager"
              decoding="async"
              onError={(e) => {
                console.error('Logo image failed to load:', e);
                setImageError(true);
              }}
            />
          </picture>
        ) : (
          /* Text Logo Fallback */
          <div 
            className={cn(
              'flex items-center gap-2',
              logoSizeClasses[size],
              'font-bold text-white tracking-wide'
            )}
          >
            <div className={cn(
              'rounded-lg bg-gradient-to-br from-kenya-orange to-amber-400 p-2',
              size === 'sm' ? 'p-1.5' : size === 'md' ? 'p-2' : 'p-3'
            )}>
              <span className="font-bold text-kenya-dark">WYA</span>
            </div>
          </div>
        )}
      </div>
      {/* Tagline */}
      {showTagline && (
        <p className={cn(
          taglineSizeClasses[size],
          'text-white/80 uppercase tracking-wider font-medium ml-1'
        )}>
          WHERE YOU AT
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

