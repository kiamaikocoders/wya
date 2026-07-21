import React from 'react';

import { cn } from '@/lib/utils';

/** One blank line (or more) between paragraphs in source; single newlines preserved inside a paragraph. */
export function PlainLegalBody({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={cn('space-y-3 text-sm leading-relaxed text-foreground/90', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
