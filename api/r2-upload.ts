/**
 * Vercel Serverless — upload a file to R2 via the server (same-origin).
 * Used when browser PUT to the R2 signed URL fails (CORS / network "Failed to fetch").
 * Self-contained (same pattern as api/r2-upload-url.ts) for reliable Vercel bundling.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4.5mb",
    },
  },
};

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

/** Keep under Vercel body limit after base64 (~4.5MB JSON ≈ ~3.3MB binary). */
const MAX_BYTES = 3 * 1024 * 1024;

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

async function putObjectToR2(options: {
  key: string;
  contentType: string;
  body: Buffer;
}): Promise<{ publicUrl: string; key: string }> {
  const { key, contentType, body } = options;
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucket = process.env.R2_BUCKET?.trim() || "wya-media";
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const publicBase = (
    process.env.R2_PUBLIC_BASE_URL?.trim() || "https://cdn.wya254.com"
  ).replace(/\/$/, "");

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 is not configured on the server");
  }
  if (accessKeyId.length !== 32) {
    throw new Error(
      `R2_ACCESS_KEY_ID has length ${accessKeyId.length}, should be 32 — check Vercel env (value may be truncated)`,
    );
  }

  const aws = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const url = `${endpoint}/${bucket}/${key}`;
  const signed = await aws.sign(
    new Request(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body,
    }),
  );

  const putRes = await fetch(signed);
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new Error(
      `R2 put failed (${putRes.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return {
    key,
    publicUrl: `${publicBase}/${key}`,
  };
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
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim() ||
      "https://nnlxxbuekqlaqamczwyi.supabase.co";
    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHh4YnVla3FsYXFhbWN6d3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDUzNTksImV4cCI6MjA2MDU4MTM1OX0.SYi79uRnDb-R-n5sMkMmbf4gvRmN9aj_W52vL58LfrI";

    const authHeader = String(req.headers.authorization || "");
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      res.status(401).json({ error: "Unauthorized — sign in required to upload" });
      return;
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(jwt);
    if (error || !data.user) {
      res.status(401).json({
        error: "Invalid or expired session — sign in again and retry",
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const legacyBucket = String(body.bucket ?? "").trim();
    const contentType = String(body.contentType ?? "application/octet-stream")
      .trim()
      .toLowerCase();
    const fileName = sanitizeSegment(String(body.fileName ?? "").trim());
    const folder = sanitizeSegment(String(body.folder ?? "").trim());
    const pathOverride = sanitizeSegment(String(body.path ?? "").trim());
    const dataBase64 = String(body.dataBase64 ?? "").trim();

    if (!ALLOWED_BUCKETS.has(legacyBucket)) {
      res.status(400).json({ error: "Bucket not allowed" });
      return;
    }
    if (!fileName && !pathOverride) {
      res.status(400).json({ error: "fileName is required" });
      return;
    }
    if (!dataBase64) {
      res.status(400).json({ error: "dataBase64 is required" });
      return;
    }

    const objectPath =
      pathOverride || [folder, fileName].filter(Boolean).join("/");
    const key = `${legacyBucket}/${objectPath}`;

    const buffer = Buffer.from(dataBase64, "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) {
      res.status(400).json({
        error: `File must be between 1 byte and ${MAX_BYTES / (1024 * 1024)}MB for server upload`,
      });
      return;
    }

    const put = await putObjectToR2({
      key,
      contentType,
      body: buffer,
    });

    res.status(200).json({
      publicUrl: put.publicUrl,
      key: put.key,
      path: objectPath,
      fullPath: put.key,
      bucket: legacyBucket,
    });
  } catch (error) {
    console.error("r2-upload error", error);
    res.status(500).json({
      error: "Failed to upload file",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
