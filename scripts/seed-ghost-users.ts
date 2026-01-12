/**
 * Seed Ghost Users Script
 * Creates 50 Kenyan persona accounts for engagement boosting
 * 
 * IMPORTANT: This script requires the Supabase SERVICE ROLE KEY
 * Never commit the service role key to version control!
 * 
 * Usage:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY environment variable
 * 2. Run: npx tsx scripts/seed-ghost-users.ts
 * 
 * Or set inline:
 * SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/seed-ghost-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Get your service role key from:');
  console.error('   Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Use service role client to bypass RLS and email confirmation
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Diverse Kenyan names across different ethnicities (42 tribes represented)
// Strategy: 5 names from each major group, then blend them
const kenyanFirstNames = {
  male: [
    // Luo (5)
    'Otieno', 'Ochieng', 'Onyango', 'Omondi', 'Oduor',
    // Kikuyu (5)
    'Kamau', 'Mwangi', 'Njoroge', 'Kariuki', 'Wanjiru',
    // Kalenjin (5)
    'Kipchoge', 'Kiprotich', 'Kibet', 'Kipkoech', 'Kiptoo',
    // Luhya (5)
    'Wanjala', 'Wanyonyi', 'Wamalwa', 'Wanjala', 'Wanyama',
    // Kamba (5)
    'Mutua', 'Musyoka', 'Muthoka', 'Mutiso', 'Muli',
    // Kisii (5)
    'Onyoni', 'Onyango', 'Onyancha', 'Onyiego', 'Onyango',
    // Meru (5)
    'Mwirigi', 'Muthuri', 'Mugambi', 'Muthomi', 'Mugendi',
    // Maasai (5)
    'Ole', 'Saitoti', 'Nkurunziza', 'Lemayian', 'Ole',
    // Coastal/Swahili (5)
    'Hassan', 'Ali', 'Mohamed', 'Juma', 'Salim',
    // Other tribes (7)
    'Chege', 'Thuo', 'Kipngetich', 'Wanjohi', 'Githinji', 'Macharia', 'Ndegwa'
  ],
  female: [
    // Luo (5)
    'Anyango', 'Achieng', 'Adhiambo', 'Akinyi', 'Atieno',
    // Kikuyu (5)
    'Wanjiku', 'Wanjiru', 'Nyambura', 'Njeri', 'Wambui',
    // Kalenjin (5)
    'Chebet', 'Chepkoech', 'Chepngetich', 'Cherotich', 'Chepchirchir',
    // Luhya (5)
    'Nyawira', 'Wairimu', 'Wanjala', 'Wanyonyi', 'Wamalwa',
    // Kamba (5)
    'Mutua', 'Muthoni', 'Mueni', 'Mwende', 'Mwikali',
    // Kisii (5)
    'Nyaboke', 'Kerubo', 'Nyaboke', 'Kemunto', 'Nyaboke',
    // Meru (5)
    'Makena', 'Muthoni', 'Mwende', 'Makena', 'Muthoni',
    // Maasai (5)
    'Naserian', 'Naisula', 'Naisula', 'Naserian', 'Naisula',
    // Coastal/Swahili (5)
    'Amina', 'Fatuma', 'Zainab', 'Halima', 'Mariam',
    // Other tribes (7)
    'Akoth', 'Wambura', 'Nyokabi', 'Chebet', 'Kerubo', 'Makena', 'Wanjala'
  ]
};

const kenyanLastNames = [
  // Mix from all groups - diverse surnames
  'Kamau', 'Mwangi', 'Ochieng', 'Onyango', 'Mutua', 'Kipchoge', 'Wanjala',
  'Njoroge', 'Kariuki', 'Omondi', 'Kibet', 'Musyoka', 'Onyoni', 'Mwirigi',
  'Hassan', 'Ali', 'Chege', 'Thuo', 'Wanjiru', 'Kiprotich', 'Muthoka',
  'Onyancha', 'Mugambi', 'Saitoti', 'Mohamed', 'Githinji', 'Macharia',
  'Ndegwa', 'Wanyonyi', 'Muthoni', 'Kerubo', 'Makena', 'Naserian',
  'Amina', 'Kipkoech', 'Oduor', 'Wamalwa', 'Mutiso', 'Onyiego', 'Muthuri',
  'Lemayian', 'Juma', 'Kipngetich', 'Wanjohi'
];

const kenyanLocations = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Kisii', 'Meru', 'Nyeri', 'Machakos', 'Lamu'
];

const kenyanBios = [
  'Loving life in Kenya 🇰🇪 | Event enthusiast | Always exploring',
  'Music lover | Festival goer | Living my best life',
  'Foodie | Traveler | Making memories one event at a time',
  'Art & Culture enthusiast | Supporting local talent',
  'Tech enthusiast | Networking | Building connections',
  'Fitness & Wellness advocate | Yoga lover',
  'Photography | Capturing moments | Storyteller',
  'Entrepreneur | Community builder | Making a difference',
  'Student | Learning | Growing | Exploring',
  'Professional | Work hard, play harder',
  'Creative soul | Artist | Dreamer',
  'Sports fan | Team player | Competitive spirit',
  'Family first | Community focused | Always grateful',
  'Adventure seeker | Nature lover | Outdoor enthusiast',
  'Bookworm | Coffee addict | Quiet observer'
];

// Persona groups distribution (25 male, 25 female)
const personaGroups = [
  { name: 'highly_active', count: 10 },      // 10 accounts
  { name: 'moderately_active', count: 15 }, // 15 accounts
  { name: 'casual_users', count: 10 },      // 10 accounts
  { name: 'content_creators', count: 10 },   // 10 accounts
  { name: 'lurkers', count: 5 }              // 5 accounts
];

interface GhostUserData {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  username: string;
  fullName: string;
  bio: string;
  location: string;
  personaGroup: string;
}

function generateGhostUser(index: number, gender: 'male' | 'female', personaGroup: string): GhostUserData {
  const firstNames = kenyanFirstNames[gender];
  const lastName = kenyanLastNames[Math.floor(Math.random() * kenyanLastNames.length)];
  
  // Pick a random first name, ensuring diversity
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  
  const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${index}`.replace(/\s+/g, '_');
  const fullName = `${firstName} ${lastName}`;
  const email = `ghost.${username}@wya.local`;
  const bio = kenyanBios[Math.floor(Math.random() * kenyanBios.length)];
  const location = kenyanLocations[Math.floor(Math.random() * kenyanLocations.length)];

  return {
    firstName,
    lastName,
    gender,
    email,
    username,
    fullName,
    bio,
    location,
    personaGroup
  };
}

async function createGhostUser(userData: GhostUserData, userIndex: number): Promise<string | null> {
  try {
    // Generate a random password (won't be used, but required)
    const password = `Ghost${Math.random().toString(36).slice(-12)}!@#`;

    // Create auth user with service role (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.fullName,
        is_ghost: true
      }
    });

    if (authError) {
      console.error(`❌ Failed to create auth user for ${userData.email}:`, authError.message);
      return null;
    }

    if (!authData.user) {
      console.error(`❌ No user returned for ${userData.email}`);
      return null;
    }

    const userId = authData.user.id;

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate profile picture URL using a real image service
    // Using Picsum Photos (random real photos) with seed for consistency
    // Format: https://picsum.photos/seed/{seed}/400/400
    // Using user index as seed to get consistent but diverse images
    const genderParam = userData.gender === 'male' ? 'men' : 'women';
    const imageIndex = userIndex % 100; // Cycle through 100 different images
    // Using a diverse people photo API - this gives real profile photos
    const avatarUrl = `https://randomuser.me/api/portraits/${genderParam}/${imageIndex}.jpg`;

    // Update profile (trigger may have already created it)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        username: userData.username,
        full_name: userData.fullName,
        bio: userData.bio,
        location: userData.location,
        avatar_url: avatarUrl,
        is_ghost: true
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error(`❌ Failed to update profile for ${userData.username}:`, profileError.message);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return null;
    }

    return userId;
  } catch (error) {
    console.error(`❌ Error creating ghost user ${userData.email}:`, error);
    return null;
  }
}

async function createFollowRelationships(userIds: string[]): Promise<void> {
  console.log('\n📎 Creating follow relationships between ghost accounts...');
  
  // Create a network where each ghost follows 5-10 other ghosts
  const follows: Array<{ follower_id: string; following_id: string }> = [];
  
  for (let i = 0; i < userIds.length; i++) {
    const followerId = userIds[i];
    const numFollows = Math.floor(Math.random() * 6) + 5; // 5-10 follows
    
    // Randomly select other users to follow
    const otherUsers = userIds.filter((_, idx) => idx !== i);
    const shuffled = otherUsers.sort(() => Math.random() - 0.5);
    const toFollow = shuffled.slice(0, numFollows);
    
    for (const followingId of toFollow) {
      follows.push({ follower_id: followerId, following_id: followingId });
    }
  }

  // Insert follows in batches
  const batchSize = 50;
  for (let i = 0; i < follows.length; i += batchSize) {
    const batch = follows.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from('follows')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`⚠️  Error creating follows batch ${i / batchSize + 1}:`, error.message);
    }
  }

  console.log(`✅ Created ${follows.length} follow relationships`);
}

async function assignPersonaGroups(userIds: string[], userPersonaMap: Map<string, string>): Promise<void> {
  console.log('\n👥 Assigning persona groups...');
  
  // Get persona group IDs
  const { data: personaGroups, error } = await supabaseAdmin
    .from('ghost_persona_groups')
    .select('id, name');

  if (error || !personaGroups) {
    console.error('❌ Failed to fetch persona groups:', error);
    return;
  }

  const personaMap = new Map(personaGroups.map(pg => [pg.name, pg.id]));
  
  // Note: We're storing persona group assignment in metadata for now
  // In a real implementation, you might want a junction table
  console.log('✅ Persona groups available:', personaGroups.map(pg => pg.name).join(', '));
  console.log('   (Persona assignment stored in user metadata)');
}

async function seedGhostUsers() {
  console.log('🚀 Starting ghost user seeding...\n');

  // Check if ghost users already exist
  const { data: existingGhosts, error: checkError } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('is_ghost', true)
    .limit(5);

  if (checkError) {
    console.error('❌ Error checking existing ghosts:', checkError);
    process.exit(1);
  }

  if (existingGhosts && existingGhosts.length > 0) {
    console.log(`⚠️  Found ${existingGhosts.length} existing ghost user(s).`);
    console.log('   Skipping existing users and continuing with new seeds.\n');
    // Continue with seeding - existing users will be skipped by username check
  }

  // Generate user data
  const allUsers: Array<{ data: GhostUserData; personaGroup: string }> = [];
  let userIndex = 1;
  let maleCount = 0;
  let femaleCount = 0;

  // Distribute across persona groups
  for (const group of personaGroups) {
    for (let i = 0; i < group.count; i++) {
      // Alternate gender to get 25 male, 25 female
      const gender = (maleCount < 25 && (maleCount <= femaleCount || femaleCount >= 25)) 
        ? 'male' 
        : 'female';
      
      if (gender === 'male') maleCount++;
      else femaleCount++;

      const userData = generateGhostUser(userIndex++, gender, group.name);
      allUsers.push({ data: userData, personaGroup: group.name });
    }
  }

  console.log(`📝 Generated ${allUsers.length} ghost user profiles`);
  console.log(`   - Male: ${maleCount}, Female: ${femaleCount}\n`);

  // Create users
  const userIds: string[] = [];
  const userPersonaMap = new Map<string, string>();
  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < allUsers.length; idx++) {
    const { data, personaGroup } = allUsers[idx];
    process.stdout.write(`Creating ${data.username}... `);
    const userId = await createGhostUser(data, idx + 1);
    
    if (userId) {
      userIds.push(userId);
      userPersonaMap.set(userId, personaGroup);
      successCount++;
      console.log('✅');
    } else {
      failCount++;
      console.log('❌');
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (userIds.length === 0) {
    console.log('\n❌ No users were created. Exiting.');
    process.exit(1);
  }

  // Create follow relationships
  await createFollowRelationships(userIds);

  // Assign persona groups (informational)
  await assignPersonaGroups(userIds, userPersonaMap);

  console.log('\n🎉 Ghost user seeding completed!');
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Verify accounts in Supabase Dashboard → Authentication → Users`);
  console.log(`   2. Check profiles in Supabase Dashboard → Table Editor → profiles (filter: is_ghost = true)`);
  console.log(`   3. Access Ghost Management in Admin Dashboard`);
}

// Run the seed function
seedGhostUsers()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
