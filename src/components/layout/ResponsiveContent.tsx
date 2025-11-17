import React from 'react';
import { cn } from '@/lib/utils';

/**
 * ResponsiveContent - Mobile-first component for reordering content
 * 
 * Usage:
 * <ResponsiveContent mobileOrder={1} desktopOrder={2}>
 *   Content that appears first on mobile, second on desktop
 * </ResponsiveContent>
 */
interface ResponsiveContentProps {
  children: React.ReactNode;
  mobileOrder?: number;
  desktopOrder?: number;
  className?: string;
}

export const ResponsiveContent: React.FC<ResponsiveContentProps> = ({
  children,
  mobileOrder = 0,
  desktopOrder = 0,
  className,
}) => {
  // Use CSS custom properties for dynamic ordering
  const orderStyle = {
    '--mobile-order': mobileOrder,
    '--desktop-order': desktopOrder,
  } as React.CSSProperties;
  
  return (
    <div
      className={cn('order-[var(--mobile-order)] md:order-[var(--desktop-order)]', className)}
      style={orderStyle}
    >
      {children}
    </div>
  );
};

/**
 * MobileFirstGrid - Mobile-first grid component
 * 
 * Usage:
 * <MobileFirstGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
 *   {items}
 * </MobileFirstGrid>
 */
interface MobileFirstGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
}

export const MobileFirstGrid: React.FC<MobileFirstGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  className,
}) => {
  const gridCols = `grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div className={cn('grid', gridCols, gap, className)}>
      {children}
    </div>
  );
};

/**
 * MobileFirstStack - Mobile-first flex stack component
 * 
 * Usage:
 * <MobileFirstStack direction={{ mobile: 'col', desktop: 'row' }}>
 *   {items}
 * </MobileFirstStack>
 */
interface MobileFirstStackProps {
  children: React.ReactNode;
  direction?: {
    mobile?: 'col' | 'row';
    desktop?: 'col' | 'row';
  };
  gap?: string;
  className?: string;
}

export const MobileFirstStack: React.FC<MobileFirstStackProps> = ({
  children,
  direction = { mobile: 'col', desktop: 'row' },
  gap = 'gap-4',
  className,
}) => {
  const flexDirection = `flex-${direction.mobile} md:flex-${direction.desktop}`;
  
  return (
    <div className={cn('flex', flexDirection, gap, className)}>
      {children}
    </div>
  );
};

/**
 * ShowOnMobile - Component that only shows on mobile
 */
interface ShowOnMobileProps {
  children: React.ReactNode;
  className?: string;
}

export const ShowOnMobile: React.FC<ShowOnMobileProps> = ({
  children,
  className,
}) => {
  return <div className={cn('block md:hidden', className)}>{children}</div>;
};

/**
 * ShowOnDesktop - Component that only shows on desktop
 */
interface ShowOnDesktopProps {
  children: React.ReactNode;
  className?: string;
}

export const ShowOnDesktop: React.FC<ShowOnDesktopProps> = ({
  children,
  className,
}) => {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
};

/**
 * ResponsiveText - Mobile-first text sizing
 */
interface ResponsiveTextProps {
  children: React.ReactNode;
  mobile?: string;
  tablet?: string;
  desktop?: string;
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  mobile = 'text-base',
  tablet = 'md:text-lg',
  desktop = 'lg:text-xl',
  className,
}) => {
  return (
    <div className={cn(mobile, tablet, desktop, className)}>
      {children}
    </div>
  );
};

