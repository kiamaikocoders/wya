/**
 * Vercel Serverless — create a short-lived R2 PUT URL + public CDN URL.
 * Self-contained (same pattern as api/ai.ts) for reliable Vercel bundling.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const ALLOWED_BUCKETS = new Set([
  "media",
  "stories",
  "stories-media",
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

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey",
  );
}

function sanitizeSegment(value: string): string {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const accountId = process.env.R2_ACCOUNT_ID?.trim() || "";
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
    const bucket = process.env.R2_BUCKET?.trim() || "wya-media";
    const endpoint =
      process.env.R2_ENDPOINT?.trim() ||
      (accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : "");
    const publicBase = (
      process.env.R2_PUBLIC_BASE_URL?.trim() || "https://cdn.wya254.com"
    ).replace(/\/$/, "");

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      res.status(503).json({ error: "R2 is not configured on the server" });
      return;
    }
    if (accessKeyId.length !== 32) {
      res.status(503).json({
        error: `R2_ACCESS_KEY_ID has length ${accessKeyId.length}, should be 32 — fix the Vercel env var (it looks truncated)`,
      });
      return;
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim() ||
      "https://nnlxxbuekqlaqamczwyi.supabase.co";
    // Prefer env; fall back to the same public anon key as the SPA client.
    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHh4YnVla3FsYXFhbWN6d3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDUzNTksImV4cCI6MjA2MDU4MTM1OX0.SYi79uRnDb-R-n5sMkMmbf4gvRmN9aj_W52vL58LfrI";

    const authHeader = String(req.headers.authorization || "");
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    let userId: string | null = null;
    if (jwt) {
      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.getUser(jwt);
      if (data.user) userId = data.user.id;
      else if (error) {
        console.warn("r2-upload-url auth.getUser failed", error.message);
      }
    }

    const body = (req.body || {}) as Record<string, unknown>;
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
      res.status(400).json({ error: "Bucket not allowed" });
      return;
    }

    if (!fileName && !pathOverride) {
      res.status(400).json({ error: "fileName is required" });
      return;
    }

    if (
      contentLength > 0 &&
      (!Number.isFinite(contentLength) || contentLength > MAX_BYTES)
    ) {
      res.status(400).json({ error: "File too large" });
      return;
    }

    if (!userId) {
      const guestOk =
        allowGuest &&
        legacyBucket === "event-images" &&
        (pathOverride.startsWith("proposals/guest/") ||
          folder.startsWith("proposals/guest"));
      if (!guestOk) {
        res.status(401).json({
          error: jwt
            ? "Invalid or expired session — sign in again and retry"
            : "Unauthorized — sign in required to upload",
        });
        return;
      }
    }

    const objectPath =
      pathOverride || [folder, fileName].filter(Boolean).join("/");
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
        // Only Content-Type — Cache-Control in the signature often breaks browser CORS preflights.
        headers: {
          "Content-Type": contentType,
        },
      }),
      { aws: { signQuery: true } },
    );

    res.status(200).json({
      uploadUrl: signed.url,
      publicUrl: `${publicBase}/${key}`,
      key,
      path: objectPath,
      fullPath: key,
      bucket: legacyBucket,
      expiresIn,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("r2-upload-url error", error);
    res.status(500).json({
      error: "Failed to create upload URL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
