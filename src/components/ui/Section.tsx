
import React from 'react';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

const Section = ({ title, children, className = "", subtitle, action }: SectionProps) => {
  return (
    <section className={`py-6 ${className}`}>
      <div className="flex justify-between items-center px-4 pb-4">
        <div>
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-kenya-brown-light text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {action && action}
      </div>
      {children}
    </section>
  );
};

export default Section;

