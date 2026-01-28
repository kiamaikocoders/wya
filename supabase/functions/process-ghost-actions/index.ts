// Process Ghost Actions Edge Function
// This function processes queued ghost actions with randomized timing
// Should be called via cron or webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface GhostAction {
  id: number;
  action_type: string;
  target_id: number | string | null; // Can be number (event_id) or string (user_id UUID)
  target_type: string;
  persona_group_id: number | null;
  ghost_user_ids: string[] | null;
  metadata: any;
}

serve(async (req) => {
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

        for (const userId of participants) {
          try {
            // Random delay between actions
            const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            await new Promise((resolve) => setTimeout(resolve, delay * 1000));

            // Execute the action
            const result = await executeGhostAction(
              supabase,
              userId,
              action,
              personaGroup
            );

            if (result.success) {
              successCount++;
              // Log success
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
              // Log failure
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
  } catch (error: any) {
    console.error("Error in process-ghost-actions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

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
            })
            .select()
            .single();
          
          if (likeStoryError && !likeStoryError.message.includes("duplicate")) {
            console.error(`Error liking story ${story.id}:`, likeStoryError);
            // Continue with other stories even if one fails
            continue;
          }
          
          // Update story likes count
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
        
        // Convert target_id to number if it exists (for event_id)
        const storyEventId = action.target_id 
          ? (typeof action.target_id === 'string' ? parseInt(action.target_id) : action.target_id)
          : null;
        
        const { error: createStoryError } = await supabase
          .from("stories")
          .insert({
            user_id: ghostUserId,
            event_id: storyEventId,
            content: storyContent,
            caption: storyContent,
            media_url: storyMedia,
            media_type: mediaType, // Always set to 'image' or 'video', never null
          });
        if (createStoryError) {
          console.error("Error creating story:", createStoryError);
          throw createStoryError;
        }
        break;

      case "follow_user":
        if (!action.target_id) throw new Error("Target ID required");
        // target_id is a UUID string for user actions
        const targetUserId = typeof action.target_id === 'number' 
          ? action.target_id.toString() 
          : action.target_id;
        
        const { error: followError } = await supabase
          .from("follows")
          .insert({
            follower_id: ghostUserId,
            following_id: targetUserId,
          })
          .select()
          .single();
        if (followError && !followError.message.includes("duplicate")) {
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
