import React from 'react';
import { cn } from '@/lib/utils';

interface SpotlightSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const SpotlightSection: React.FC<SpotlightSectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
  id,
}) => {
  return (
    <section className={cn('space-y-6', className)} id={id}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
          {subtitle && <p className="text-white/60 text-sm md:text-base">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};

export default SpotlightSection;

