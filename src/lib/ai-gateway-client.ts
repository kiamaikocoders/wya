/**
 * Calls the server-side AI proxy (/api/ai). Never sends API keys from the browser.
 */

import { formatAiResponseForDisplay } from "@/lib/ai-plain-text";

const CHAT_TIMEOUT_MS = 90_000;

/** Optional: full origin of the app that hosts /api/ai (e.g. https://myapp.vercel.app) when the SPA is served from another host. */
function chatEndpoint(): string {
  const proxyBase = import.meta.env.VITE_AI_PROXY_BASE_URL as string | undefined;
  if (proxyBase?.trim()) {
    const base = proxyBase.replace(/\/$/, "");
    return `${base}/api/ai`;
  }

  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return "/api/ai";
  return `${base.replace(/\/$/, "")}/api/ai`;
}

export async function callAiChat(options: {
  system?: string;
  user: string;
  maxTokens?: number;
  /** Skip plain-text formatting (e.g. when the model must return JSON). */
  preserveRaw?: boolean;
}): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (options.system?.trim()) {
    messages.push({ role: "system", content: options.system.trim() });
  }
  messages.push({ role: "user", content: options.user });

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(chatEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        max_tokens: options.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    globalThis.clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`AI request timed out after ${CHAT_TIMEOUT_MS / 1000}s`);
    }
    throw e instanceof Error ? e : new Error("Network error calling AI proxy");
  }
  globalThis.clearTimeout(timeoutId);

  const rawText = await res.text();
  let payload: { text?: string; error?: string; detail?: string };
  try {
    payload = JSON.parse(rawText) as typeof payload;
  } catch {
    const preview = rawText.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(
      res.ok
        ? `AI proxy returned non-JSON (${preview || "empty body"})`
        : `AI proxy error ${res.status}: ${preview || res.statusText}`
    );
  }

  if (!res.ok) {
    const hint = [payload.error, payload.detail].filter(Boolean).join(" — ");
    throw new Error(hint || `AI request failed (${res.status})`);
  }

  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new Error(payload.error || "Empty AI response");
  }

  const raw = payload.text;
  if (options.preserveRaw) {
    return raw;
  }
  return formatAiResponseForDisplay(raw);
}
