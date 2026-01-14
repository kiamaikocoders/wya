/**
 * Cleanup ALL Ghost Users Script
 * Deletes ALL ghost accounts (by email pattern and is_ghost flag)
 * 
 * Usage:
 * SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/cleanup-all-ghost-users.ts
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

async function cleanupAllGhostUsers() {
  console.log('🧹 Cleaning up ALL ghost accounts...\n');

  try {
    // Get all ghost users by is_ghost flag
    const { data: ghostsByFlag, error: flagError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('is_ghost', true);

    if (flagError) {
      console.error('❌ Error fetching ghost users by flag:', flagError);
    }

    // Get all auth users with ghost email pattern
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    const ghostAuthUsers = authUsers?.users.filter(u => 
      u.email?.includes('ghost.') && u.email?.endsWith('@wya.local')
    ) || [];

    // Combine and deduplicate
    const allGhostIds = new Set<string>();
    const allGhosts: Array<{ id: string; username: string; email?: string }> = [];

    // Add ghosts by flag
    (ghostsByFlag || []).forEach(ghost => {
      if (!allGhostIds.has(ghost.id)) {
        allGhostIds.add(ghost.id);
        allGhosts.push({ id: ghost.id, username: ghost.username || ghost.id });
      }
    });

    // Add ghosts by email pattern
    ghostAuthUsers.forEach(authUser => {
      if (!allGhostIds.has(authUser.id)) {
        allGhostIds.add(authUser.id);
        allGhosts.push({ 
          id: authUser.id, 
          username: authUser.user_metadata?.username || authUser.email || authUser.id,
          email: authUser.email 
        });
      }
    });

    if (allGhosts.length === 0) {
      console.log('✅ No ghost accounts found. Nothing to clean up.');
      return;
    }

    console.log(`Found ${allGhosts.length} ghost accounts to delete...\n`);

    // Delete each ghost user (from auth AND profiles)
    let deleted = 0;
    let failed = 0;

    for (const ghost of allGhosts) {
      try {
        // Delete from auth.users (should cascade to profiles, but we'll also delete profile explicitly)
        await supabaseAdmin.auth.admin.deleteUser(ghost.id);
        
        // Also delete profile directly to ensure cleanup
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', ghost.id);
        
        deleted++;
        if (deleted % 10 === 0) {
          process.stdout.write(`Deleted ${deleted}/${allGhosts.length}...\r`);
        }
      } catch (error: any) {
        // If auth user doesn't exist, try to delete profile anyway
        if (error.message?.includes('User not found')) {
          try {
            await supabaseAdmin
              .from('profiles')
              .delete()
              .eq('id', ghost.id);
            deleted++;
            if (deleted % 10 === 0) {
              process.stdout.write(`Deleted ${deleted}/${allGhosts.length}...\r`);
            }
          } catch (profileError: any) {
            failed++;
            console.error(`\n❌ Failed to delete profile ${ghost.username || ghost.id}:`, profileError.message);
          }
        } else {
          failed++;
          console.error(`\n❌ Failed to delete ${ghost.username || ghost.id}:`, error.message);
        }
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Deleted: ${deleted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`\n✨ Cleanup complete!`);
    console.log(`\n📋 Next step: Run seed-ghost-users.ts to create exactly 50 ghost users`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

cleanupAllGhostUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
