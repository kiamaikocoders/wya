// Process Ghost Actions Edge Function
// This function processes queued ghost actions with randomized timing
// Should be called via cron or webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS: ALLOWED_ORIGINS (comma-separated) for production/staging web origins.
// Local dev: http://localhost:* and http://127.0.0.1:* are allowed when ALLOW_LOCALHOST_CORS is not "false".
// Set ALLOW_LOCALHOST_CORS=false on the function if you must block browser calls from loopback only.
const isLocalHttpOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
};

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const fromEnv = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowLocal =
    (Deno.env.get("ALLOW_LOCALHOST_CORS") ?? "true").toLowerCase() !== "false";

  if (!requestOrigin) return null;
  if (fromEnv.includes(requestOrigin)) return requestOrigin;
  if (allowLocal && isLocalHttpOrigin(requestOrigin)) return requestOrigin;
  return null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin
    ? {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
      }
    : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
});

interface GhostAction {
  id: number;
  action_type: string;
  target_id: number | string | null; // Can be number (event_id) or string (user_id UUID)
  target_type: string;
  persona_group_id: number | null;
  ghost_user_ids: string[] | null;
  metadata: any;
}

/** Postgres unique violation / common duplicate wording */
function isDuplicateRowError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "23505") return true;
  const m = (err.message ?? "").toLowerCase();
  return m.includes("duplicate") || m.includes("unique constraint") || m.includes("already exists");
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsOrigin = getAllowedOrigin(requestOrigin);
  const corsHeaders = corsHeadersFor(corsOrigin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get service role client (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending actions (limit to 10 per execution to avoid timeouts)
    const { data: pendingActions, error: fetchError } = await supabase
      .from("ghost_action_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingActions || pendingActions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending actions", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let processed = 0;
    let failed = 0;

    // Process each action
    for (const action of pendingActions) {
      try {
        // Mark as processing
        await supabase.rpc("update_ghost_action_status", {
          p_queue_id: action.id,
          p_status: "processing",
        });

        // Get ghost users for this action
        let ghostUserIds: string[] = [];

        if (action.ghost_user_ids && action.ghost_user_ids.length > 0) {
          // Use specific users
          ghostUserIds = action.ghost_user_ids;
        } else if (action.persona_group_id) {
          // Get users from persona group
          const { data: personaGroup } = await supabase
            .from("ghost_persona_groups")
            .select("*")
            .eq("id", action.persona_group_id)
            .single();

          if (!personaGroup) {
            throw new Error(`Persona group ${action.persona_group_id} not found`);
          }

          // Get all ghost users (or filter by persona if you have a junction table)
          const { data: allGhostUsers } = await supabase
            .from("profiles")
            .select("id")
            .eq("is_ghost", true);

          ghostUserIds = allGhostUsers?.map((u) => u.id) || [];
        } else {
          // Get all ghost users
          const { data: allGhostUsers } = await supabase
            .from("profiles")
            .select("id")
            .eq("is_ghost", true);

          ghostUserIds = allGhostUsers?.map((u) => u.id) || [];
        }

        if (ghostUserIds.length === 0) {
          throw new Error("No ghost users found for action");
        }

        // Get persona group settings for randomization
        let personaGroup = null;
        if (action.persona_group_id) {
          const { data } = await supabase
            .from("ghost_persona_groups")
            .select("*")
            .eq("id", action.persona_group_id)
            .single();
          personaGroup = data;
        }

        const engagementRate = personaGroup?.engagement_rate || 0.85;
        const minDelay = personaGroup?.min_delay_seconds || 2;
        const maxDelay = personaGroup?.max_delay_seconds || 60;

        // Filter users based on engagement rate; ensure at least 1 participant when we have users
        // (otherwise Math.floor(1 * 0.85) = 0 → "All 0 attempts failed")
        const rawCount = Math.floor(ghostUserIds.length * engagementRate);
        const numParticipants = Math.min(
          ghostUserIds.length,
          Math.max(1, rawCount)
        );
        const shuffled = [...ghostUserIds].sort(() => Math.random() - 0.5);
        const participants = shuffled.slice(0, numParticipants);

        // Process actions with randomized delays
        let successCount = 0;
        let errorCount = 0;

        const batchMeta = action.metadata as {
          total_likes?: number;
          story_ids?: number[];
          prefer_media_first?: boolean;
        } | null;
        const isBatchLike =
          action.action_type === "like_story" &&
          batchMeta != null &&
          typeof batchMeta.total_likes === "number" &&
          !Number.isNaN(batchMeta.total_likes) &&
          batchMeta.total_likes >= 1;

        if (isBatchLike) {
          const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));

          const batchResult = await executeLikeStoryBatch(supabase, action, ghostUserIds);
          if (batchResult.inserted > 0) {
            successCount = 1;
            await supabase.rpc("log_ghost_action", {
              p_queue_id: action.id,
              p_ghost_user_id: ghostUserIds[0],
              p_action_type: action.action_type,
              p_target_id: action.target_id?.toString() || null,
              p_target_type: action.target_type,
              p_success: true,
              p_error_message: `Distributed ${batchResult.inserted} ghost like(s)${
                batchResult.capped ? " (capped by available ghost×story pairs)" : ""
              }`,
            });
          } else {
            errorCount = 1;
            await supabase.rpc("log_ghost_action", {
              p_queue_id: action.id,
              p_ghost_user_id: ghostUserIds[0],
              p_action_type: action.action_type,
              p_target_id: action.target_id?.toString() || null,
              p_target_type: action.target_type,
              p_success: false,
              p_error_message: batchResult.error || "No new likes applied",
            });
          }
        } else {
          for (const userId of participants) {
            try {
              const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
              await new Promise((resolve) => setTimeout(resolve, delay * 1000));

              const result = await executeGhostAction(
                supabase,
                userId,
                action,
                personaGroup
              );

              if (result.success) {
                successCount++;
                await supabase.rpc("log_ghost_action", {
                  p_queue_id: action.id,
                  p_ghost_user_id: userId,
                  p_action_type: action.action_type,
                  p_target_id: action.target_id?.toString() || null,
                  p_target_type: action.target_type,
                  p_success: true,
                });
              } else {
                errorCount++;
                await supabase.rpc("log_ghost_action", {
                  p_queue_id: action.id,
                  p_ghost_user_id: userId,
                  p_action_type: action.action_type,
                  p_target_id: action.target_id?.toString() || null,
                  p_target_type: action.target_type,
                  p_success: false,
                  p_error_message: result.error || "Unknown error",
                });
              }
            } catch (error: any) {
              errorCount++;
              console.error(`Error executing action for user ${userId}:`, error);
              await supabase.rpc("log_ghost_action", {
                p_queue_id: action.id,
                p_ghost_user_id: userId,
                p_action_type: action.action_type,
                p_target_id: action.target_id?.toString() || null,
                p_target_type: action.target_type,
                p_success: false,
                p_error_message: error.message,
              });
            }
          }
        }

        // Mark action as completed only if at least one action succeeded
        // If all actions failed, mark as failed instead
        if (successCount > 0) {
          await supabase.rpc("update_ghost_action_status", {
            p_queue_id: action.id,
            p_status: "completed",
          });
        } else {
          await supabase.rpc("update_ghost_action_status", {
            p_queue_id: action.id,
            p_status: "failed",
            p_error_message: `All ${errorCount} attempts failed`,
          });
        }

        processed++;
      } catch (error: any) {
        failed++;
        console.error(`Error processing action ${action.id}:`, error);
        await supabase.rpc("update_ghost_action_status", {
          p_queue_id: action.id,
          p_status: "failed",
          p_error_message: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Processing complete",
        processed,
        failed,
        total: pendingActions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("Error in process-ghost-actions:", err.message);
    return new Response(
      JSON.stringify({ error: "Processing failed. Please try again later." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Admin sets metadata.total_likes; optional story_ids and prefer_media_first.
 * Uses the full ghost pool (not engagement-sampled) for unique (ghost, story) pairs.
 */
async function executeLikeStoryBatch(
  supabase: any,
  action: GhostAction,
  ghostUserIds: string[],
): Promise<{ inserted: number; capped?: boolean; error?: string }> {
  const meta = (action.metadata || {}) as {
    total_likes?: number;
    story_ids?: number[];
    prefer_media_first?: boolean;
  };
  const totalTarget = Math.min(100000, Math.max(1, Math.floor(Number(meta.total_likes))));
  const preferMedia = Boolean(meta.prefer_media_first);

  if (!action.target_id) {
    return { inserted: 0, error: "Event ID required" };
  }
  const eventId =
    typeof action.target_id === "string"
      ? parseInt(action.target_id, 10)
      : action.target_id;
  if (isNaN(eventId)) {
    return { inserted: 0, error: "Invalid event ID" };
  }

  let storyIds: number[] = [];
  if (Array.isArray(meta.story_ids) && meta.story_ids.length > 0) {
    storyIds = meta.story_ids
      .map((x: unknown) => (typeof x === "number" ? x : parseInt(String(x), 10)))
      .filter((n: number) => !isNaN(n));

    const { data: belong, error: belongErr } = await supabase
      .from("stories")
      .select("id")
      .eq("event_id", eventId)
      .in("id", storyIds);
    if (belongErr) {
      return { inserted: 0, error: belongErr.message };
    }
    const ok = new Set((belong || []).map((r: { id: number }) => r.id));
    storyIds = storyIds.filter((id) => ok.has(id));
    if (storyIds.length === 0) {
      return { inserted: 0, error: "No valid stories for this event (check story selection)" };
    }
  } else {
    const { data: rows, error: stErr } = await supabase
      .from("stories")
      .select("id, media_url")
      .eq("event_id", eventId);
    if (stErr) {
      return { inserted: 0, error: stErr.message };
    }
    const list = rows || [];
    if (list.length === 0) {
      return { inserted: 0, error: "No stories for this event" };
    }
    if (preferMedia) {
      list.sort((a: { media_url?: string | null }, b: { media_url?: string | null }) => {
        const am = a.media_url ? 1 : 0;
        const bm = b.media_url ? 1 : 0;
        return bm - am;
      });
    }
    storyIds = list.map((r: { id: number }) => r.id);
  }

  if (preferMedia && meta.story_ids && meta.story_ids.length > 0) {
    const { data: rows } = await supabase
      .from("stories")
      .select("id, media_url")
      .in("id", storyIds);
    const map = new Map(
      (rows || []).map((r: { id: number; media_url?: string | null }) => [r.id, r.media_url]),
    );
    storyIds = [...storyIds].sort((a, b) => {
      const am = map.get(a) ? 1 : 0;
      const bm = map.get(b) ? 1 : 0;
      return bm - am;
    });
  }

  const { data: existing, error: exErr } = await supabase
    .from("story_likes")
    .select("story_id, user_id")
    .in("story_id", storyIds)
    .in("user_id", ghostUserIds);
  if (exErr) {
    return { inserted: 0, error: exErr.message };
  }

  const taken = new Set(
    (existing || []).map(
      (r: { story_id: number; user_id: string }) => `${r.user_id}:${r.story_id}`,
    ),
  );

  const pairs: { story_id: number; user_id: string }[] = [];
  for (const sid of storyIds) {
    for (const gid of ghostUserIds) {
      const key = `${gid}:${sid}`;
      if (!taken.has(key)) {
        pairs.push({ story_id: sid, user_id: gid });
      }
    }
  }

  if (!preferMedia) {
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pairs[i]!;
      pairs[i] = pairs[j]!;
      pairs[j] = t;
    }
  }

  const maxPossible = pairs.length;
  const toApply = pairs.slice(0, totalTarget);
  const capped = totalTarget > maxPossible;

  let inserted = 0;
  for (const p of toApply) {
    const { error: insErr } = await supabase.from("story_likes").insert({
      story_id: p.story_id,
      user_id: p.user_id,
    });
    if (insErr) {
      if (isDuplicateRowError(insErr)) continue;
      console.error("like batch insert", insErr);
      continue;
    }
    const { error: rpcErr } = await supabase.rpc("increment_story_likes_count", {
      p_story_id: p.story_id,
    });
    if (rpcErr) console.error("increment_story_likes_count", rpcErr);
    else inserted++;
  }

  return {
    inserted,
    capped: capped && inserted > 0,
    error: inserted === 0 ? "No new likes could be added (all pairs may already exist)" : undefined,
  };
}

/**
 * Execute a single ghost action
 */
async function executeGhostAction(
  supabase: any,
  ghostUserId: string,
  action: GhostAction,
  personaGroup: any
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action.action_type) {
      case "like_story":
        // Target ID is now an event_id, not a story_id
        // Randomly select stories from the event and like them
        if (!action.target_id) throw new Error("Event ID required");
        
        // Convert target_id to number (it's stored as TEXT but represents an integer)
        const eventId = typeof action.target_id === 'string' 
          ? parseInt(action.target_id) 
          : action.target_id;
        
        if (isNaN(eventId)) throw new Error("Invalid event ID");
        
        // Get all stories for this event
        const { data: eventStories, error: storiesError } = await supabase
          .from("stories")
          .select("id")
          .eq("event_id", eventId);
        
        if (storiesError) throw storiesError;
        
        if (!eventStories || eventStories.length === 0) {
          console.log(`No stories found for event ${eventId}`);
          break; // No stories to like, but not an error
        }
        
        // Randomly select 1-3 stories to like (to avoid looking too bot-like)
        const numStoriesToLike = Math.min(
          Math.floor(Math.random() * 3) + 1,
          eventStories.length
        );
        
        // Shuffle and take random stories
        const shuffled = [...eventStories].sort(() => Math.random() - 0.5);
        const storiesToLike = shuffled.slice(0, numStoriesToLike);
        
        // Like each selected story
        for (const story of storiesToLike) {
          const { error: likeStoryError } = await supabase
            .from("story_likes")
            .insert({
              story_id: story.id,
              user_id: ghostUserId,
            });

          if (likeStoryError) {
            if (isDuplicateRowError(likeStoryError)) continue;
            console.error(`Error liking story ${story.id}:`, likeStoryError);
            continue;
          }

          await supabase.rpc("increment_story_likes_count", {
            p_story_id: story.id,
          });
        }
        break;

      case "create_story":
        // Use provided content if it exists (even if empty), otherwise use default
        const storyContent = action.metadata?.content !== undefined 
          ? action.metadata.content 
          : "Great event! 🎉";
        const storyMedia = action.metadata?.media_url || null;
        
        // Determine media type from URL or default to 'image'
        let mediaType = "image";
        if (storyMedia) {
          // Check if it's a video based on file extension
          const videoExtensions = ['.mp4', '.webm', '.mov', '.quicktime'];
          const isVideo = videoExtensions.some(ext => storyMedia.toLowerCase().includes(ext));
          mediaType = isVideo ? "video" : "image";
        }
        
        // Convert target_id to event_id; invalid numbers become null (Community / ungrouped Discover).
        let storyEventId: number | null = null;
        if (action.target_id != null && String(action.target_id).trim() !== "") {
          const n =
            typeof action.target_id === "string"
              ? parseInt(action.target_id, 10)
              : Number(action.target_id);
          storyEventId = Number.isFinite(n) ? n : null;
        }

        const { error: createStoryError } = await supabase
          .from("stories")
          .insert({
            user_id: ghostUserId,
            event_id: storyEventId,
            content: storyContent,
            caption: storyContent,
            media_url: storyMedia,
            media_type: mediaType, // Always set to 'image' or 'video', never null
            // Default DB column is 'pending'; feeds only show 'verified' (see story-service).
            moderation_status: "verified",
          });
        if (createStoryError) {
          console.error("Error creating story:", createStoryError);
          throw createStoryError;
        }
        break;

      case "follow_user":
        if (!action.target_id) throw new Error("Target ID required");
        // target_id is TEXT in queue (UUID string for real users)
        const targetUserId = String(
          typeof action.target_id === "number"
            ? action.target_id
            : action.target_id,
        ).trim();

        if (!targetUserId) throw new Error("Invalid target user id");

        const followerId = ghostUserId.toLowerCase();
        const followingId = targetUserId.toLowerCase();

        if (followingId === followerId) {
          console.log(`follow_user: skip self-follow ghost=${followerId}`);
          break;
        }

        const { data: existingFollow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", followerId)
          .eq("following_id", followingId)
          .maybeSingle();

        if (existingFollow) break;

        const { error: followError } = await supabase.from("follows").insert({
          follower_id: followerId,
          following_id: followingId,
        });

        if (followError && !isDuplicateRowError(followError)) {
          console.error("follow_user insert failed:", followError);
          throw followError;
        }
        break;

      default:
        return { success: false, error: `Unknown action type: ${action.action_type}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
