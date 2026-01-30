
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
    <section className={cn("py-10 overflow-x-hidden", className)}>
      <div className="container mx-auto flex min-w-0 max-w-full flex-col gap-6 px-4 sm:px-5">
        <div className="flex min-w-0 flex-col gap-4 rounded-3xl bg-white/5 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2)] backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
          <div className="min-w-0 max-w-3xl space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Section
            </p>
            <h2 className="break-words text-3xl font-semibold leading-tight text-white md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="break-words text-sm leading-relaxed text-white/70 md:text-base">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center">{action}</div>}
        </div>
        <div className="min-w-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
};

export default Section;

