import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

export type R2DeleteEnv = {
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

export type StorageObjectRef = {
  backend: "r2" | "supabase";
  /** Legacy logical bucket (avatars, media, …). */
  bucket: string;
  /** Object path under the logical bucket. */
  path: string;
  /** Full R2 object key: `{bucket}/{path}`. */
  key: string;
};

const DEFAULT_CDN = "https://cdn.wya254.com";

/**
 * Parse a public media URL into a storage reference (R2 CDN or Supabase Storage).
 */
export function parseStoragePublicUrl(
  url: string,
  publicBaseUrl?: string,
): StorageObjectRef | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const supabaseMarker = "/storage/v1/object/public/";
    const supabaseIndex = parsed.pathname.indexOf(supabaseMarker);
    if (supabaseIndex !== -1) {
      const remainder = decodeURIComponent(
        parsed.pathname.slice(supabaseIndex + supabaseMarker.length),
      );
      const slashIndex = remainder.indexOf("/");
      if (slashIndex <= 0) return null;
      const bucket = remainder.slice(0, slashIndex);
      const path = remainder.slice(slashIndex + 1);
      if (!bucket || !path) return null;
      return { backend: "supabase", bucket, path, key: `${bucket}/${path}` };
    }

    const cdnBase = (publicBaseUrl?.trim() || DEFAULT_CDN).replace(/\/$/, "");
    const cdnHost = new URL(cdnBase).host;
    if (parsed.host === cdnHost || parsed.host === "cdn.wya254.com") {
      const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
      const slashIndex = key.indexOf("/");
      if (slashIndex <= 0) return null;
      return {
        backend: "r2",
        bucket: key.slice(0, slashIndex),
        path: key.slice(slashIndex + 1),
        key,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function canDeleteKey(userId: string, isAdmin: boolean, key: string): boolean {
  if (isAdmin) return true;
  const segments = key.split("/").filter(Boolean);
  // Standard layout: {bucket}/{userId}/...
  if (segments.length >= 2 && segments[1] === userId) return true;
  return segments.includes(userId);
}

export type R2DeleteResult =
  | { ok: true; status: 200; body: { deleted: true; backend: "r2"; key: string } }
  | { ok: false; status: number; body: { error: string } };

/**
 * Delete an R2 object after verifying the caller owns it or is an admin.
 */
export async function deleteR2Object(options: {
  env: R2DeleteEnv;
  authorizationHeader?: string;
  body: { url?: string; key?: string; bucket?: string; path?: string };
}): Promise<R2DeleteResult> {
  const { env, body } = options;
  const accountId = env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucket = env.R2_BUCKET?.trim() || "wya-media";
  const endpoint =
    env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const publicBase = (
    env.R2_PUBLIC_BASE_URL?.trim() || DEFAULT_CDN
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

  if (!jwt || !anonKey) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData } = await supabase.auth.getUser(jwt);
  const userId = userData.user?.id;
  if (!userId) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  let key = "";
  if (body.url?.trim()) {
    const ref = parseStoragePublicUrl(body.url, publicBase);
    if (!ref) {
      return { ok: false, status: 400, body: { error: "Unrecognized media URL" } };
    }
    if (ref.backend !== "r2") {
      return {
        ok: false,
        status: 400,
        body: { error: "Not an R2 URL — use Supabase Storage remove for legacy objects" },
      };
    }
    key = ref.key;
  } else if (body.key?.trim()) {
    key = body.key.trim().replace(/^\/+/, "");
  } else if (body.bucket?.trim() && body.path?.trim()) {
    key = `${body.bucket.trim()}/${body.path.trim().replace(/^\/+/, "")}`;
  }

  if (!key || key.includes("..") || key.includes("//")) {
    return { ok: false, status: 400, body: { error: "Invalid object key" } };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  if (!canDeleteKey(userId, isAdmin, key)) {
    return { ok: false, status: 403, body: { error: "Forbidden" } };
  }

  try {
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const deleteUrl = `${endpoint}/${bucket}/${key}`;
    const signed = await aws.sign(
      new Request(deleteUrl, { method: "DELETE" }),
      { aws: { signQuery: true } },
    );

    const deleteRes = await fetch(signed.url, { method: "DELETE" });
    // 404 = already gone — treat as success for idempotent cleanup
    if (!deleteRes.ok && deleteRes.status !== 404) {
      const detail = await deleteRes.text().catch(() => "");
      return {
        ok: false,
        status: 502,
        body: {
          error: `R2 delete failed (${deleteRes.status})${
            detail ? `: ${detail.slice(0, 200)}` : ""
          }`,
        },
      };
    }

    return {
      ok: true,
      status: 200,
      body: { deleted: true, backend: "r2", key },
    };
  } catch (error) {
    console.error("r2-delete error", error);
    return {
      ok: false,
      status: 500,
      body: { error: "Failed to delete R2 object" },
    };
  }
}
