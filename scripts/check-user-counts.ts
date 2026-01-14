/**
 * Check User Counts Script
 * Verifies real users vs ghost users and identifies duplicates
 * 
 * Usage:
 * SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/check-user-counts.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserCounts() {
  console.log('🔍 Checking user counts...\n');

  // Get all profiles
  const { data: allProfiles, error: allError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, is_ghost, created_at')
    .order('created_at', { ascending: true });

  if (allError) {
    console.error('❌ Error fetching profiles:', allError);
    process.exit(1);
  }

  // Separate real and ghost users
  const realUsers = allProfiles?.filter(p => !p.is_ghost) || [];
  const ghostUsers = allProfiles?.filter(p => p.is_ghost) || [];

  console.log('📊 User Counts:');
  console.log(`   Total Profiles: ${allProfiles?.length || 0}`);
  console.log(`   Real Users: ${realUsers.length}`);
  console.log(`   Ghost Users: ${ghostUsers.length}`);
  console.log(`   Expected: 9 real + 50 ghost = 59 total\n`);

  // Check for duplicate usernames
  const usernameMap = new Map<string, number>();
  allProfiles?.forEach(profile => {
    if (profile.username) {
      const count = usernameMap.get(profile.username) || 0;
      usernameMap.set(profile.username, count + 1);
    }
  });

  const duplicates = Array.from(usernameMap.entries())
    .filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log('⚠️  Duplicate Usernames Found:');
    duplicates.forEach(([username, count]) => {
      console.log(`   "${username}": ${count} occurrences`);
    });
    console.log('');
  } else {
    console.log('✅ No duplicate usernames found\n');
  }

  // Show ghost users grouped by username pattern
  if (ghostUsers.length > 50) {
    console.log(`⚠️  Too many ghost users! Expected 50, found ${ghostUsers.length}`);
    console.log('\n📋 Ghost Users (showing first 10):');
    ghostUsers.slice(0, 10).forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.username} (${user.full_name}) - Created: ${user.created_at}`);
    });
    console.log(`   ... and ${ghostUsers.length - 10} more\n`);
  } else {
    console.log(`✅ Ghost user count is correct: ${ghostUsers.length}\n`);
  }

  // Show real users
  console.log('👥 Real Users:');
  realUsers.forEach((user, idx) => {
    console.log(`   ${idx + 1}. ${user.username} (${user.full_name || 'No name'})`);
  });

  return {
    total: allProfiles?.length || 0,
    real: realUsers.length,
    ghost: ghostUsers.length,
    duplicates: duplicates.length
  };
}

// Run the check
checkUserCounts()
  .then((stats) => {
    console.log('\n📊 Summary:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Real: ${stats.real}`);
    console.log(`   Ghost: ${stats.ghost}`);
    console.log(`   Duplicates: ${stats.duplicates}`);
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
