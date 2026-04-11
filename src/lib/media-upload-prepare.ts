/**
 * Client-side media prep for non–Pro Supabase (no Storage Image Transforms).
 * - Raster images: downscale + WebP/JPEG re-encode when it saves bytes
 * - Video: byte cap + max duration via metadata (no transcode)
 */

export const STORAGE_CACHE_CONTROL_IMMUTABLE = '31536000';

export type MediaUploadContext =
  | 'story'
  | 'avatar'
  | 'event-image'
  | 'throwback'
  | 'community'
  | 'proposal'
  | 'ghost'
  | 'generic';

type Limits = {
  maxImageBytesBefore: number;
  maxVideoBytes: number;
  maxVideoSeconds: number;
  imageMaxEdge: number;
  imageQuality: number;
};

const LIMITS: Record<Exclude<MediaUploadContext, 'generic'>, Limits> = {
  story: {
    maxImageBytesBefore: 25 * 1024 * 1024,
    maxVideoBytes: 45 * 1024 * 1024,
    maxVideoSeconds: 180,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
  avatar: {
    maxImageBytesBefore: 8 * 1024 * 1024,
    maxVideoBytes: 0,
    maxVideoSeconds: 0,
    imageMaxEdge: 1024,
    imageQuality: 0.85,
  },
  'event-image': {
    maxImageBytesBefore: 12 * 1024 * 1024,
    maxVideoBytes: 0,
    maxVideoSeconds: 0,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
  proposal: {
    maxImageBytesBefore: 12 * 1024 * 1024,
    maxVideoBytes: 0,
    maxVideoSeconds: 0,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
  throwback: {
    maxImageBytesBefore: 25 * 1024 * 1024,
    maxVideoBytes: 45 * 1024 * 1024,
    maxVideoSeconds: 180,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
  community: {
    maxImageBytesBefore: 15 * 1024 * 1024,
    maxVideoBytes: 35 * 1024 * 1024,
    maxVideoSeconds: 120,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
  ghost: {
    maxImageBytesBefore: 20 * 1024 * 1024,
    maxVideoBytes: 45 * 1024 * 1024,
    maxVideoSeconds: 180,
    imageMaxEdge: 1920,
    imageQuality: 0.82,
  },
};

const GIF_MAX_BYTES = 8 * 1024 * 1024;
const SVG_MAX_BYTES = 2 * 1024 * 1024;

function baseName(file: File): string {
  const n = file.name.replace(/[/\\]/g, '');
  const i = n.lastIndexOf('.');
  return i > 0 ? n.slice(0, i) : n || 'upload';
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

async function optimizeRasterImage(
  file: File,
  maxEdge: number,
  quality: number
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      'Could not read this image. Try JPEG, PNG, or WebP, or a smaller file.'
    );
  }

  try {
    let { width, height } = bitmap;
    const maxDim = Math.max(width, height);
    const scale = maxDim > maxEdge ? maxEdge / maxDim : 1;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    const webp = await canvasToBlob(canvas, 'image/webp', quality);
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);

    const candidates: { blob: Blob; name: string; type: string }[] = [];
    if (webp) {
      candidates.push({
        blob: webp,
        name: `${baseName(file)}.webp`,
        type: 'image/webp',
      });
    }
    if (jpeg) {
      candidates.push({
        blob: jpeg,
        name: `${baseName(file)}.jpg`,
        type: 'image/jpeg',
      });
    }

    let best = file;
    let bestSize = file.size;
    for (const c of candidates) {
      if (c.blob.size > 0 && c.blob.size < bestSize) {
        best = new File([c.blob], c.name, { type: c.type });
        bestSize = c.blob.size;
      }
    }

    if (scale < 1 && best === file && jpeg) {
      return new File([jpeg], `${baseName(file)}.jpg`, { type: 'image/jpeg' });
    }

    return best;
  } finally {
    bitmap.close();
  }
}

function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    const cleanup = () => URL.revokeObjectURL(url);
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out reading video metadata'));
    }, 15000);

    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const d = v.duration;
      cleanup();
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error('Invalid video duration'));
      } else {
        resolve(d);
      }
    };
    v.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      reject(new Error('Could not read video file'));
    };
    v.src = url;
  });
}

async function prepareImage(file: File, limits: Limits): Promise<File> {
  const mime = file.type.toLowerCase();

  if (mime === 'image/svg+xml') {
    if (file.size > SVG_MAX_BYTES) {
      throw new Error('SVG must be under 2MB');
    }
    return file;
  }

  if (mime === 'image/gif') {
    if (file.size > GIF_MAX_BYTES) {
      throw new Error(`GIF must be under ${GIF_MAX_BYTES / (1024 * 1024)}MB`);
    }
    return file;
  }

  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size > limits.maxImageBytesBefore) {
    throw new Error(
      `Image must be under ${Math.round(limits.maxImageBytesBefore / (1024 * 1024))}MB before upload`
    );
  }

  return optimizeRasterImage(file, limits.imageMaxEdge, limits.imageQuality);
}

async function prepareVideo(file: File, limits: Limits): Promise<File> {
  if (limits.maxVideoBytes <= 0) {
    throw new Error('Video is not allowed for this upload');
  }
  if (file.size > limits.maxVideoBytes) {
    throw new Error(
      `Video must be under ${Math.round(limits.maxVideoBytes / (1024 * 1024))}MB`
    );
  }
  const seconds = await getVideoDurationSeconds(file);
  if (seconds > limits.maxVideoSeconds) {
    const max = limits.maxVideoSeconds;
    throw new Error(
      `Video must be ${max} seconds or shorter (this file is ${Math.ceil(seconds)}s)`
    );
  }
  return file;
}

/**
 * Resize/compress images, validate video size+duration, or pass through for generic.
 */
export async function prepareMediaForUpload(
  file: File,
  context: MediaUploadContext
): Promise<File> {
  if (context === 'generic') {
    return file;
  }

  const limits = LIMITS[context];

  if (file.type.startsWith('video/')) {
    return prepareVideo(file, limits);
  }

  if (context === 'avatar' && !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.type.startsWith('image/')) {
    return prepareImage(file, limits);
  }

  return file;
}
