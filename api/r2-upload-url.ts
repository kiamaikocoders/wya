/**
 * Vercel Serverless — create a short-lived R2 PUT URL + public CDN URL.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createR2PresignedUpload } from "../lib/r2-presign";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey",
  );
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

  const result = await createR2PresignedUpload({
    env: process.env,
    authorizationHeader: String(req.headers.authorization || ""),
    body: (req.body || {}) as Record<string, unknown>,
  });

  res.status(result.status).json(result.body);
}
