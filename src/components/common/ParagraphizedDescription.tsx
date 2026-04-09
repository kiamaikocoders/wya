import { toDescriptionParagraphs } from '@/lib/ai-plain-text';
import { cn } from '@/lib/utils';

type Props = {
  text: string | null | undefined;
  className?: string;
  paragraphClassName?: string;
};

/** Renders event (or long-form) copy with line breaks preserved as separate paragraphs */
export function ParagraphizedDescription({
  text,
  className,
  paragraphClassName,
}: Props) {
  const parts = toDescriptionParagraphs(text);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((p, i) => (
        <p key={i} className={cn(paragraphClassName, i > 0 && 'mt-3')}>
          {p}
        </p>
      ))}
    </div>
  );
}
