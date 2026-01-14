/**
 * Update Ghost User Avatars Script
 * Updates existing ghost users' avatars to fun, diverse images
 * (animations, scenic views, abstract art, fun graphics)
 * 
 * IMPORTANT: This script requires the Supabase SERVICE ROLE KEY
 * 
 * Usage:
 * SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/update-ghost-avatars.ts
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

/**
 * Generate fun, diverse avatar URLs
 * Mix of animations, scenic views, abstract art, and fun graphics
 */
function generateFunAvatarUrl(userIndex: number, userId: string): string {
  // Use userIndex as seed for consistency
  const seed = userIndex;
  
  // Categorize avatars into different types
  const avatarType = seed % 4; // 0-3 for 4 different types
  
  switch (avatarType) {
    case 0: // Animations & Cartoons (DiceBear Avataaars)
      // Fun cartoon-style avatars with various expressions
      const avataaarSeed = `avatar_${seed}_${userId.substring(0, 8)}`;
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avataaarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    case 1: // Scenic Views & Nature (Picsum Photos)
      // Beautiful scenic photos (mountains, landscapes, nature)
      const picsumSeed = 1000 + seed; // Offset to get scenic images
      return `https://picsum.photos/seed/${picsumSeed}/400/400`;
    
    case 2: // Abstract & Artistic (DiceBear Shapes)
      // Colorful abstract shapes and patterns
      const shapesSeed = `shapes_${seed}_${userId.substring(0, 8)}`;
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${shapesSeed}&backgroundColor=ffd5dc,b6e3f4,c0aede,d1d4f9,ffdfbf`;
    
    case 3: // Fun Graphics & Icons (DiceBear Bottts)
      // Robot/tech-style fun avatars
      const botttsSeed = `bot_${seed}_${userId.substring(0, 8)}`;
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${botttsSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    
    default:
      // Fallback to scenic photos
      return `https://picsum.photos/seed/${seed}/400/400`;
  }
}

async function updateGhostAvatars() {
  console.log('🎨 Starting ghost avatar update...\n');

  // Fetch all ghost users
  const { data: ghostUsers, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .eq('is_ghost', true)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching ghost users:', fetchError);
    process.exit(1);
  }

  if (!ghostUsers || ghostUsers.length === 0) {
    console.log('⚠️  No ghost users found.');
    process.exit(0);
  }

  console.log(`📋 Found ${ghostUsers.length} ghost users to update\n`);

  let successCount = 0;
  let failCount = 0;

  // Update each user's avatar
  for (let i = 0; i < ghostUsers.length; i++) {
    const user = ghostUsers[i];
    const newAvatarUrl = generateFunAvatarUrl(i + 1, user.id);

    process.stdout.write(`Updating ${user.username}... `);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('id', user.id);

    if (updateError) {
      console.log('❌');
      console.error(`   Error: ${updateError.message}`);
      failCount++;
    } else {
      console.log('✅');
      successCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`\n🎉 Avatar update completed!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Check profiles in Supabase Dashboard → Table Editor → profiles`);
  console.log(`   2. View updated avatars in Admin Dashboard → Ghost Management`);
}

// Run the update function
updateGhostAvatars()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
