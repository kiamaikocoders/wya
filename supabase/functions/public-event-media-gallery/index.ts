/**
 * Public (unguessable token): returns event media gallery JSON for organizers / shared viewers.
 *
 * CORS: set project secret ALLOWED_ORIGINS to every origin where /share/event-media/* is served
 * (production, previews, localhost) — same comma-separated list as other functions.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (linkErr || !link) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (link.revoked_at) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (link.expires_at < nowIso) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventId = link.event_id as number;

    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id, title, date, location, category, image_url")
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
      .select(
        "id, user_id, event_id, media_url, media_type, caption, content, created_at, likes_count, comments_count"
      )
      .eq("event_id", eventId)
      .neq("moderation_status", "archived")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (storiesRes.error && isMissingModerationColumn(storiesRes.error)) {
      storiesRes = await supabase
        .from("stories")
        .select(
          "id, user_id, event_id, media_url, media_type, caption, content, created_at, likes_count, comments_count"
        )
        .eq("event_id", eventId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });
    }

    let forumRes = await supabase
      .from("forum_posts")
      .select("id, user_id, event_id, media_url, title, created_at, likes_count, comments_count")
      .eq("event_id", eventId)
      .neq("moderation_status", "archived")
      .not("media_url", "is", null)
      .order("created_at", { ascending: false });

    if (forumRes.error && isMissingModerationColumn(forumRes.error)) {
      forumRes = await supabase
        .from("forum_posts")
        .select("id, user_id, event_id, media_url, title, created_at, likes_count, comments_count")
        .eq("event_id", eventId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });
    }

    if (storiesRes.error || forumRes.error) {
      console.error("public-event-media-gallery", storiesRes.error, forumRes.error);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storyRows = (storiesRes.data ?? []).filter((s: { media_url?: string }) =>
      s.media_url && String(s.media_url).trim()
    );
    const forumRows = (forumRes.data ?? []).filter((f: { media_url?: string }) =>
      f.media_url && String(f.media_url).trim()
    );

    const userIds = [
      ...storyRows.map((s: { user_id: string }) => s.user_id),
      ...forumRows.map((f: { user_id: string }) => f.user_id),
    ];
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

    type ProfileInfo = { name: string; avatarUrl: string | null };
    const profileMap: Map<string, ProfileInfo> = new Map();
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", uniqueUserIds);
      for (const p of profiles ?? []) {
        const name = (p.full_name?.trim() || p.username?.trim() || "Attendee") as string;
        profileMap.set(p.id as string, {
          name,
          avatarUrl: (p.avatar_url as string | null) ?? null,
        });
      }
    }

    const items: Record<string, unknown>[] = [];
    const contribCounts = new Map<string, number>();

    for (const s of storyRows) {
      const u = String(s.media_url).trim();
      const mediaType = normalizeStoryMediaType(s.media_type as string | undefined, u);
      const profile = profileMap.get(s.user_id);
      contribCounts.set(s.user_id, (contribCounts.get(s.user_id) || 0) + 1);
      items.push({
        compositeId: `story-${s.id}`,
        source: "story",
        sourceId: s.id,
        eventId: s.event_id,
        userId: s.user_id,
        contributorName: profile?.name ?? "Attendee",
        contributorAvatarUrl: profile?.avatarUrl ?? null,
        mediaUrl: u,
        mediaType,
        label: String(s.caption || s.content || "Story").slice(0, 160),
        createdAt: s.created_at ?? new Date().toISOString(),
        likesCount: s.likes_count,
        commentsCount: s.comments_count,
      });
    }

    for (const f of forumRows) {
      const u = String(f.media_url).trim();
      const profile = profileMap.get(f.user_id);
      contribCounts.set(f.user_id, (contribCounts.get(f.user_id) || 0) + 1);
      items.push({
        compositeId: `forum-${f.id}`,
        source: "forum_post",
        sourceId: f.id,
        eventId: f.event_id,
        userId: f.user_id,
        contributorName: profile?.name ?? "Attendee",
        contributorAvatarUrl: profile?.avatarUrl ?? null,
        mediaUrl: u,
        mediaType: inferMediaTypeFromUrl(u),
        label: String(f.title || "Forum post").slice(0, 160),
        createdAt: f.created_at ?? new Date().toISOString(),
        likesCount: f.likes_count,
        commentsCount: f.comments_count,
      });
    }

    items.sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );

    const photos = items.filter((i) => i.mediaType === "image").length;
    const videos = items.filter((i) => i.mediaType === "video").length;

    const topContributors = [...contribCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, postCount]) => {
        const profile = profileMap.get(userId);
        return {
          userId,
          name: profile?.name ?? "Attendee",
          avatarUrl: profile?.avatarUrl ?? null,
          postCount,
        };
      });

    const heroUrl =
      (eventRow.image_url as string | null) ||
      (items.find((i) => i.mediaType === "image")?.mediaUrl as string | undefined) ||
      null;

    return new Response(
      JSON.stringify({
        event: {
          id: eventRow.id,
          title: eventRow.title,
          date: eventRow.date,
          location: eventRow.location ?? null,
          category: eventRow.category ?? null,
          imageUrl: eventRow.image_url ?? null,
        },
        expiresAt: link.expires_at,
        heroUrl,
        topContributors,
        summary: {
          total: items.length,
          photos,
          videos,
          items,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("public-event-media-gallery", e);
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
