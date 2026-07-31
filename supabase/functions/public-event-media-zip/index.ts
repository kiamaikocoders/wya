/**
 * Public (unguessable token): builds a zip of event media for organizers / shared viewers.
 *
 * CORS: same ALLOWED_ORIGINS secret as public-event-media-gallery.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const MAX_FILES = 80;
const FETCH_CONCURRENCY = 6;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
});

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function inferMediaTypeFromUrl(url: string): "image" | "video" {
  const base = url.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(mp4|webm|mov|m4v|ogv)(\b|$)/.test(base)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\b|$)/.test(base)) return "image";
  if (base.includes("video") && !base.includes("preview")) return "video";
  return "image";
}

function normalizeStoryMediaType(raw: string | null | undefined, url: string): "image" | "video" {
  if (raw === "video" || raw === "image") return raw;
  return inferMediaTypeFromUrl(url);
}

function isMissingModerationColumn(err: { message?: string } | null): boolean {
  const m = err?.message ?? "";
  return m.includes("moderation_status") && (m.includes("does not exist") || m.includes("schema cache"));
}

function extFromUrl(url: string, mediaType: "image" | "video"): string {
  const base = url.split("?")[0] ?? "";
  const m = base.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (m) return m[1].toLowerCase();
  return mediaType === "video" ? "mp4" : "jpg";
}

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[^\w.\-()+\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "media";
}

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "event-media"
  );
}

type MediaEntry = {
  compositeId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  label: string;
  source: string;
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim() ?? "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const tokenHash = await sha256Hex(token);
    const nowIso = new Date().toISOString();

    const { data: link, error: linkErr } = await supabase
      .from("event_media_share_links")
      .select("id, event_id, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (linkErr || !link || link.revoked_at || link.expires_at < nowIso) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventId = link.event_id as number;

    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .maybeSingle();

    if (eventErr || !eventRow) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let storiesRes = await supabase
      .from("stories")
      .select("id, media_url, media_type, caption, content, created_at")
      .eq("event_id", eventId)
      .neq("moderation_status", "archived")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (storiesRes.error && isMissingModerationColumn(storiesRes.error)) {
      storiesRes = await supabase
        .from("stories")
        .select("id, media_url, media_type, caption, content, created_at")
        .eq("event_id", eventId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });
    }

    let forumRes = await supabase
      .from("forum_posts")
      .select("id, media_url, title, created_at")
      .eq("event_id", eventId)
      .neq("moderation_status", "archived")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (forumRes.error && isMissingModerationColumn(forumRes.error)) {
      forumRes = await supabase
        .from("forum_posts")
        .select("id, media_url, title, created_at")
        .eq("event_id", eventId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });
    }

    if (storiesRes.error || forumRes.error) {
      console.error("public-event-media-zip", storiesRes.error, forumRes.error);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entries: MediaEntry[] = [];

    for (const s of storiesRes.data ?? []) {
      const mediaUrl = String(s.media_url ?? "").trim();
      if (!mediaUrl) continue;
      const mediaType = normalizeStoryMediaType(s.media_type as string | undefined, mediaUrl);
      entries.push({
        compositeId: `story-${s.id}`,
        mediaUrl,
        mediaType,
        label: String(s.caption || s.content || "Story").slice(0, 120),
        source: "story",
      });
    }

    for (const f of forumRes.data ?? []) {
      const mediaUrl = String(f.media_url ?? "").trim();
      if (!mediaUrl) continue;
      entries.push({
        compositeId: `forum-${f.id}`,
        mediaUrl,
        mediaType: inferMediaTypeFromUrl(mediaUrl),
        label: String(f.title || "Forum post").slice(0, 120),
        source: "forum",
      });
    }

    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: "No media to download" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limited = entries.slice(0, MAX_FILES);
    const zip = new JSZip();
    zip.file(
      "README.txt",
      [
        `WYA shared event media — ${eventRow.title}`,
        "",
        "Attendees opted in at signup. Do not republish outside WYA without permission.",
        `Files included: up to ${MAX_FILES} (newest first).`,
        "",
      ].join("\n")
    );

    const fetched = await mapPool(limited, FETCH_CONCURRENCY, async (entry, index) => {
      try {
        const res = await fetch(entry.mediaUrl);
        if (!res.ok) return null;
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength === 0 || buf.byteLength > MAX_FILE_BYTES) return null;
        const ext = extFromUrl(entry.mediaUrl, entry.mediaType);
        const base = `${String(index + 1).padStart(2, "0")}_${entry.source}_${sanitizeFilename(entry.label)}`;
        return { base, ext, buf };
      } catch (e) {
        console.error("public-event-media-zip fetch", entry.compositeId, e);
        return null;
      }
    });

    const usedNames = new Set<string>();
    let added = 0;
    let failed = 0;
    for (const item of fetched) {
      if (!item) {
        failed += 1;
        continue;
      }
      let name = `${item.base}.${item.ext}`;
      let n = 2;
      while (usedNames.has(name)) {
        name = `${item.base}_${n}.${item.ext}`;
        n += 1;
      }
      usedNames.add(name);
      zip.file(name, item.buf);
      added += 1;
    }

    if (added === 0) {
      return new Response(JSON.stringify({ error: "Could not fetch media files" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (failed > 0) {
      zip.file(
        "DOWNLOAD_NOTES.txt",
        `${added} file(s) included. ${failed} file(s) could not be fetched.\n`
      );
    }

    const zipBytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = `wya-${slugifyTitle(String(eventRow.title))}-media.zip`;

    return new Response(zipBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("public-event-media-zip", e);
    return new Response(JSON.stringify({ error: "Could not build zip" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
