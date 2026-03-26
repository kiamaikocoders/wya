import React from 'react';

/** Groups non-empty lines into paragraphs (blank line = break). */
export function PlainLegalBody({ text }: { text: string }) {
  const blocks: string[] = [];
  let cur: string[] = [];
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (!t) {
      if (cur.length) {
        blocks.push(cur.join(' '));
        cur = [];
      }
    } else {
      cur.push(t);
    }
  }
  if (cur.length) blocks.push(cur.join(' '));

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {blocks.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
