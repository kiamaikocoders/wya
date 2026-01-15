// Process Ghost Actions Edge Function
// This function processes queued ghost actions with randomized timing
// Should be called via cron or webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GhostAction {
  id: number;
  action_type: string;
  target_id: number | null;
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

        // Filter users based on engagement rate
        const numParticipants = Math.floor(ghostUserIds.length * engagementRate);
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
                p_target_id: action.target_id,
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
                p_target_id: action.target_id,
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
              p_target_id: action.target_id,
              p_target_type: action.target_type,
              p_success: false,
              p_error_message: error.message,
            });
          }
        }

        // Mark action as completed
        await supabase.rpc("update_ghost_action_status", {
          p_queue_id: action.id,
          p_status: "completed",
        });

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
        if (!action.target_id) throw new Error("Target ID required");
        const { error: likeStoryError } = await supabase
          .from("story_likes")
          .insert({
            story_id: action.target_id,
            user_id: ghostUserId,
          })
          .select()
          .single();
        if (likeStoryError && !likeStoryError.message.includes("duplicate")) {
          throw likeStoryError;
        }
        // Update story likes count
        await supabase.rpc("increment_story_likes_count", {
          p_story_id: action.target_id,
        });
        break;

      case "like_post":
        if (!action.target_id) throw new Error("Target ID required");
        const { error: likePostError } = await supabase
          .from("forum_post_likes")
          .insert({
            post_id: action.target_id,
            user_id: ghostUserId,
          })
          .select()
          .single();
        if (likePostError && !likePostError.message.includes("duplicate")) {
          throw likePostError;
        }
        // Update post likes count
        await supabase.rpc("like_forum_post", {
          p_post_id: action.target_id,
        });
        break;

      case "like_community_post":
        if (!action.target_id) throw new Error("Target ID required");
        const { error: likeCommError } = await supabase
          .from("community_post_likes")
          .insert({
            post_id: action.target_id,
            user_id: ghostUserId,
          })
          .select()
          .single();
        if (likeCommError && !likeCommError.message.includes("duplicate")) {
          throw likeCommError;
        }
        // Update community post likes count
        const { data: currentPost } = await supabase
          .from("community_posts")
          .select("likes_count")
          .eq("id", action.target_id)
          .single();
        
        await supabase
          .from("community_posts")
          .update({
            likes_count: (currentPost?.likes_count || 0) + 1,
          })
          .eq("id", action.target_id);
        break;

      case "create_story":
        const storyContent = action.metadata?.content || "Great event! 🎉";
        const storyMedia = action.metadata?.media_url || null;
        
        // Determine media type from URL or default to 'image'
        let mediaType = "image";
        if (storyMedia) {
          // Check if it's a video based on file extension
          const videoExtensions = ['.mp4', '.webm', '.mov', '.quicktime'];
          const isVideo = videoExtensions.some(ext => storyMedia.toLowerCase().includes(ext));
          mediaType = isVideo ? "video" : "image";
        }
        
        const { error: createStoryError } = await supabase
          .from("stories")
          .insert({
            user_id: ghostUserId,
            event_id: action.target_id || null,
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

      case "create_post":
        const postContent = action.metadata?.content || "Interesting topic!";
        const postTitle = action.metadata?.title || "New Post";
        const { error: createPostError } = await supabase
          .from("forum_posts")
          .insert({
            user_id: ghostUserId,
            event_id: action.target_id || null,
            title: postTitle,
            content: postContent,
          });
        if (createPostError) throw createPostError;
        break;

      case "follow_user":
        if (!action.target_id) throw new Error("Target ID required");
        const { error: followError } = await supabase
          .from("follows")
          .insert({
            follower_id: ghostUserId,
            following_id: action.target_id.toString(),
          })
          .select()
          .single();
        if (followError && !followError.message.includes("duplicate")) {
          throw followError;
        }
        break;


      case "create_community_post":
        const communityPostTitle = action.metadata?.title || "Community Discussion";
        const communityPostContent = action.metadata?.content || "Great topic to discuss!";
        const communityPostCategory = action.metadata?.category || "general";
        const communityPostMedia = action.metadata?.media_url || null;
        const { error: createCommunityPostError } = await supabase
          .from("community_posts")
          .insert({
            user_id: ghostUserId,
            title: communityPostTitle,
            content: communityPostContent,
            category: communityPostCategory,
            media_url: communityPostMedia,
            media_type: communityPostMedia ? "image" : null,
          });
        if (createCommunityPostError) throw createCommunityPostError;
        break;

      default:
        return { success: false, error: `Unknown action type: ${action.action_type}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
