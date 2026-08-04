/**
 * Authenticated (or guest-proposal) helper: return a presigned R2 PUT URL + public CDN URL.
 * Secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 * R2_ENDPOINT, R2_PUBLIC_BASE_URL, ALLOWED_ORIGINS.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

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

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

function sanitizeSegment(value: string): string {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const accountId = Deno.env.get("R2_ACCOUNT_ID") ?? "";
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
    const bucket = Deno.env.get("R2_BUCKET") ?? "wya-media";
    const endpoint =
      Deno.env.get("R2_ENDPOINT") ??
      (accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : "");
    const publicBase = (Deno.env.get("R2_PUBLIC_BASE_URL") ?? "").replace(
      /\/$/,
      "",
    );

    if (!accessKeyId || !secretAccessKey || !endpoint || !publicBase) {
      return new Response(
        JSON.stringify({ error: "R2 is not configured on this project" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    let userId: string | null = null;
    if (jwt) {
      const { data, error } = await supabase.auth.getUser(jwt);
      if (!error && data.user) userId = data.user.id;
    }

    const body = await req.json().catch(() => ({}));
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
      return new Response(JSON.stringify({ error: "Bucket not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileName && !pathOverride) {
      return new Response(JSON.stringify({ error: "fileName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      contentLength > 0 &&
      (!Number.isFinite(contentLength) || contentLength > MAX_BYTES)
    ) {
      return new Response(JSON.stringify({ error: "File too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      const guestOk =
        allowGuest &&
        legacyBucket === "event-images" &&
        (pathOverride.startsWith("proposals/guest/") ||
          folder.startsWith("proposals/guest"));
      if (!guestOk) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const objectPath =
      pathOverride ||
      [folder, fileName].filter(Boolean).join("/");
    const key = `${legacyBucket}/${objectPath}`;

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

    const publicUrl = `${publicBase}/${key}`;

    return new Response(
      JSON.stringify({
        uploadUrl: signed.url,
        publicUrl,
        key,
        path: objectPath,
        fullPath: key,
        bucket: legacyBucket,
        expiresIn,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("create-r2-upload-url error", error);
    return new Response(JSON.stringify({ error: "Failed to create upload URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
