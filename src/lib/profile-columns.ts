import { supabase } from './supabase';

/**
 * Profile columns readable for any user. Everything else on `profiles` (phone, birth date,
 * coordinates, consent and account status) is only available via the `get_my_profile`
 * and `admin_profiles` RPCs.
 */
export const PUBLIC_PROFILE_COLUMNS =
  'id, username, full_name, avatar_url, bio, location, profile_visibility, favorite_categories, created_at, updated_at';

/** Full `profiles` rows for admins; chain `.select()` / filters like a table query. */
export function adminProfiles(options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
  // Generated types declare no-arg functions as `Args: never`, which blocks passing options.
  return supabase.rpc('admin_profiles', undefined as never, options);
}
