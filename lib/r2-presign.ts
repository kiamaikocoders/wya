import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const ALLOWED_BUCKETS = new Set([
  "media",
  "stories",
  "event-images",
  "event-media",
  "avatars",
  "user-avatars",
  "throwbacks",
  "community-content",
  "forum-media",
  "uploads",
]);

const MAX_BYTES = 100 * 1024 * 1024;

export type R2PresignEnv = {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_ENDPOINT?: string;
  R2_PUBLIC_BASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

export type R2PresignBody = {
  bucket?: string;
  contentType?: string;
  fileName?: string;
  folder?: string;
  path?: string;
  contentLength?: number;
  allowGuest?: boolean;
};

export type R2PresignResult =
  | {
      ok: true;
      status: 200;
      body: {
        uploadUrl: string;
        publicUrl: string;
        key: string;
        path: string;
        fullPath: string;
        bucket: string;
        expiresIn: number;
        headers: Record<string, string>;
      };
    }
  | { ok: false; status: number; body: { error: string } };

function sanitizeSegment(value: string): string {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

/**
 * Create a short-lived R2 PUT URL + public CDN URL.
 */
export async function createR2PresignedUpload(options: {
  env: R2PresignEnv;
  authorizationHeader?: string;
  body: R2PresignBody;
}): Promise<R2PresignResult> {
  const { env, body } = options;
  const accountId = env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucket = env.R2_BUCKET?.trim() || "wya-media";
  const endpoint =
    env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const publicBase = (
    env.R2_PUBLIC_BASE_URL?.trim() || "https://cdn.wya254.com"
  ).replace(/\/$/, "");

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return {
      ok: false,
      status: 503,
      body: { error: "R2 is not configured on the server" },
    };
  }

  const supabaseUrl =
    env.VITE_SUPABASE_URL?.trim() ||
    env.SUPABASE_URL?.trim() ||
    "https://nnlxxbuekqlaqamczwyi.supabase.co";
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY?.trim() ||
    env.SUPABASE_ANON_KEY?.trim() ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  const jwt = (options.authorizationHeader || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  let userId: string | null = null;
  if (jwt && anonKey) {
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase.auth.getUser(jwt);
    if (data.user) userId = data.user.id;
  }

  const legacyBucket = String(body.bucket ?? "").trim();
  const contentType = String(body.contentType ?? "application/octet-stream")
    .trim()
    .toLowerCase();
  const fileName = sanitizeSegment(String(body.fileName ?? "").trim());
  const folder = sanitizeSegment(String(body.folder ?? "").trim());
  const pathOverride = sanitizeSegment(String(body.path ?? "").trim());
  const contentLength = Number(body.contentLength ?? 0);
  const allowGuest = Boolean(body.allowGuest);

  if (!ALLOWED_BUCKETS.has(legacyBucket)) {
    return { ok: false, status: 400, body: { error: "Bucket not allowed" } };
  }

  if (!fileName && !pathOverride) {
    return { ok: false, status: 400, body: { error: "fileName is required" } };
  }

  if (
    contentLength > 0 &&
    (!Number.isFinite(contentLength) || contentLength > MAX_BYTES)
  ) {
    return { ok: false, status: 400, body: { error: "File too large" } };
  }

  if (!userId) {
    const guestOk =
      allowGuest &&
      legacyBucket === "event-images" &&
      (pathOverride.startsWith("proposals/guest/") ||
        folder.startsWith("proposals/guest"));
    if (!guestOk) {
      return { ok: false, status: 401, body: { error: "Unauthorized" } };
    }
  }

  const objectPath =
    pathOverride || [folder, fileName].filter(Boolean).join("/");
  const key = `${legacyBucket}/${objectPath}`;

  try {
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const expiresIn = 600;
    const url = new URL(`${endpoint}/${bucket}/${key}`);
    url.searchParams.set("X-Amz-Expires", String(expiresIn));

    const signed = await aws.sign(
      new Request(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }),
      { aws: { signQuery: true } },
    );

    return {
      ok: true,
      status: 200,
      body: {
        uploadUrl: signed.url,
        publicUrl: `${publicBase}/${key}`,
        key,
        path: objectPath,
        fullPath: key,
        bucket: legacyBucket,
        expiresIn,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      },
    };
  } catch (error) {
    console.error("r2-presign error", error);
    return {
      ok: false,
      status: 500,
      body: { error: "Failed to create upload URL" },
    };
  }
}
