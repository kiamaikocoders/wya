import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  showTagline = false, 
  size = 'md',
  href,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
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

  const [imageError, setImageError] = useState(false);

  const content = (
    <div 
      className={cn('flex flex-col items-start gap-1', className)}
      onClick={onClick}
    >
      <div className="relative flex items-center min-w-[120px]">
        {!imageError ? (
          /* Logo Image - Primary */
          <img
            src="/wyalogo.jpg"
            alt="WYA - Where You At"
            className={cn(
              sizeClasses[size],
              'w-auto min-w-[100px] drop-shadow-[0_4px_12px_rgba(255,128,0,0.45)]',
              'transition-transform hover:scale-105',
              'object-contain',
              'max-w-none',
              'block',
              'z-10',
              'relative'
            )}
            style={{ 
              height: size === 'sm' ? '32px' : size === 'md' ? '40px' : '56px',
              width: 'auto',
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              maxWidth: 'none'
            }}
            loading="eager"
            onError={(e) => {
              console.error('Logo image failed to load:', e);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('Logo image loaded successfully');
            }}
          />
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

