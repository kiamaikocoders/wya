/**
 * Vercel Serverless Function — proxies chat to Vercel AI Gateway.
 * Uses @vercel/node handler shape (reliable on Vite/static + Vercel).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

/** Vercel AI Gateway model id (override with VERCEL_AI_GATEWAY_MODEL). */
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

  const apiKey = process.env.VERCEL_AI_API_KEY?.trim();
  if (!apiKey) {
    res
      .status(503)
      .json({ error: "AI gateway not configured (missing VERCEL_AI_API_KEY on the server)" });
    return;
  }

  const parsed = req.body as { messages?: unknown; max_tokens?: number } | null | undefined;
  if (!parsed || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const model = process.env.VERCEL_AI_GATEWAY_MODEL?.trim() || DEFAULT_MODEL;

  let upstream: Response;
  try {
    upstream = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: parsed.messages,
        max_tokens: parsed.max_tokens ?? 2048,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream fetch failed";
    res.status(502).json({ error: msg });
    return;
  }

  const raw = await upstream.text();
  let data: {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    res.status(502).json({
      error: "Invalid JSON from AI gateway",
      detail: raw.slice(0, 400),
    });
    return;
  }

  if (!upstream.ok) {
    res.status(upstream.status).json({
      error: data.error?.message || upstream.statusText || "Gateway error",
    });
    return;
  }

  const text = data.choices?.[0]?.message?.content ?? "";
  if (typeof text !== "string" || !text.trim()) {
    res.status(502).json({
      error: "Empty model response",
      detail: raw.slice(0, 400),
    });
    return;
  }

  res.status(200).json({ text });
}
