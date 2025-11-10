
import React from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

const Section = ({
  title,
  children,
  className = "",
  subtitle,
  action,
}: SectionProps) => {
  return (
    <section className={cn("py-10", className)}>
      <div className="container mx-auto flex flex-col gap-6 px-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Section
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
            {title}
          </h2>
          {subtitle && (
              <p className="text-sm text-white/70 md:text-base">{subtitle}</p>
          )}
          </div>
          {action && <div className="flex shrink-0 items-center">{action}</div>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
};

export default Section;

