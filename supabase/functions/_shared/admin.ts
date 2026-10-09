import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Platform admin check against public.admin_users. `client` must be a service-role client. */
export async function isPlatformAdmin(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("isPlatformAdmin:", error.message);
    return false;
  }
  return Boolean(data);
}

/** All platform admin user ids. `client` must be a service-role client. */
export async function listPlatformAdminIds(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client.from("admin_users").select("user_id");
  if (error) {
    console.error("listPlatformAdminIds:", error.message);
    return [];
  }
  return (data ?? []).map((row: { user_id: string }) => row.user_id);
}
