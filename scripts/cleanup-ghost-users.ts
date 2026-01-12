/**
 * Cleanup Ghost Users Script
 * Deletes all existing ghost accounts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupGhostUsers() {
  console.log('🧹 Cleaning up existing ghost accounts...\n');

  try {
    // Get all ghost users
    const { data: ghosts, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('is_ghost', true);

    if (error) {
      console.error('❌ Error fetching ghost users:', error);
      process.exit(1);
    }

    if (!ghosts || ghosts.length === 0) {
      console.log('✅ No ghost accounts found. Nothing to clean up.');
      return;
    }

    console.log(`Found ${ghosts.length} ghost accounts to delete...\n`);

    // Delete each ghost user
    let deleted = 0;
    let failed = 0;

    for (const ghost of ghosts) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(ghost.id);
        deleted++;
        console.log(`✅ Deleted ${ghost.username || ghost.id}`);
      } catch (error: any) {
        failed++;
        console.error(`❌ Failed to delete ${ghost.username || ghost.id}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Deleted: ${deleted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`\n✨ Cleanup complete!`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

cleanupGhostUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
