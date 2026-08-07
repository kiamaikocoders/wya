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

function getR2ApiEndpoint(
  path: '/api/r2-upload-url' | '/api/r2-delete' | '/api/r2-upload',
): string {
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

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function resolveSession(allowGuest: boolean) {
  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!allowGuest) {
    const expiresAtMs = (session?.expires_at ?? 0) * 1000;
    const needsRefresh =
      !session?.access_token || expiresAtMs < Date.now() + 60_000;
    if (needsRefresh) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('r2-upload session refresh failed', refreshError.message);
      }
      session = refreshed.session ?? session;
    }
  }

  if (!session?.access_token && !allowGuest) {
    throw new Error('You must be logged in to upload files');
  }

  return session;
}

/**
 * Same-origin server upload — used when browser PUT to R2 fails (CORS / Failed to fetch).
 */
async function uploadViaServerProxy(
  request: R2UploadRequest,
  accessToken: string | undefined,
  contentType: string,
  fileName: string,
): Promise<UploadResult> {
  if (!accessToken) {
    throw new Error('You must be logged in to upload files');
  }

  const dataBase64 = await blobToBase64(request.file);
  const res = await fetch(getR2ApiEndpoint('/api/r2-upload'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      bucket: request.bucket,
      fileName,
      folder: request.folder,
      path: request.path,
      contentType,
      dataBase64,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    publicUrl?: string;
    path?: string;
    fullPath?: string;
    error?: string;
    detail?: string;
  };

  if (!res.ok || !payload.publicUrl) {
    const message = [payload.error, payload.detail].filter(Boolean).join(' — ');
    throw new Error(message || 'Server upload failed');
  }

  return {
    path: payload.path || '',
    publicUrl: payload.publicUrl,
    fullPath: payload.fullPath || payload.path || '',
  };
}

/**
 * Request a short-lived R2 PUT URL and upload the file directly to Cloudflare.
 * Falls back to a same-origin server upload if the browser cannot reach R2.
 */
export async function uploadToR2(request: R2UploadRequest): Promise<UploadResult> {
  const url = getR2UploadUrlEndpoint();
  const session = await resolveSession(Boolean(request.allowGuest));

  const contentType =
    request.contentType ||
    (request.file instanceof File ? request.file.type : '') ||
    'application/octet-stream';

  const fileName =
    request.fileName ||
    (request.file instanceof File ? request.file.name : `upload-${Date.now()}`);

  let payload: PresignResponse;
  try {
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

    payload = (await presignRes.json()) as PresignResponse;
    if (!presignRes.ok) {
      throw new Error(payload.error || 'Failed to create upload URL');
    }
  } catch (error) {
    if (isNetworkFetchError(error) && session?.access_token) {
      console.warn('r2-upload-url unreachable, using server upload', error);
      return uploadViaServerProxy(
        request,
        session.access_token,
        contentType,
        fileName,
      );
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to create upload URL');
  }

  const putHeaders: Record<string, string> = {
    'Content-Type': contentType,
    ...(payload.headers ?? {}),
  };

  try {
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
  } catch (error) {
    // Browser→R2 often surfaces as TypeError: Failed to fetch (CORS / blocked host).
    if (
      session?.access_token &&
      (isNetworkFetchError(error) ||
        (error instanceof Error && /R2 upload failed/.test(error.message)))
    ) {
      console.warn('Direct R2 PUT failed, using server upload', error);
      return uploadViaServerProxy(
        request,
        session.access_token,
        contentType,
        fileName,
      );
    }

    if (isNetworkFetchError(error)) {
      throw new Error(
        'Could not reach storage (network/CORS). Check your connection and try again.',
      );
    }
    throw error instanceof Error ? error : new Error('Upload failed');
  }
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
