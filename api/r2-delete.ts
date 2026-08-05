/**
 * Vercel Serverless — delete an R2 object (auth + ownership/admin check).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteR2Object } from "../lib/r2-delete";

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

  const result = await deleteR2Object({
    env: process.env,
    authorizationHeader: String(req.headers.authorization || ""),
    body: (req.body || {}) as {
      url?: string;
      key?: string;
      bucket?: string;
      path?: string;
    },
  });

  res.status(result.status).json(result.body);
}
