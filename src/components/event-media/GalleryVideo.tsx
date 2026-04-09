import { useCallback, useState } from 'react';

import { cn } from '@/lib/utils';

function videoMimeFromUrl(url: string): string {
  const base = url.split('?')[0].toLowerCase();
  if (base.endsWith('.webm')) return 'video/webm';
  if (base.endsWith('.mov') || base.endsWith('.qt')) return 'video/quicktime';
  if (base.endsWith('.m4v')) return 'video/x-m4v';
  if (base.endsWith('.ogv')) return 'video/ogg';
  return 'video/mp4';
}

/** Inline gallery preview: stacked layout + typed source helps mobile decoders; onError offers open-in-new-tab. */
export function GalleryVideo({ url, className }: { url: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  if (failed) {
    return (
      <div
        className={cn(
          'absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-zinc-950 p-3 text-center',
          className
        )}
      >
        <p className="text-[10px] text-zinc-500">Can’t play in this browser</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-amber-400 underline"
        >
          Open video
        </a>
      </div>
    );
  }

  return (
    <video
      key={url}
      className={cn('absolute inset-0 z-[1] h-full w-full object-cover', className)}
      muted
      playsInline
      controls
      preload="auto"
      onError={onError}
    >
      <source src={url} type={videoMimeFromUrl(url)} />
    </video>
  );
}
