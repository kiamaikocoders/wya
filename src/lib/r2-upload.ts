import { supabase } from '@/integrations/supabase/client';
import type { UploadResult } from '@/lib/storage-service';

/** Public CDN base for R2 objects (custom domain on wya-media). */
export const R2_PUBLIC_BASE_URL = (
  (import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined)?.trim() ||
  'https://cdn.wya254.com'
).replace(/\/$/, '');

export type R2UploadRequest = {
  /** Legacy logical bucket name (media, event-images, …) — becomes key prefix. */
  bucket: string;
  file: File | Blob;
  fileName?: string;
  folder?: string;
  /** Full object path under the legacy bucket (overrides folder/fileName). */
  path?: string;
  contentType?: string;
  /** Allow unauthenticated proposal uploads only. */
  allowGuest?: boolean;
};

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  path: string;
  fullPath: string;
  bucket: string;
  headers?: Record<string, string>;
  error?: string;
};

function getR2ApiEndpoint(path: '/api/r2-upload-url' | '/api/r2-delete'): string {
  const proxyBase = import.meta.env.VITE_AI_PROXY_BASE_URL as string | undefined;
  if (proxyBase?.trim()) {
    return `${proxyBase.replace(/\/$/, '')}${path}`;
  }
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

function getR2UploadUrlEndpoint(): string {
  return getR2ApiEndpoint('/api/r2-upload-url');
}

/**
 * Request a short-lived R2 PUT URL and upload the file directly to Cloudflare.
 */
export async function uploadToR2(request: R2UploadRequest): Promise<UploadResult> {
  const url = getR2UploadUrlEndpoint();

  let {
    data: { session },
  } = await supabase.auth.getSession();

  // Refresh if the access token is missing or about to expire (common cause of 401 from /api/r2-upload-url).
  if (!request.allowGuest) {
    const expiresAt = session?.expires_at ?? 0;
    const needsRefresh =
      !session?.access_token || expiresAt * 1000 < Date.now() + 60_000;
    if (needsRefresh) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('r2-upload session refresh failed', refreshError.message);
      }
      session = refreshed.session ?? session;
    }
  }

  if (!session?.access_token && !request.allowGuest) {
    throw new Error('You must be logged in to upload files');
  }

  const contentType =
    request.contentType ||
    (request.file instanceof File ? request.file.type : '') ||
    'application/octet-stream';

  const fileName =
    request.fileName ||
    (request.file instanceof File ? request.file.name : `upload-${Date.now()}`);

  const presignRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({
      bucket: request.bucket,
      fileName,
      folder: request.folder,
      path: request.path,
      contentType,
      contentLength: request.file.size,
      allowGuest: Boolean(request.allowGuest),
    }),
  });

  const payload = (await presignRes.json()) as PresignResponse;
  if (!presignRes.ok) {
    throw new Error(payload.error || 'Failed to create upload URL');
  }

  const putHeaders: Record<string, string> = {
    'Content-Type': contentType,
    ...(payload.headers ?? {}),
  };

  const putRes = await fetch(payload.uploadUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: request.file,
  });

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => '');
    throw new Error(
      `R2 upload failed (${putRes.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    );
  }

  return {
    path: payload.path,
    publicUrl: payload.publicUrl,
    fullPath: payload.fullPath,
  };
}

/**
 * Delete an R2 object by public CDN URL or key (server enforces ownership/admin).
 */
export async function deleteFromR2(options: {
  url?: string;
  key?: string;
  bucket?: string;
  path?: string;
}): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be logged in to delete files');
  }

  const res = await fetch(getR2ApiEndpoint('/api/r2-delete'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(options),
  });

  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to delete R2 object');
  }
}
