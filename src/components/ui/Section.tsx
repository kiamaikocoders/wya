
import React from 'react';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const Section = ({ title, children, className = "" }: SectionProps) => {
  return (
    <section className={`py-6 ${className}`}>
      <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-4">
        {title}
      </h2>
      {children}
    </section>
  );
};

export default Section;
